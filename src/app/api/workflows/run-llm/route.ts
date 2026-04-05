import { auth } from "@clerk/nextjs/server";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { runLlmPayloadSchema } from "@/lib/azure-openai";
import { useLogger, withEvlog } from "@/lib/evlog";
import {
  beginSingleNodeRun,
  finishSingleNodeRun,
  WorkflowRunScope,
  WorkflowRunStatus,
} from "@/lib/workflow-history";

export const runtime = "nodejs";

/**
 * Starts the workflow LLM task and stores the outcome as a single-node history entry when possible.
 */
export const POST = withEvlog(async (request: Request) => {
  let workflowRunId: string | undefined;
  let nodeRunId: string | undefined;
  const startedAt = Date.now();
  const log = useLogger();

  try {
    const { userId } = await auth();
    if (!userId) {
      log.set({ auth: { status: "unauthorized" } });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const payload = runLlmPayloadSchema.parse(json);
    log.set({
      auth: { userId },
      workflow: {
        nodeType: "llm",
        model: payload.model,
        imageCount: payload.imageUrls.length,
      },
    });
    const metadata = {
      nodeId: typeof json.nodeId === "string" ? json.nodeId : undefined,
      nodeType: "llm",
      nodeTitle: typeof json.nodeTitle === "string" ? json.nodeTitle : "Run Any LLM Node",
      scope: WorkflowRunScope.SINGLE,
      summary: "LLM node run",
    };
    const runRecord = await beginSingleNodeRun({
      userId,
      metadata,
      inputs: payload,
    });
    workflowRunId = runRecord?.workflowRunId;
    nodeRunId = runRecord?.nodeRunId;

    const handle = await tasks.trigger("run-llm", payload);
    log.set({ trigger: { taskId: "run-llm", runId: handle.id } });
    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

    if (!run.isSuccess || !run.output) {
      log.error(new Error(run.error?.message ?? "LLM task failed"));

      if (workflowRunId) {
        await finishSingleNodeRun({
          workflowRunId,
          nodeRunId,
          status: WorkflowRunStatus.FAILED,
          error: run.error?.message ?? "LLM task failed",
          triggerRunId: handle.id,
          startedAt,
        });
      }

      return NextResponse.json(
        {
          error: run.error?.message ?? "LLM task failed",
        },
        { status: 500 },
      );
    }

    if (workflowRunId) {
      await finishSingleNodeRun({
        workflowRunId,
        nodeRunId,
        status: WorkflowRunStatus.SUCCESS,
        outputs: run.output as Record<string, unknown>,
        triggerRunId: handle.id,
        startedAt,
      });
    }

    log.set({ workflow: { nodeType: "llm", completed: true } });
    return NextResponse.json(run.output);
  } catch (error) {
    log.error(error instanceof Error ? error : new Error("Unable to run LLM task"));

    if (workflowRunId) {
      await finishSingleNodeRun({
        workflowRunId,
        nodeRunId,
        status: WorkflowRunStatus.FAILED,
        error: error instanceof Error ? error.message : "Unable to run LLM task",
        startedAt,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to run LLM task",
      },
      { status: 400 },
    );
  }
});
