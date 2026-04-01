import { NextResponse } from "next/server";
import { uploadBufferToTransloadit } from "@/lib/transloadit";

export const runtime = "nodejs";

const allowedVideoTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Video file is required." }, { status: 400 });
    }

    if (!allowedVideoTypes.has(file.type)) {
      return NextResponse.json(
        {
          error: "Unsupported video type. Allowed: mp4, mov, webm, m4v.",
        },
        { status: 400 },
      );
    }

    const templateId = process.env.TRANSLOADIT_VIDEO_TEMPLATE_ID;

    if (!templateId) {
      return NextResponse.json(
        { error: "Missing TRANSLOADIT_VIDEO_TEMPLATE_ID." },
        { status: 500 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadBufferToTransloadit({
      buffer,
      fileName: file.name,
      fieldName: "video_file",
      templateId,
    });

    return NextResponse.json({
      fileName: file.name,
      outputUrl: uploaded.outputUrl,
      assemblyId: uploaded.assemblyId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload video",
      },
      { status: 500 },
    );
  }
}
