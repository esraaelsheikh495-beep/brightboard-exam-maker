import { TYPE_META, type Exam, type QuestionBank } from "@/lib/store";

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

export function examDocument(exam: Exam, answers = false) {
  const e = escapeHtml;
  const sections = exam.plan.map((plan) => {
    const questions = exam.questions.filter((q) => q.type === plan.type);
    return `<section><h2>${e(TYPE_META[plan.type].label)} (${plan.count} × ${plan.marks})</h2><ol>${questions.map((q) => `<li><p dir="auto">${e(q.text)}</p>${q.options?.length ? `<ol type="A">${q.options.map((o) => `<li dir="auto">${e(o)}</li>`).join("")}</ol>` : q.type === "tf" ? "<p>True ☐ &nbsp; False ☐</p>" : "<p>................................................................</p>"}${answers ? `<p dir="auto"><strong>Answer: ${e(q.answer || "—")}</strong></p>` : ""}</li>`).join("")}</ol></section>`;
  }).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${e(exam.title)}</title></head><body><h1 dir="auto">${e(exam.title)}${answers ? " — Answer key" : ""}</h1><p>${e(exam.subject)} · Grade ${e(exam.grade)} · Class ${e(exam.className)}</p><p>${exam.totalPoints} points${exam.timeMinutes ? ` · ${exam.timeMinutes} minutes` : ""}</p>${answers ? "" : "<p>Name: .................................... &nbsp; Date: ....................</p>"}${sections}</body></html>`;
}

export function bankText(bank: Pick<QuestionBank, "questions">) {
  return bank.questions.map((q) => `[${q.type}] ${q.text}${q.options?.length ? ` | ${q.options.join(" | ")}` : ""} | answer: ${q.answer}`).join("\n\n");
}

export function outputFilename(title: string, extension: string) {
  return `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim().slice(0, 100) || "exam"}.${extension}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadExam(exam: Exam, answers = false) {
  downloadBlob(new Blob(["\ufeff", examDocument(exam, answers)], { type: "application/msword;charset=utf-8" }), outputFilename(exam.title + (answers ? " - answers" : ""), "doc"));
}

export function downloadBank(bank: Pick<QuestionBank, "name" | "questions">) {
  downloadBlob(new Blob([bankText(bank)], { type: "text/plain;charset=utf-8" }), outputFilename(bank.name, "txt"));
}