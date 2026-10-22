import { TYPE_META, type BankQuestion, type ExamTypePlan } from "@/lib/store";

export function selectExamQuestions(pool: BankQuestion[], plan: ExamTypePlan[], random: boolean, pickedIds: string[], totalPoints: number): BankQuestion[] {
  if (!plan.length) throw new Error("Choose at least one question type.");
  const marks = plan.reduce((sum, p) => sum + p.count * p.marks, 0);
  if (Math.abs(marks - totalPoints) > 0.001) throw new Error(`Total marks (${marks}) must match the exam points (${totalPoints}).`);
  const result: BankQuestion[] = [];
  for (const p of plan) {
    const available = pool.filter((q) => q.type === p.type && (random || pickedIds.includes(q.id)));
    if (random && available.length < p.count) throw new Error(`Not enough ${TYPE_META[p.type].label} questions: ${available.length} available, ${p.count} requested.`);
    if (!random && available.length !== p.count) throw new Error(`Pick exactly ${p.count} ${TYPE_META[p.type].label} questions (${available.length} selected).`);
    if (random) {
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = available[i]; const b = available[j];
        if (a && b) { available[i] = b; available[j] = a; }
      }
    }
    result.push(...available.slice(0, p.count));
  }
  if (result.some((q) => q.type === "choose" && q.options?.length !== 4)) throw new Error("Choose questions must have exactly four options.");
  return result;
}