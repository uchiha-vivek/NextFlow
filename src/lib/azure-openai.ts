import { AzureOpenAI } from "openai";
import { z } from "zod";

export const runLlmPayloadSchema = z.object({
  model: z.string().min(1).default("gpt-5.4-mini"),
  systemPrompt: z.string().default("You are a creative workflow planner."),
  userMessage: z.string().min(1),
  imageUrls: z.array(z.string().url()).default([]),
});

export type RunLlmPayload = z.infer<typeof runLlmPayloadSchema>;

/**
 * Sends a multimodal prompt to the configured Azure OpenAI deployment and returns plain text output.
 */
export async function generateWithAzureOpenAI(payload: RunLlmPayload) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint) {
    throw new Error("Missing required environment variable: AZURE_OPENAI_ENDPOINT");
  }

  if (!apiKey) {
    throw new Error("Missing required environment variable: AZURE_OPENAI_API_KEY");
  }

  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment: payload.model,
  });

  const userContent = [
    {
      type: "text" as const,
      text: payload.userMessage,
    },
    ...payload.imageUrls.map((imageUrl) => ({
      type: "image_url" as const,
      image_url: {
        url: imageUrl,
      },
    })),
  ];

  const response = await client.chat.completions.create({
    model: payload.model,
    messages: [
      {
        role: "developer",
        content: payload.systemPrompt,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    max_completion_tokens: 4000,
  });

  const output = response.choices
    .map((choice) => choice.message?.content ?? "")
    .join("\n")
    .trim();

  if (!output) {
    throw new Error("Azure OpenAI returned no text output.");
  }

  return output;
}
