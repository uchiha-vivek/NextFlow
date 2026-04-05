import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listWorkflowRuns } from "@/lib/workflow-history";

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
