import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, type ModelMessage } from "ai";
import { jsonSchema } from "@ai-sdk/provider-utils";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id";

export const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
export const DEFAULT_MODEL = "openai/gpt-6-astra";

// Strict-compat wire schema: object root, every property required, optional
// values nullable, additionalProperties false everywhere, no const.
export const generatedQuestionsSchema = jsonSchema<{
  questions: { type: string; text: string; options: string[] | null; answer: string }[];
}>({
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "text", "options", "answer"],
        properties: {
          type: { type: "string", enum: ["complete", "choose", "tf", "correct"] },
          text: { type: "string" },
          options: { type: ["array", "null"], items: { type: "string" } },
          answer: { type: "string" },
        },
      },
    },
  },
});

export function createResponsesCall(
  request: Request,
  config: { apiKey: string; model?: string },
  messages: ModelMessage[],
  instructions?: string,
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const model = config.model ?? DEFAULT_MODEL;
  const provider = createOpenAI({
    baseURL: `${GATEWAY_URL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const reasoning = model !== "openai/chat-latest";
  const result = streamText({
    model: provider.responses(model),
    ...(instructions ? { instructions } : {}),
    messages,
    abortSignal: request.signal,
    output: Output.object({ schema: generatedQuestionsSchema }),
    providerOptions: {
      openai: {
        store: false,
        ...(reasoning
          ? {
              forceReasoning: true,
              reasoningEffort: "medium",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            }
          : {}),
      },
    },
  });
  return { result, runIdFetch };
}

/** Extracts a safe, user-presentable message from a gateway/SDK error. */
export function safeGatewayError(error: unknown): string {
  const anyErr = error as { message?: string; statusCode?: number; name?: string };
  const status = anyErr?.statusCode;
  const message = typeof anyErr?.message === "string" ? anyErr.message : "";
  if (status === 402 || /credit|top.?up/i.test(message)) return message || "AI credits are used up. Upgrade or top up credits, then try again.";
  if (status === 403) return message || "AI access was denied for this workspace. Contact the workspace admin.";
  if (status === 401) return "AI is not configured on the server yet. Please try again later.";
  if (status === 429) return message || "The AI service is busy right now. Please wait a moment and try again.";
  if (status && status >= 500) return "The AI service had a temporary problem. Please try again.";
  if (status === 400 && message) return message;
  return message || "The AI request failed. Please try again.";
}
