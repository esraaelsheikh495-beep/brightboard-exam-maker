import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDocx, createPdf, deliverFile, outputFilename } from "@/lib/exam-output";
import type { Exam } from "@/lib/store";

export function ExamDownloads({ exam, answers }: { exam: Exam; answers: boolean }) {
  const [files, setFiles] = useState<{ pdf: Blob; docx: Blob } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFiles(null); setError("");
    const paper = document.querySelector<HTMLElement>(".sq-exam-paper");
    if (!paper) return;
    Promise.all([createPdf(paper), createDocx(exam, answers)]).then(([pdf, docx]) => {
      if (active) setFiles({ pdf, docx });
    }).catch(() => { if (active) setError("Could not prepare downloads. Please try again."); });
    return () => { active = false; };
  }, [exam, answers, retry]);
  const save = (format: "pdf" | "docx") => {
    if (!files) return;
    void deliverFile(files[format], outputFilename(exam.title + (answers ? " - answers" : ""), format)).catch(() => setError("Could not save file. Please try again."));
  };
  return <>
    <Button variant="quiz" disabled={!files} onClick={() => save("pdf")}><Download /> Download PDF</Button>
    <Button variant="quiz" disabled={!files} onClick={() => save("docx")}><Download /> Download DOCX</Button>
    <Button variant="quiz" className="sq-ghost" onClick={() => window.print()}><Printer /> Print</Button>
    {!files && !error && <span className="sq-small" role="status">Preparing downloads…</span>}
    {error && <><span className="sq-err" role="alert">{error}</span><Button variant="quiz" onClick={() => setRetry((n) => n + 1)}>Retry</Button></>}
  </>;
}