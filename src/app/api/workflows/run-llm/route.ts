import { auth } from "@clerk/nextjs/server";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { runLlmPayloadSchema } from "@/lib/azure-openai";
import {
  beginSingleNodeRun,
  finishSingleNodeRun,
  WorkflowRunScope,
  WorkflowRunStatus,
} from "@/lib/workflow-history";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let workflowRunId: string | undefined;
  let nodeRunId: string | undefined;
  const startedAt = Date.now();

  try {
    const json = await request.json();
    const payload = runLlmPayloadSchema.parse(json);
    const metadata = {
      nodeId: typeof json.nodeId === "string" ? json.nodeId : undefined,
      nodeType: "llm",
      nodeTitle: typeof json.nodeTitle === "string" ? json.nodeTitle : "Run Any LLM Node",
      scope: WorkflowRunScope.SINGLE,
      summary: "LLM node run",
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

    const handle = await tasks.trigger("run-llm", payload);
    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

    if (!run.isSuccess || !run.output) {
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

    return NextResponse.json(run.output);
  } catch (error) {
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
}
