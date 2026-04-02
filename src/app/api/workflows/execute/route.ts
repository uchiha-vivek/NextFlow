import { auth } from "@clerk/nextjs/server";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { z } from "zod";
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

type WorkflowNodeSnapshot = z.infer<typeof workflowNodeSchema>;
type WorkflowEdgeSnapshot = z.infer<typeof workflowEdgeSchema>;

type ExecutionResult = {
  nodeId: string;
  nodeType: string;
  nodeTitle: string;
  status: (typeof WorkflowRunStatus)[keyof typeof WorkflowRunStatus];
  durationMs: number;
  outputs?: Record<string, unknown>;
  error?: string;
};

function isPublicHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function getScopeSummary(scope: "FULL" | "GROUP", count: number) {
  return scope === WorkflowRunScope.FULL
    ? "Full workflow run"
    : `${count} selected node${count === 1 ? "" : "s"} run`;
}

function getTopologicalLevels(nodes: WorkflowNodeSnapshot[], edges: WorkflowEdgeSnapshot[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const remaining = new Set(nodes.map((node) => node.id));
  const levels: string[][] = [];

  while (remaining.size > 0) {
    const currentLevel = [...remaining].filter((nodeId) => (indegree.get(nodeId) ?? 0) === 0);

    if (currentLevel.length === 0) {
      levels.push([...remaining]);
      break;
    }

    levels.push(currentLevel);

    for (const nodeId of currentLevel) {
      remaining.delete(nodeId);
      for (const targetId of adjacency.get(nodeId) ?? []) {
        indegree.set(targetId, Math.max(0, (indegree.get(targetId) ?? 0) - 1));
      }
    }
  }

  return levels;
}

function getInboundSources(
  nodeId: string,
  edges: WorkflowEdgeSnapshot[],
  handleId?: string,
) {
  return edges
    .filter((edge) => edge.target === nodeId && (handleId ? edge.targetHandle === handleId : true))
    .map((edge) => edge.source);
}

export const runtime = "nodejs";

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

    const nodeRunIds = workflowRun?.nodeRunIds ?? {};
    const levels = getTopologicalLevels(activeNodes, payload.edges);
    const results: ExecutionResult[] = [];

    for (const level of levels) {
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
              const sourceId = getInboundSources(nodeId, payload.edges)[0];
              const connectedUrl = sourceId ? outputUrlMap.get(sourceId) : null;
              const imageUrl =
                connectedUrl ??
                (typeof node.data.imageUrlInput === "string" ? node.data.imageUrlInput : "");

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
              const sourceId = getInboundSources(nodeId, payload.edges)[0];
              const connectedUrl = sourceId ? outputUrlMap.get(sourceId) : null;
              const videoUrl =
                connectedUrl ??
                (typeof node.data.videoUrlInput === "string" ? node.data.videoUrlInput : "");

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
              const systemSourceId = getInboundSources(nodeId, payload.edges, "system")[0];
              const userSourceId = getInboundSources(nodeId, payload.edges, "user")[0];
              const imageSourceIds = getInboundSources(nodeId, payload.edges, "images");
              const imageUrls = imageSourceIds
                .map((sourceId) => outputUrlMap.get(sourceId))
                .filter(isPublicHttpUrl);

              const triggerPayload = {
                model:
                  typeof node.data.model === "string" ? node.data.model : "gpt-5.4-mini",
                systemPrompt:
                  (systemSourceId ? outputTextMap.get(systemSourceId) : null) ??
                  (typeof node.data.systemPrompt === "string"
                    ? node.data.systemPrompt
                    : "You are a creative workflow planner."),
                userMessage:
                  (userSourceId ? outputTextMap.get(userSourceId) : null) ??
                  (typeof node.data.userMessage === "string"
                    ? node.data.userMessage
                    : ""),
                imageUrls,
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
        }
      }
    }

    await finishWorkflowRun({
      workflowRunId: workflowRun?.workflowRunId,
      startedAt,
      nodeStatuses: results.map((result) => result.status),
    });

    return NextResponse.json({
      workflowRunId: workflowRun?.workflowRunId ?? null,
      results,
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
