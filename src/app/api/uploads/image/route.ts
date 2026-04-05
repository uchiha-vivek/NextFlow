import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadBufferToTransloadit } from "@/lib/transloadit";
import { useLogger, withEvlog } from "@/lib/evlog";

export const runtime = "nodejs";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Accepts an image upload, validates the MIME type, and returns the public Transloadit URL.
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
      log.set({ upload: { kind: "image", validFile: false } });
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    log.set({
      upload: {
        kind: "image",
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });

    if (!allowedImageTypes.has(file.type)) {
      return NextResponse.json(
        {
          error: "Unsupported image type. Allowed: jpg, jpeg, png, webp, gif.",
        },
        { status: 400 },
      );
    }

    const templateId = process.env.TRANSLOADIT_IMAGE_TEMPLATE_ID;

    if (!templateId) {
      return NextResponse.json(
        { error: "Missing TRANSLOADIT_IMAGE_TEMPLATE_ID." },
        { status: 500 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadBufferToTransloadit({
      buffer,
      fileName: file.name,
      fieldName: "image_file",
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
    log.error(error instanceof Error ? error : new Error("Unable to upload image"));

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload image",
      },
      { status: 500 },
    );
  }
});
