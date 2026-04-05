import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { useLogger, withEvlog } from "@/lib/evlog";
import { deleteWorkflowRun, listWorkflowRuns } from "@/lib/workflow-history";

export const runtime = "nodejs";

/**
 * Returns recent workflow history for the current user; anonymous users get an empty list.
 */
export const GET = withEvlog(async (request: Request) => {
  const log = useLogger();
  const requestId = request.headers.get("x-request-id");
  const { userId } = await auth();

  if (requestId) {
    log.set({ request: { id: requestId } });
  }

  if (!userId) {
    log.set({ auth: { status: "unauthorized" } });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const runs = await listWorkflowRuns(userId);
    log.set({
      auth: { userId },
      workflowHistory: { count: runs.length },
    });
    return NextResponse.json({ runs });
  } catch (error) {
    log.error(
      error instanceof Error ? error : new Error("Unable to load workflow history"),
    );

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
});

/**
 * Deletes a workflow history run for the current user.
 */
export const DELETE = withEvlog(async (request: Request) => {
  const log = useLogger();
  const { userId } = await auth();

  if (!userId) {
    log.set({ auth: { status: "unauthorized" } });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { workflowRunId?: string };
    const workflowRunId = body.workflowRunId?.trim();
    log.set({
      auth: { userId },
      workflowHistory: { workflowRunId: workflowRunId ?? null },
    });

    if (!workflowRunId) {
      return NextResponse.json({ error: "Missing workflowRunId" }, { status: 400 });
    }

    const deleted = await deleteWorkflowRun({ userId, workflowRunId });

    if (!deleted) {
      return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
    }

    log.set({ workflowHistory: { workflowRunId, deleted: true } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error(
      error instanceof Error ? error : new Error("Unable to delete workflow history"),
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete workflow history",
      },
      { status: 500 },
    );
  }
});
