import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { getExams, TYPE_META } from "@/lib/store";
import { ExamDownloads } from "@/components/ExamDownloads";
import { useStoredValue } from "@/hooks/use-stored-value";

export const Route = createFileRoute("/exam/$examId")({
  head: () => ({ meta: [
    { title: "Exam preview and downloads — Smart Quiz Platform" },
    { name: "description", content: "View your saved exam, download the Word document or answer key, and print a PDF." },
    { property: "og:title", content: "Exam preview and downloads — Smart Quiz Platform" },
    { property: "og:description", content: "View, download and print your saved Smart Quiz exam." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ExamPage,
});

function ExamPage() {
  const { examId } = Route.useParams();
  const [exams] = useStoredValue(getExams, []);
  const [answers, setAnswers] = useState(false);
  const exam = exams.find((item) => item.id === examId);
  if (!exam) return <Shell wide><h1>Exam unavailable on this device</h1><Button variant="quiz" asChild><Link to="/library">Back to Library</Link></Button></Shell>;
  let number = 0;
  return <Shell wide>
    <div className="sq-row sq-print-hide sq-exam-actions">
      <Button variant="quiz" className="sq-ghost" asChild><Link to="/library"><ArrowLeft /> Library</Link></Button>
      <ExamDownloads exam={exam} answers={answers} />
      <label className="sq-answer-toggle"><input type="checkbox" checked={answers} onChange={(event) => setAnswers(event.target.checked)} /> Answer key</label>
    </div>
    <article className="sq-exam-paper">
      <header>
        <h1 dir="auto">{exam.title}{answers ? " — Answer key" : ""}</h1>
        <p>{exam.subject} · Grade {exam.grade} · Class {exam.className}</p>
        <p>{exam.totalPoints} points{exam.timeMinutes > 0 ? ` · ${exam.timeMinutes} minutes` : ""}</p>
        {!answers && <p>Name: .................................... &nbsp; Date: ....................</p>}
      </header>
      {exam.plan.map((plan) => <section key={plan.type}>
        <h2>{TYPE_META[plan.type].label} <span className="sq-small">{plan.count} × {Number(plan.marks.toFixed(2))} marks</span></h2>
        {exam.questions.filter((q) => q.type === plan.type).map((question) => <div key={question.id} className="sq-exam-question">
          <p dir="auto"><b>{++number}.</b> {question.text}</p>
          {question.options?.length ? <ol type="A">{question.options.map((option, index) => <li key={index} dir="auto">{option}</li>)}</ol> : question.type === "tf" ? <p>True ☐ &nbsp; False ☐</p> : <p>................................................................</p>}
          {answers && <p className="sq-exam-answer" dir="auto"><b>Answer:</b> {question.answer || "—"}</p>}
        </div>)}
      </section>)}
    </article>
  </Shell>;
}