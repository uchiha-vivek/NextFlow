import fs from "node:fs/promises";
import path from "node:path";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import {
  createTempWorkspace,
  downloadFile,
  extractFrameFile,
  extractFramePayloadSchema,
  removeTempWorkspace,
} from "@/lib/media-workflows";
import { uploadFileToTransloadit } from "@/lib/transloadit";

export const extractFrameTask = schemaTask({
  id: "extract-frame",
  schema: extractFramePayloadSchema,
  run: async (payload) => {
    const workspace = await createTempWorkspace("nextflow-frame");
    const inputPath = path.join(workspace, "input-video");
    const outputPath = path.join(workspace, "frame.png");

    try {
      logger.log("Downloading source video", { videoUrl: payload.video_url });
      await downloadFile(payload.video_url, inputPath);

      logger.log("Extracting frame with ffmpeg", {
        videoUrl: payload.video_url,
        timestamp: payload.timestamp,
      });
      await extractFrameFile(inputPath, outputPath, payload.timestamp);

      const stats = await fs.stat(outputPath);
      logger.log("Uploading extracted frame to Transloadit", {
        outputBytes: stats.size,
      });

      const uploaded = await uploadFileToTransloadit({
        filePath: outputPath,
        fieldName: "frame_image",
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
