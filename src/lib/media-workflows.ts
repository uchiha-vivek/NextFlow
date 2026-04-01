import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

export const cropImagePayloadSchema = z
  .object({
    image_url: z.string().url(),
    x_percent: z.coerce.number().min(0).max(100).default(0),
    y_percent: z.coerce.number().min(0).max(100).default(0),
    width_percent: z.coerce.number().min(0).max(100).default(100),
    height_percent: z.coerce.number().min(0).max(100).default(100),
  })
  .superRefine((payload, ctx) => {
    if (payload.x_percent + payload.width_percent > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "x_percent + width_percent must be 100 or less",
        path: ["width_percent"],
      });
    }

    if (payload.y_percent + payload.height_percent > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "y_percent + height_percent must be 100 or less",
        path: ["height_percent"],
      });
    }
  });

export const extractFramePayloadSchema = z.object({
  video_url: z.string().url(),
  timestamp: z.union([z.string(), z.number()]).optional().default(0),
});

export type CropImagePayload = z.infer<typeof cropImagePayloadSchema>;
export type ExtractFramePayload = z.infer<typeof extractFramePayloadSchema>;

type PercentTimestamp = {
  kind: "percent";
  value: number;
};

type SecondsTimestamp = {
  kind: "seconds";
  value: number;
};

type ParsedTimestamp = PercentTimestamp | SecondsTimestamp;

export async function createTempWorkspace(prefix: string) {
  return fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
}

export async function removeTempWorkspace(directory: string) {
  await fs.rm(directory, { recursive: true, force: true });
}

export async function downloadFile(inputUrl: string, outputPath: string) {
  const response = await fetch(inputUrl);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

export async function cropImageFile(
  inputPath: string,
  outputPath: string,
  payload: CropImagePayload,
) {
  const filter = [
    `crop=iw*${payload.width_percent / 100}`,
    `ih*${payload.height_percent / 100}`,
    `iw*${payload.x_percent / 100}`,
    `ih*${payload.y_percent / 100}`,
  ].join(":");

  await runProcess(getBinaryPath("ffmpeg"), [
    "-y",
    "-i",
    inputPath,
    "-vf",
    filter,
    outputPath,
  ]);
}

export async function extractFrameFile(
  inputPath: string,
  outputPath: string,
  timestamp: string | number,
) {
  const resolvedSeconds = await resolveTimestampSeconds(inputPath, timestamp);

  await runProcess(getBinaryPath("ffmpeg"), [
    "-y",
    "-ss",
    resolvedSeconds.toFixed(3),
    "-i",
    inputPath,
    "-frames:v",
    "1",
    outputPath,
  ]);
}

function getBinaryPath(binary: "ffmpeg" | "ffprobe") {
  if (binary === "ffmpeg") {
    return process.env.FFMPEG_PATH || "ffmpeg";
  }

  return process.env.FFPROBE_PATH || "ffprobe";
}

async function resolveTimestampSeconds(inputPath: string, rawTimestamp: string | number) {
  const parsed = parseTimestamp(rawTimestamp);

  if (parsed.kind === "seconds") {
    return parsed.value;
  }

  const durationSeconds = await getVideoDuration(inputPath);
  return (durationSeconds * parsed.value) / 100;
}

function parseTimestamp(rawTimestamp: string | number): ParsedTimestamp {
  if (typeof rawTimestamp === "number") {
    if (rawTimestamp < 0) {
      throw new Error("timestamp must be 0 or greater");
    }

    return {
      kind: "seconds",
      value: rawTimestamp,
    };
  }

  const trimmed = rawTimestamp.trim();

  if (!trimmed) {
    return {
      kind: "seconds",
      value: 0,
    };
  }

  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));

    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      throw new Error('timestamp percentage must be between 0% and 100%, e.g. "50%"');
    }

    return {
      kind: "percent",
      value: percent,
    };
  }

  const seconds = Number.parseFloat(trimmed);

  if (Number.isNaN(seconds) || seconds < 0) {
    throw new Error("timestamp must be a number of seconds or a percentage like 50%");
  }

  return {
    kind: "seconds",
    value: seconds,
  };
}

async function getVideoDuration(inputPath: string) {
  const ffprobeOutput = await runProcess(getBinaryPath("ffprobe"), [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]);

  const durationSeconds = Number.parseFloat(ffprobeOutput.trim());

  if (Number.isNaN(durationSeconds) || durationSeconds < 0) {
    throw new Error("Unable to determine video duration with ffprobe.");
  }

  return durationSeconds;
}

async function runProcess(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(
        new Error(
          `${command} exited with code ${code ?? "unknown"}${stderr ? `: ${stderr.trim()}` : ""}`,
        ),
      );
    });
  });
}
