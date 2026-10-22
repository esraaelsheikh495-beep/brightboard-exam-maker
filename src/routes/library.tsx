import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Emblem } from "@/components/Emblem";
import { GRADES, TYPE_META, getBanks, getExams } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Download, Eye, KeyRound } from "lucide-react";
import { downloadBank, downloadExam } from "@/lib/exam-output";
import { useStoredValue } from "@/hooks/use-stored-value";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Smart Quiz Platform" },
      { name: "description", content: "Your saved question banks and exams, organized by grade." },
      { property: "og:title", content: "Library — Smart Quiz Platform" },
      { property: "og:description", content: "Your saved question banks and exams, organized by grade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Library,
});

function Library() {
  const [banks] = useStoredValue(getBanks, []);
  const [exams] = useStoredValue(getExams, []);
  const [grade, setGrade] = useState("");

  const fBanks = banks.filter((b) => !grade || b.grade === grade);
  const fExams = exams.filter((e) => !grade || e.grade === grade);

  return (
    <Shell wide>
      <div className="sq-row" style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Emblem size={54} />
          <div>
            <b style={{ fontSize: 19 }}>📚 Library · مكتبتي</b>
            <div className="sq-small">Your question banks and exams, saved on this device.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="sq-btn sq-ghost" to="/">Home</Link>
          <Link className="sq-btn" to="/create">＋ Create exam</Link>
        </div>
      </div>

      <div className="sq-card">
        <label className="sq-label" htmlFor="lib-grade">Filter by folder</label>
        <select id="lib-grade" value={grade} onChange={(e) => setGrade(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="">All grades</option>
          {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </select>
      </div>

      <div className="sq-card">
        <h2>🗂 Question banks</h2>
        {fBanks.length === 0 ? (
          <p className="sq-sub">No question banks here yet. <Link to="/create" className="sq-linklike">Upload one from Create exam →</Link></p>
        ) : (
          fBanks.map((b) => (
            <div key={b.id} className="sq-bk on" style={{ cursor: "default" }}>
              <div style={{ fontSize: 22 }}>🗂</div>
              <div>
                <div className="sq-bk-nm" dir="auto">{b.name}</div>
                <div className="sq-bk-mt">
                  {b.subject} · Grade {b.grade} · {b.questions.length} questions ·{" "}
                  {new Date(b.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Button variant="quiz" className="sq-ghost" onClick={() => downloadBank(b)} aria-label={`Download bank ${b.name}`}><Download /> TXT</Button>
            </div>
          ))
        )}
      </div>

      <div className="sq-card">
        <h2>📝 Exams</h2>
        {fExams.length === 0 ? (
          <p className="sq-sub">No exams saved yet.</p>
        ) : (
          fExams.map((e) => (
            <div key={e.id} className="sq-bk on" style={{ cursor: "default" }}>
              <div style={{ fontSize: 22 }}>📝</div>
              <div style={{ flex: 1 }}>
                <div className="sq-bk-nm" dir="auto">{e.title}</div>
                <div className="sq-bk-mt">
                  {e.subject} · Grade {e.grade} · Class {e.className} · {e.questions.length} questions ·{" "}
                  {e.totalPoints} points{e.timeMinutes > 0 ? ` · ${e.timeMinutes} min` : ""} ·{" "}
                  {e.random ? "🎲 Random" : "👆 Picked"}
                </div>
                <div className="sq-bk-mt" style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {e.plan.map((p) => (
                    <span
                      key={p.type}
                      style={{
                        background: TYPE_META[p.type].bg,
                        color: TYPE_META[p.type].color,
                        borderRadius: 99,
                        padding: "2px 10px",
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {TYPE_META[p.type].icon} {TYPE_META[p.type].label} ×{p.count}
                    </span>
                  ))}
                </div>
                <div className="sq-row sq-exam-actions">
                  <Button variant="quiz" asChild><Link to="/exam/$examId" params={{ examId: e.id }}><Eye /> Open exam</Link></Button>
                  <Button variant="quiz" className="sq-ghost" onClick={() => downloadExam(e)}><Download /> Word</Button>
                  <Button variant="quiz" className="sq-ghost" onClick={() => downloadExam(e, true)}><KeyRound /> Answer key</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
