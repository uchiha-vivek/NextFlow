import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteWorkflowRun, listWorkflowRuns } from "@/lib/workflow-history";

export const runtime = "nodejs";

/**
 * Returns recent workflow history for the current user; anonymous users get an empty list.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const runs = await listWorkflowRuns(userId);
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      {
        runs: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load workflow history",
      },
      { status: 200 },
    );
  }
}

/**
 * Deletes a workflow history run for the current user.
 */
export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { workflowRunId?: string };
    const workflowRunId = body.workflowRunId?.trim();

    if (!workflowRunId) {
      return NextResponse.json({ error: "Missing workflowRunId" }, { status: 400 });
    }

    const deleted = await deleteWorkflowRun({ userId, workflowRunId });

    if (!deleted) {
      return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete workflow history",
      },
      { status: 500 },
    );
  }
}
