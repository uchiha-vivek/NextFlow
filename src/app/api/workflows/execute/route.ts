import { auth } from "@clerk/nextjs/server";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getInboundSources,
  getScopeSummary,
  getTopologicalLevels,
  isPublicHttpUrl,
  resolveConnectedMediaInput,
  resolveLlmInputs,
} from "@/lib/workflow-execution-utils";
import {
  beginWorkflowRun,
  finishWorkflowRun,
  updateWorkflowNodeRun,
  WorkflowRunScope,
  WorkflowRunStatus,
} from "@/lib/workflow-history";

const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  selected: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()),
});

const workflowEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  targetHandle: z.string().nullable().optional(),
});

const executeWorkflowSchema = z.object({
  scope: z.enum([WorkflowRunScope.FULL, WorkflowRunScope.GROUP]),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
});

type ExecutionResult = {
  nodeId: string;
  nodeType: string;
  nodeTitle: string;
  status: (typeof WorkflowRunStatus)[keyof typeof WorkflowRunStatus];
  durationMs: number;
  outputs?: Record<string, unknown>;
  error?: string;
};

type WorkflowExecutionStreamEvent =
  | {
      type: "workflow-start";
      workflowRunId: string | null;
      scope: "FULL" | "GROUP";
      nodeIds: string[];
      levelCount: number;
    }
  | {
      type: "level-start";
      levelIndex: number;
      nodeIds: string[];
    }
  | {
      type: "node-complete";
      result: ExecutionResult;
    }
  | {
      type: "workflow-complete";
      workflowRunId: string | null;
      results: ExecutionResult[];
    }
  | {
      type: "workflow-error";
      error: string;
    };

function writeEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: WorkflowExecutionStreamEvent,
) {
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

export const runtime = "nodejs";

/**
 * Executes either a full workflow or the selected subset, level by level, while syncing run history.
 */
export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const payload = executeWorkflowSchema.parse(json);
    const activeNodes =
      payload.scope === WorkflowRunScope.FULL
        ? payload.nodes
        : payload.nodes.filter((node) => node.selected);

    if (activeNodes.length === 0) {
      return NextResponse.json({ error: "No nodes selected to run" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let workflowRunId: string | undefined;
        const results: ExecutionResult[] = [];

        void (async () => {
          const allNodeMap = new Map(payload.nodes.map((node) => [node.id, node]));
          const outputTextMap = new Map<string, string>();
          const outputUrlMap = new Map<string, string>();

          for (const node of payload.nodes) {
            const textValue =
              typeof node.data.outputText === "string"
                ? node.data.outputText
                : typeof node.data.textValue === "string"
                  ? node.data.textValue
                  : "";
            const outputUrl = node.data.outputUrl;

            if (textValue) outputTextMap.set(node.id, textValue);
            if (isPublicHttpUrl(outputUrl)) outputUrlMap.set(node.id, outputUrl);
          }

          const workflowRun = await beginWorkflowRun({
            userId,
            scope: payload.scope,
            summary: getScopeSummary(payload.scope, activeNodes.length),
            nodes: activeNodes.map((node, index) => ({
              nodeId: node.id,
              nodeType: node.type,
              nodeTitle: typeof node.data.title === "string" ? node.data.title : node.type,
              inputs: node.data,
              sequence: index,
            })),
          });

          workflowRunId = workflowRun?.workflowRunId;
          const nodeRunIds = workflowRun?.nodeRunIds ?? {};
          const levels = getTopologicalLevels(activeNodes, payload.edges);

          writeEvent(controller, encoder, {
            type: "workflow-start",
            workflowRunId: workflowRun?.workflowRunId ?? null,
            scope: payload.scope,
            nodeIds: activeNodes.map((node) => node.id),
            levelCount: levels.length,
          });

          for (const [levelIndex, level] of levels.entries()) {
            writeEvent(controller, encoder, {
              type: "level-start",
              levelIndex,
              nodeIds: level,
            });

            const levelResults = await Promise.all(
              level.map(async (nodeId) => {
                const node = allNodeMap.get(nodeId);
                if (!node) return null;

                const nodeStartedAt = Date.now();
                const nodeTitle =
                  typeof node.data.title === "string" ? node.data.title : node.type;
                const fail = async (message: string) => {
                  await updateWorkflowNodeRun({
                    nodeRunId: nodeRunIds[nodeId],
                    status: WorkflowRunStatus.FAILED,
                    error: message,
                    startedAt: nodeStartedAt,
                  });

                  return {
                    nodeId,
                    nodeType: node.type,
                    nodeTitle,
                    status: WorkflowRunStatus.FAILED,
                    durationMs: Math.max(0, Date.now() - nodeStartedAt),
                    error: message,
                  } satisfies ExecutionResult;
                };

                const succeed = async (outputs: Record<string, unknown>) => {
                  await updateWorkflowNodeRun({
                    nodeRunId: nodeRunIds[nodeId],
                    status: WorkflowRunStatus.SUCCESS,
                    outputs,
                    startedAt: nodeStartedAt,
                  });

                  return {
                    nodeId,
                    nodeType: node.type,
                    nodeTitle,
                    status: WorkflowRunStatus.SUCCESS,
                    durationMs: Math.max(0, Date.now() - nodeStartedAt),
                    outputs,
                  } satisfies ExecutionResult;
                };

                try {
                  if (node.type === "text") {
                    const output =
                      typeof node.data.outputText === "string"
                        ? node.data.outputText
                        : typeof node.data.textValue === "string"
                          ? node.data.textValue
                          : "";
                    outputTextMap.set(nodeId, output);
                    return succeed({ output });
                  }

                  if (node.type === "imageUpload" || node.type === "videoUpload") {
                    if (!isPublicHttpUrl(node.data.outputUrl)) {
                      return fail("Node does not have a public uploaded URL yet");
                    }

                    outputUrlMap.set(nodeId, node.data.outputUrl);
                    return succeed({ output: node.data.outputUrl });
                  }

                  if (node.type === "crop") {
                    const imageUrl = resolveConnectedMediaInput(
                      nodeId,
                      payload.edges,
                      outputUrlMap,
                      typeof node.data.imageUrlInput === "string" ? node.data.imageUrlInput : "",
                    );

                    if (!isPublicHttpUrl(imageUrl)) {
                      return fail("Missing public image URL");
                    }

                    const triggerPayload = {
                      image_url: imageUrl,
                      x_percent: String(node.data.xPercent ?? "0"),
                      y_percent: String(node.data.yPercent ?? "0"),
                      width_percent: String(node.data.widthPercent ?? "100"),
                      height_percent: String(node.data.heightPercent ?? "100"),
                    };

                    const handle = await tasks.trigger("crop-image", triggerPayload);
                    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

                    if (!run.isSuccess || !run.output) {
                      return fail(run.error?.message ?? "Crop task failed");
                    }

                    const output = (run.output as { output?: string }).output;
                    if (isPublicHttpUrl(output)) outputUrlMap.set(nodeId, output);

                    await updateWorkflowNodeRun({
                      nodeRunId: nodeRunIds[nodeId],
                      status: WorkflowRunStatus.SUCCESS,
                      outputs: run.output as Record<string, unknown>,
                      triggerRunId: handle.id,
                      startedAt: nodeStartedAt,
                    });

                    return {
                      nodeId,
                      nodeType: node.type,
                      nodeTitle,
                      status: WorkflowRunStatus.SUCCESS,
                      durationMs: Math.max(0, Date.now() - nodeStartedAt),
                      outputs: run.output as Record<string, unknown>,
                    } satisfies ExecutionResult;
                  }

                  if (node.type === "extractFrame") {
                    const videoUrl = resolveConnectedMediaInput(
                      nodeId,
                      payload.edges,
                      outputUrlMap,
                      typeof node.data.videoUrlInput === "string" ? node.data.videoUrlInput : "",
                    );

                    if (!isPublicHttpUrl(videoUrl)) {
                      return fail("Missing public video URL");
                    }

                    const triggerPayload = {
                      video_url: videoUrl,
                      timestamp: String(node.data.timestampInput ?? "0"),
                    };

                    const handle = await tasks.trigger("extract-frame", triggerPayload);
                    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

                    if (!run.isSuccess || !run.output) {
                      return fail(run.error?.message ?? "Extract frame task failed");
                    }

                    const output = (run.output as { output?: string }).output;
                    if (isPublicHttpUrl(output)) outputUrlMap.set(nodeId, output);

                    await updateWorkflowNodeRun({
                      nodeRunId: nodeRunIds[nodeId],
                      status: WorkflowRunStatus.SUCCESS,
                      outputs: run.output as Record<string, unknown>,
                      triggerRunId: handle.id,
                      startedAt: nodeStartedAt,
                    });

                    return {
                      nodeId,
                      nodeType: node.type,
                      nodeTitle,
                      status: WorkflowRunStatus.SUCCESS,
                      durationMs: Math.max(0, Date.now() - nodeStartedAt),
                      outputs: run.output as Record<string, unknown>,
                    } satisfies ExecutionResult;
                  }

                  if (node.type === "llm") {
                    const triggerPayload = {
                      model:
                        typeof node.data.model === "string" ? node.data.model : "gpt-5.4-mini",
                      ...resolveLlmInputs(nodeId, payload.edges, outputTextMap, outputUrlMap, {
                        systemPrompt:
                          typeof node.data.systemPrompt === "string"
                            ? node.data.systemPrompt
                            : "You are a creative workflow planner.",
                        userMessage:
                          typeof node.data.userMessage === "string"
                            ? node.data.userMessage
                            : "",
                      }),
                    };

                    const handle = await tasks.trigger("run-llm", triggerPayload);
                    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

                    if (!run.isSuccess || !run.output) {
                      return fail(run.error?.message ?? "LLM task failed");
                    }

                    const output = (run.output as { output?: string }).output;
                    if (typeof output === "string") outputTextMap.set(nodeId, output);

                    await updateWorkflowNodeRun({
                      nodeRunId: nodeRunIds[nodeId],
                      status: WorkflowRunStatus.SUCCESS,
                      outputs: run.output as Record<string, unknown>,
                      triggerRunId: handle.id,
                      startedAt: nodeStartedAt,
                    });

                    return {
                      nodeId,
                      nodeType: node.type,
                      nodeTitle,
                      status: WorkflowRunStatus.SUCCESS,
                      durationMs: Math.max(0, Date.now() - nodeStartedAt),
                      outputs: run.output as Record<string, unknown>,
                    } satisfies ExecutionResult;
                  }

                  return fail("Unsupported node type");
                } catch (error) {
                  return fail(error instanceof Error ? error.message : "Node execution failed");
                }
              }),
            );

            for (const result of levelResults) {
              if (result) {
                results.push(result);
                writeEvent(controller, encoder, {
                  type: "node-complete",
                  result,
                });
              }
            }
          }

          await finishWorkflowRun({
            workflowRunId: workflowRun?.workflowRunId,
            startedAt,
            nodeStatuses: results.map((result) => result.status),
          });

          writeEvent(controller, encoder, {
            type: "workflow-complete",
            workflowRunId: workflowRun?.workflowRunId ?? null,
            results,
          });
          controller.close();
        })().catch((error) => {
          const message =
            error instanceof Error ? error.message : "Unable to execute workflow";

          void (async () => {
            if (workflowRunId) {
              await finishWorkflowRun({
                workflowRunId,
                startedAt,
                nodeStatuses: [
                  ...results.map((result) => result.status),
                  WorkflowRunStatus.FAILED,
                ],
              });
            }

            writeEvent(controller, encoder, {
              type: "workflow-error",
              error: message,
            });
            controller.close();
          })().catch(() => {
            writeEvent(controller, encoder, {
              type: "workflow-error",
              error: message,
            });
            controller.close();
          });
        });
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to execute workflow",
      },
      { status: 400 },
    );
  }
}
