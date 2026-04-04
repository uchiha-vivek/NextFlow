import { Transloadit } from "transloadit";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

type TransloaditResult = {
  ssl_url?: string | null;
  url?: string | null;
};

/**
 * Builds a Transloadit client from required server-side credentials.
 */
export function getTransloaditClient() {
  return new Transloadit({
    authKey: getEnv("TRANSLOADIT_AUTH_KEY"),
    authSecret: getEnv("TRANSLOADIT_AUTH_SECRET"),
  });
}

/**
 * Uploads a file that already exists on disk and returns the first public output URL.
 */
export async function uploadFileToTransloadit({
  filePath,
  fieldName = "file",
  templateId = process.env.TRANSLOADIT_IMAGE_TEMPLATE_ID,
}: {
  filePath: string;
  fieldName?: string;
  templateId?: string;
}) {
  if (!templateId) {
    throw new Error("Missing required environment variable: TRANSLOADIT_IMAGE_TEMPLATE_ID");
  }

  const client = getTransloaditClient();
  const assembly = await client.createAssembly({
    files: {
      [fieldName]: filePath,
    },
    params: {
      template_id: templateId,
    },
    waitForCompletion: true,
  });

  const output = getFirstResult(assembly.results);

  if (!output) {
    throw new Error("Transloadit upload succeeded but no result URL was returned.");
  }

  return {
    assemblyId: assembly.assembly_id,
    outputUrl: output,
  };
}

/**
 * Persists an in-memory upload to a temp file before sending it through the shared Transloadit flow.
 */
export async function uploadBufferToTransloadit({
  buffer,
  fileName,
  fieldName = "file",
  templateId,
}: {
  buffer: Buffer;
  fileName: string;
  fieldName?: string;
  templateId: string;
}) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "nextflow-upload-"));
  const filePath = path.join(workspace, sanitizeFileName(fileName));

  try {
    await fs.writeFile(filePath, buffer);
    return await uploadFileToTransloadit({
      filePath,
      fieldName,
      templateId,
    });
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

/**
 * Replaces unsafe path characters so user-provided file names cannot escape the temp workspace.
 */
function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Picks the first successful Transloadit result URL regardless of step key.
 */
function getFirstResult(results: Record<string, TransloaditResult[]> | undefined) {
  if (!results) {
    return null;
  }

  for (const entries of Object.values(results)) {
    const first = entries?.[0];
    const url = first?.ssl_url ?? first?.url;

    if (url) {
      return url;
    }
  }

  return null;
}
