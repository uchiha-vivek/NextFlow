import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { generateWithAzureOpenAI, runLlmPayloadSchema } from "@/lib/azure-openai";

/**
 * Trigger.dev task wrapper around the Azure OpenAI helper used by workflow LLM nodes.
 */
export const runLlmTask = schemaTask({
  id: "run-llm",
  schema: runLlmPayloadSchema,
  run: async (payload) => {
    logger.log("Running Azure OpenAI LLM task", {
      model: payload.model,
      imageCount: payload.imageUrls.length,
    });

    const output = await generateWithAzureOpenAI(payload);

    return {
      output,
      provider: "azure-openai",
      model: payload.model,
    };
  },
});
