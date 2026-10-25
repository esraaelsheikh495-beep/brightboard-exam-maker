import { createServerFn, getRequest } from "@tanstack/react-start";
import { buildAiPrompt, mapGeneratedQuestions, validateAiInput, type AiGenInput } from "./questions";
import { createResponsesCall, safeGatewayError } from "./gateway.server";

export const generateQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: AiGenInput) => validateAiInput(input))
  .handler(async ({ data }) => {
    const request = getRequest();
    const { instructions, user } = buildAiPrompt(data);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured on the server yet. Please try again later.");

    const { result } = createResponsesCall(
      request,
      { apiKey },
      [{ role: "user", content: user }],
      instructions,
    );

    let raw: unknown;
    try {
      raw = await result.output;
    } catch (error) {
      throw new Error(safeGatewayError(error));
    }

    const questions = mapGeneratedQuestions(raw, data.types);
    if (!questions.length) {
      throw new Error("The AI could not build questions from this text. Try a clearer lesson text or different types.");
    }
    return { questions };
  });
