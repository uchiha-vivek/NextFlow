import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { extractFramePayloadSchema } from "@/lib/media-workflows";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = extractFramePayloadSchema.parse(json);
    const handle = await tasks.trigger("extract-frame", payload);
    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

    if (!run.isSuccess || !run.output) {
      return NextResponse.json(
        {
          error: run.error?.message ?? "Extract frame task failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(run.output);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to extract frame",
      },
      { status: 400 },
    );
  }
}
