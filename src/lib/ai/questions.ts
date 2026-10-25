// Shared, client-safe helpers for the AI question generator.
// The actual gateway call lives in questions.functions.ts / gateway.server.ts.

import type { QuestionType } from "@/lib/store";

export interface AiTypeRequest {
  type: QuestionType;
  count: number;
}

export interface AiGenInput {
  lesson: string;
  subject: string;
  grade: string;
  types: AiTypeRequest[];
}

export interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  options: string[] | null;
  answer: string;
}

export const MAX_QUESTIONS = 40;
export const MAX_LESSON_CHARS = 8000;

/** Validates the request coming from the create-exam page. Throws with a friendly message. */
export function validateAiInput(input: AiGenInput): AiGenInput {
  const lesson = (input.lesson ?? "").trim();
  if (lesson.length < 20) throw new Error("Please paste the lesson text (at least 20 characters).");
  if (lesson.length > MAX_LESSON_CHARS) throw new Error(`Lesson text is too long (max ${MAX_LESSON_CHARS} characters).`);
  if (!input.grade) throw new Error("Choose the grade folder first.");

  const types = (input.types ?? [])
    .map((t) => ({ type: t.type, count: Math.floor(Number(t.count)) }))
    .filter((t) => t.count > 0);
  if (!types.length) throw new Error("Turn on at least one question type and set how many questions to generate.");

  const total = types.reduce((s, t) => s + t.count, 0);
  if (total > MAX_QUESTIONS) throw new Error(`Generate up to ${MAX_QUESTIONS} questions at once (you asked for ${total}).`);

  return { lesson, subject: (input.subject ?? "General").trim() || "General", grade: input.grade, types };
}

export function buildAiPrompt(input: AiGenInput): { instructions: string; user: string } {
  const instructions = [
    "You are a primary-school exam question writer for an exam-builder platform.",
    "You generate questions from a lesson, suitable for the given grade, in the SAME language as the lesson text (Arabic stays Arabic, English stays English).",
    "Question types:",
    '- "complete": the text contains exactly one blank written as ___, and the answer is the missing word or short phrase.',
    '- "choose": the text is a question, options holds exactly 4 short options, and the answer is one of those options exactly as written.',
    '- "tf": the text is a statement, and the answer is exactly "true" or "false".',
    '- "correct": the text contains a sentence with one clear mistake, and the answer is the fully corrected sentence.',
    "Rules: simple age-appropriate wording, no markdown, no numbering inside the text, no duplicates, answers always correct and unambiguous.",
    "Return only the data; every requested count must be generated exactly.",
  ].join("\n");

  const lines = input.types.map((t) => `- ${t.type}: ${t.count}`);
  const user = [
    `Subject: ${input.subject}`,
    `Grade: ${input.grade}`,
    "Requested question types and counts:",
    ...lines,
    "",
    "Lesson text:",
    input.lesson,
  ].join("\n");

  return { instructions, user };
}

/** Maps and filters the model output into valid bank questions, honoring the requested counts. */
export function mapGeneratedQuestions(raw: unknown, requested: AiTypeRequest[]): GeneratedQuestion[] {
  const list = Array.isArray((raw as { questions?: unknown })?.questions) ? ((raw as { questions: unknown[] }).questions) : [];
  const seen = new Set<string>();
  const out: GeneratedQuestion[] = [];
  const remaining = new Map<QuestionType, number>(requested.map((t) => [t.type, t.count]));

  for (const item of list) {
    if (out.length >= requested.reduce((s, t) => s + t.count, 0)) break;
    if (typeof item !== "object" || item === null) continue;
    const q = item as Partial<GeneratedQuestion>;
    const type = q.type as QuestionType;
    const text = typeof q.text === "string" ? q.text.trim() : "";
    const answer = typeof q.answer === "string" ? q.answer.trim() : "";
    if (!text || !answer) continue;
    if (!remaining.has(type) || (remaining.get(type) ?? 0) <= 0) continue;

    if (type === "complete") {
      if (!text.includes("___")) continue;
    } else if (type === "choose") {
      const options = Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0) : [];
      const unique = Array.from(new Set(options.map((o) => o.trim())));
      if (unique.length !== 4) continue;
      if (!unique.includes(answer)) continue;
      q.options = unique;
    } else if (type === "tf") {
      if (!/^(true|false)$/i.test(answer)) continue;
    } else if (type === "correct") {
      if (text === answer) continue;
    } else {
      continue;
    }

    const key = `${type}::${text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    remaining.set(type, (remaining.get(type) ?? 0) - 1);
    out.push({
      type,
      text,
      options: type === "choose" ? (q.options as string[]) : null,
      answer: type === "tf" ? answer.toLowerCase() : answer,
    });
  }
  return out;
}
