import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadBufferToTransloadit } from "@/lib/transloadit";
import { useLogger, withEvlog } from "@/lib/evlog";

export const runtime = "nodejs";

const allowedVideoTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

/**
 * Accepts a video upload, validates the MIME type, and returns the public Transloadit URL.
 */
export const POST = withEvlog(async (request: Request) => {
  const log = useLogger();

  try {
    const { userId } = await auth();
    if (!userId) {
      log.set({ auth: { status: "unauthorized" } });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.set({ auth: { userId } });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      log.set({ upload: { kind: "video", validFile: false } });
      return NextResponse.json({ error: "Video file is required." }, { status: 400 });
    }

    log.set({
      upload: {
        kind: "video",
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });

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

    log.set({
      transloadit: {
        assemblyId: uploaded.assemblyId,
      },
    });

    return NextResponse.json({
      fileName: file.name,
      outputUrl: uploaded.outputUrl,
      assemblyId: uploaded.assemblyId,
    });
  } catch (error) {
    log.error(error instanceof Error ? error : new Error("Unable to upload video"));

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload video",
      },
      { status: 500 },
    );
  }
});
