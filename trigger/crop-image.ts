import fs from "node:fs/promises";
import path from "node:path";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import {
  createTempWorkspace,
  cropImageFile,
  cropImagePayloadSchema,
  downloadFile,
  removeTempWorkspace,
} from "@/lib/media-workflows";
import { uploadFileToTransloadit } from "@/lib/transloadit";

/**
 * Trigger.dev task that downloads a public image, crops it with ffmpeg, and re-uploads the result.
 */
export const cropImageTask = schemaTask({
  id: "crop-image",
  schema: cropImagePayloadSchema,
  run: async (payload) => {
    const workspace = await createTempWorkspace("nextflow-crop");
    const inputPath = path.join(workspace, "input");
    const outputPath = path.join(workspace, "cropped.png");

    try {
      logger.log("Downloading source image", { imageUrl: payload.image_url });
      await downloadFile(payload.image_url, inputPath);

      logger.log("Cropping image with ffmpeg", {
        imageUrl: payload.image_url,
        xPercent: payload.x_percent,
        yPercent: payload.y_percent,
        widthPercent: payload.width_percent,
        heightPercent: payload.height_percent,
      });
      await cropImageFile(inputPath, outputPath, payload);

      const stats = await fs.stat(outputPath);
      logger.log("Uploading cropped image to Transloadit", {
        outputBytes: stats.size,
      });

      const uploaded = await uploadFileToTransloadit({
        filePath: outputPath,
        fieldName: "cropped_image",
      });

      return {
        output: uploaded.outputUrl,
        assemblyId: uploaded.assemblyId,
        provider: "trigger.dev + ffmpeg",
      };
    } finally {
      await removeTempWorkspace(workspace);
    }
  },
});
