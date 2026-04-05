import { auth } from "@clerk/nextjs/server";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { extractFramePayloadSchema } from "@/lib/media-workflows";
import { useLogger, withEvlog } from "@/lib/evlog";
import {
  beginSingleNodeRun,
  finishSingleNodeRun,
  WorkflowRunScope,
  WorkflowRunStatus,
} from "@/lib/workflow-history";

export const runtime = "nodejs";

/**
 * Runs the extract-frame Trigger.dev task and mirrors the result into workflow history.
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
    const payload = extractFramePayloadSchema.parse(json);
    log.set({
      auth: { userId },
      workflow: {
        nodeType: "extractFrame",
        timestamp: payload.timestamp,
      },
    });
    const metadata = {
      nodeId: typeof json.nodeId === "string" ? json.nodeId : undefined,
      nodeType: "extractFrame",
      nodeTitle:
        typeof json.nodeTitle === "string" ? json.nodeTitle : "Extract Frame from Video",
      scope: WorkflowRunScope.SINGLE,
      summary: "Extract frame node run",
    };
    const runRecord = await beginSingleNodeRun({
      userId,
      metadata,
      inputs: payload,
    });
    workflowRunId = runRecord?.workflowRunId;
    nodeRunId = runRecord?.nodeRunId;

    const handle = await tasks.trigger("extract-frame", payload);
    log.set({ trigger: { taskId: "extract-frame", runId: handle.id } });
    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

    if (!run.isSuccess || !run.output) {
      log.error(new Error(run.error?.message ?? "Extract frame task failed"));

      if (workflowRunId) {
        await finishSingleNodeRun({
          workflowRunId,
          nodeRunId,
          status: WorkflowRunStatus.FAILED,
          error: run.error?.message ?? "Extract frame task failed",
          triggerRunId: handle.id,
          startedAt,
        });
      }

      return NextResponse.json(
        {
          error: run.error?.message ?? "Extract frame task failed",
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

    log.set({ workflow: { nodeType: "extractFrame", completed: true } });
    return NextResponse.json(run.output);
  } catch (error) {
    log.error(error instanceof Error ? error : new Error("Unable to extract frame"));

    if (workflowRunId) {
      await finishSingleNodeRun({
        workflowRunId,
        nodeRunId,
        status: WorkflowRunStatus.FAILED,
        error: error instanceof Error ? error.message : "Unable to extract frame",
        startedAt,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to extract frame",
      },
      { status: 400 },
    );
  }
});
