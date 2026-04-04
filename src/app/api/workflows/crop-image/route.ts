import { auth } from "@clerk/nextjs/server";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { cropImagePayloadSchema } from "@/lib/media-workflows";
import {
  beginSingleNodeRun,
  finishSingleNodeRun,
  WorkflowRunScope,
  WorkflowRunStatus,
} from "@/lib/workflow-history";

export const runtime = "nodejs";

/**
 * Runs the crop-image Trigger.dev task and records the execution in workflow history when signed in.
 */
export async function POST(request: Request) {
  let workflowRunId: string | undefined;
  let nodeRunId: string | undefined;
  const startedAt = Date.now();

  try {
    const json = await request.json();
    const payload = cropImagePayloadSchema.parse(json);
    const metadata = {
      nodeId: typeof json.nodeId === "string" ? json.nodeId : undefined,
      nodeType: "crop",
      nodeTitle: typeof json.nodeTitle === "string" ? json.nodeTitle : "Crop Image Node",
      scope: WorkflowRunScope.SINGLE,
      summary: "Crop image node run",
    };
    const { userId } = await auth();

    if (userId) {
      const runRecord = await beginSingleNodeRun({
        userId,
        metadata,
        inputs: payload,
      });
      workflowRunId = runRecord?.workflowRunId;
      nodeRunId = runRecord?.nodeRunId;
    }

    const handle = await tasks.trigger("crop-image", payload);
    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

    if (!run.isSuccess || !run.output) {
      if (workflowRunId) {
        await finishSingleNodeRun({
          workflowRunId,
          nodeRunId,
          status: WorkflowRunStatus.FAILED,
          error: run.error?.message ?? "Crop task failed",
          triggerRunId: handle.id,
          startedAt,
        });
      }

      return NextResponse.json(
        {
          error: run.error?.message ?? "Crop task failed",
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

    return NextResponse.json(run.output);
  } catch (error) {
    if (workflowRunId) {
      await finishSingleNodeRun({
        workflowRunId,
        nodeRunId,
        status: WorkflowRunStatus.FAILED,
        error: error instanceof Error ? error.message : "Unable to crop image",
        startedAt,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to crop image",
      },
      { status: 400 },
    );
  }
}
