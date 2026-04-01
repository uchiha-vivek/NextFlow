import { runs, tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { cropImagePayloadSchema } from "@/lib/media-workflows";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = cropImagePayloadSchema.parse(json);
    const handle = await tasks.trigger("crop-image", payload);
    const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });

    if (!run.isSuccess || !run.output) {
      return NextResponse.json(
        {
          error: run.error?.message ?? "Crop task failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(run.output);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to crop image",
      },
      { status: 400 },
    );
  }
}
