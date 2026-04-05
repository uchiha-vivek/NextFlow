import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadBufferToTransloadit } from "@/lib/transloadit";

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
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

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

    return NextResponse.json({
      fileName: file.name,
      outputUrl: uploaded.outputUrl,
      assemblyId: uploaded.assemblyId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload image",
      },
      { status: 500 },
    );
  }
}
