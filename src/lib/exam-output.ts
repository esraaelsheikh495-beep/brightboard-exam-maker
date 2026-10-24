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

export async function createDocx(exam: Exam, answers = false) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const line = (text: string, bold = false) => new Paragraph({ bidirectional: /[\u0600-\u06ff]/.test(text), children: [new TextRun({ text, bold, font: "Arial", size: 24 })], spacing: { after: 160 } });
  const children = [line(exam.title + (answers ? " — Answer key" : ""), true), line(`${exam.subject} · Grade ${exam.grade} · Class ${exam.className}`), line(`${exam.totalPoints} points · ${exam.timeMinutes} minutes`)];
  if (!answers) children.push(line("Name: ................................ Date: ................"));
  let n = 0;
  for (const plan of exam.plan) {
    children.push(line(`${TYPE_META[plan.type].label} (${plan.count} × ${plan.marks})`, true));
    for (const q of exam.questions.filter((q) => q.type === plan.type)) {
      children.push(line(`${++n}. ${q.text}`));
      if (q.options?.length) q.options.forEach((o, i) => children.push(line(`${String.fromCharCode(65 + i)}. ${o}`)));
      else children.push(line(q.type === "tf" ? "True ☐   False ☐" : "........................................................"));
      if (answers) children.push(line(`Answer: ${q.answer || "—"}`, true));
    }
  }
  return Packer.toBlob(new Document({ sections: [{ children }] }));
}

export async function downloadExam(exam: Exam, answers = false) {
  try { downloadBlob(await createDocx(exam, answers), outputFilename(exam.title + (answers ? " - answers" : ""), "docx")); }
  catch { window.alert("Could not prepare the Word file. Please try again."); }
}

export async function createPdf(paper: HTMLElement) {
  const [{ jsPDF }, { default: capture }] = await Promise.all([import("jspdf"), import("html2canvas-pro")]);
  await document.fonts.ready;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const clone = paper.cloneNode(true) as HTMLElement;
  clone.style.width = "720px";
  clone.style.position = "absolute";
  clone.style.left = "-10000px";
  clone.style.padding = "0";
  document.body.appendChild(clone);
  let y = 12;
  try {
    const blocks = clone.querySelectorAll<HTMLElement>("header, section > h2, .sq-exam-question");
    for (const [index, block] of Array.from(blocks).entries()) {
      const canvas = await capture(block, { scale: 2, backgroundColor: getComputedStyle(paper).backgroundColor });
      const height = canvas.height * 186 / canvas.width;
      const next = blocks[index + 1];
      if (block.tagName === "H2" && next && y + height + next.getBoundingClientRect().height * 186 / 720 + 4 > 285 && y > 12) { pdf.addPage(); y = 12; }
      if (height <= 273) {
        if (y + height > 285) { pdf.addPage(); y = 12; }
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 12, y, 186, height);
        y += height + 4;
      } else {
        // Oversized questions are split without dropping any pixels.
        let offset = 0;
        while (offset < canvas.height) {
          if (y > 12) { pdf.addPage(); y = 12; }
          const pixels = Math.min(canvas.height - offset, Math.floor(273 * canvas.width / 186));
          const slice = document.createElement("canvas"); slice.width = canvas.width; slice.height = pixels;
          const context = slice.getContext("2d");
          if (!context) throw new Error("PDF rendering unavailable");
          context.drawImage(canvas, 0, offset, canvas.width, pixels, 0, 0, canvas.width, pixels);
          const mm = pixels * 186 / canvas.width;
          pdf.addImage(slice.toDataURL("image/png"), "PNG", 12, y, 186, mm);
          y += mm + 4; offset += pixels;
        }
      }
    }
    return pdf.output("blob");
  } finally { clone.remove(); }
}

export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; }
  }
  downloadBlob(blob, filename);
}

export function downloadBank(bank: Pick<QuestionBank, "name" | "questions">) {
  downloadBlob(new Blob([bankText(bank)], { type: "text/plain;charset=utf-8" }), outputFilename(bank.name, "txt"));
}