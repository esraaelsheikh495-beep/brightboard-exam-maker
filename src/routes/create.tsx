import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { Emblem } from "@/components/Emblem";
import {
  GRADES, SUBJECTS, TYPE_META, getBanks, saveBank, saveExam, uid,
  parseExamText,
  type BankQuestion, type ExamTypePlan, type QuestionBank, type QuestionType,
} from "@/lib/store";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create Exam — Smart Quiz Platform" },
      { name: "description", content: "Create a new exam: subject, class, grade, time, points, question types, and question bank." },
      { property: "og:title", content: "Create Exam — Smart Quiz Platform" },
      { property: "og:description", content: "Create a new exam: subject, class, grade, time, points, question types, and question bank." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateExam,
});

type Step = "info" | "source" | "upload" | "paste" | "types" | "bank" | "done";
type Source = "qb" | "exam" | "paste" | null;

const TYPES: QuestionType[] = ["complete", "choose", "tf", "correct"];

function CreateExam() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");
  const [err, setErr] = useState("");

  // Step 1 — exam info
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [grade, setGrade] = useState("");
  const [time, setTime] = useState(30);
  const [points, setPoints] = useState(20);
  const [title, setTitle] = useState("");

  // Step 2 — source
  const [source, setSource] = useState<Source>(null);

  // Step 3 — upload / paste
  const [bankName, setBankName] = useState("");
  const [bankGrade, setBankGrade] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [parsed, setParsed] = useState<BankQuestion[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 4 — question types
  const [plan, setPlan] = useState<Record<QuestionType, { on: boolean; n: number; m: number }>>({
    complete: { on: false, n: 5, m: 1 },
    choose: { on: true, n: 5, m: 1 },
    tf: { on: true, n: 5, m: 1 },
    correct: { on: false, n: 5, m: 1 },
  });

  // Step 5 — bank pick
  const [banks, setBanks] = useState<QuestionBank[]>(getBanks());
  const [pickedBanks, setPickedBanks] = useState<Record<string, boolean>>({});
  const [random, setRandom] = useState(true);
  const [pickedQuestions, setPickedQuestions] = useState<Record<string, boolean>>({});

  const [createdId, setCreatedId] = useState("");

  const totalQ = TYPES.reduce((s, t) => s + (plan[t].on ? plan[t].n : 0), 0);
  const totalMarks = TYPES.reduce((s, t) => s + (plan[t].on ? plan[t].n * plan[t].m : 0), 0);
  const onTypes = TYPES.filter((t) => plan[t].on);

  const gradeBanks = useMemo(
    () => banks.filter((b) => !grade || b.grade === grade),
    [banks, grade]
  );
  const pool = useMemo(
    () => gradeBanks.filter((b) => pickedBanks[b.id]).flatMap((b) => b.questions),
    [gradeBanks, pickedBanks]
  );
  const availFor = (t: QuestionType) => pool.filter((q) => q.type === t).length;

  const showErr = (m: string) => {
    setErr(m);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- step 1 ---------- */
  const submitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return showErr("Please choose the Subject.");
    if (!className.trim()) return showErr("Please enter the Class (e.g. 1/1).");
    if (!grade) return showErr("Please choose the Grade.");
    if (time < 0 || time > 300) return showErr("Time must be between 0 and 300 minutes.");
    if (points < 1) return showErr("Number of exam points must be at least 1.");
    setErr("");
    setStep("source");
  };

  /* ---------- step 2 ---------- */
  const chooseSource = (s: Exclude<Source, null>) => {
    setSource(s);
    setErr("");
    if (s === "paste") setStep("paste");
    else setStep("upload");
  };

  /* ---------- step 3: upload file ---------- */
  const handleFile = async (f: File) => {
    const text = await f.text();
    const qs = parseExamText(text);
    if (!qs.length) {
      showErr("Could not find questions in this file. Use the format shown below (blocks separated by an empty line).");
      return;
    }
    setParsed(qs);
    if (!bankName) setBankName(f.name.replace(/\.[^.]+$/, ""));
    setErr("");
  };

  const saveUploadedBank = () => {
    if (!bankGrade) return showErr("Choose where to save it: Grade 1, 2 or 3.");
    if (!bankName.trim()) return showErr("Give the question bank a name.");
    if (!parsed.length) return showErr("Upload a file first.");
    const bank: QuestionBank = {
      id: uid(),
      name: bankName.trim(),
      grade: bankGrade,
      subject: subject || "General",
      createdAt: new Date().toISOString(),
      questions: parsed,
    };
    saveBank(bank);
    setBanks(getBanks());
    setPickedBanks((p) => ({ ...p, [bank.id]: true }));
    setErr("");
    setStep("types");
  };

  /* ---------- step 3b: paste ---------- */
  const savePastedBank = () => {
    if (!bankGrade) return showErr("Choose where to save it: Grade 1, 2 or 3.");
    if (!bankName.trim()) return showErr("Give the question bank a name.");
    const qs = parseExamText(pasteText);
    if (!qs.length) return showErr("No questions found. Check the format example below.");
    const bank: QuestionBank = {
      id: uid(),
      name: bankName.trim(),
      grade: bankGrade,
      subject: subject || "General",
      createdAt: new Date().toISOString(),
      questions: qs,
    };
    saveBank(bank);
    setBanks(getBanks());
    setPickedBanks((p) => ({ ...p, [bank.id]: true }));
    setErr("");
    setStep("types");
  };

  /* ---------- step 4 ---------- */
  const toggleType = (t: QuestionType) => {
    setPlan((p) => {
      const cur = p[t];
      if (cur.on && onTypes.length === 1) {
        showErr("Keep at least one question type.");
        return p;
      }
      setErr("");
      return { ...p, [t]: { ...cur, on: !cur.on } };
    });
  };
  const bump = (t: QuestionType, k: "n" | "m", d: number) =>
    setPlan((p) => {
      const cur = p[t];
      const v = k === "n" ? Math.max(1, Math.min(50, cur.n + d)) : Math.max(0.5, Math.min(100, Math.round((cur.m + d) * 2) / 2));
      return { ...p, [t]: { ...cur, [k]: v } };
    });

  /* ---------- step 5: build ---------- */
  const buildExam = () => {
    const ids = Object.keys(pickedBanks).filter((k) => pickedBanks[k]);
    if (!ids.length) return showErr("Choose at least one question bank — or upload one first.");
    if (!onTypes.length) return showErr("Choose at least one question type.");

    let questions: BankQuestion[] = [];
    if (random) {
      for (const t of onTypes) {
        const avail = pool.filter((q) => q.type === t);
        const want = plan[t].n;
        if (avail.length < want)
          return showErr(
            `Not enough "${TYPE_META[t].label}" questions in the selected banks: ${avail.length} available, ${want} requested. Lower the number or add more questions.`
          );
        const shuffled = [...avail].sort(() => Math.random() - 0.5);
        questions.push(...shuffled.slice(0, want));
      }
    } else {
      const idsQ = Object.keys(pickedQuestions).filter((k) => pickedQuestions[k]);
      questions = pool.filter((q) => idsQ.includes(q.id));
      if (!questions.length) return showErr("Pick at least one question, or switch to Random.");
    }

    const exam = {
      id: uid(),
      title: title.trim() || `${subject} exam — Grade ${grade}`,
      subject,
      className: className.trim(),
      grade,
      timeMinutes: time,
      totalPoints: points,
      plan: onTypes.map((t) => ({ type: t, count: plan[t].n, marks: plan[t].m }) as ExamTypePlan),
      bankIds: ids,
      random,
      questions,
      createdAt: new Date().toISOString(),
    };
    saveExam(exam);
    setCreatedId(exam.id);
    setErr("");
    setStep("done");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Shell wide>
      <div className="sq-row" style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Emblem size={54} />
          <div>
            <b style={{ fontSize: 19 }}>Create Exam</b>
            <div className="sq-small">Set the exam info, add questions, pick the types — and we build it ✨</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="sq-btn sq-ghost" to="/">Home</Link>
          <Link className="sq-btn sq-ghost" to="/library">📚 Library</Link>
        </div>
      </div>

      {err && <div className="sq-err">{err}</div>}

      {/* steps indicator */}
      {step !== "done" && (
        <div className="sq-steps">
          {["Exam info", "Source", "Questions", "Types", "Bank"].map((s, i) => {
            const order: Step[] = ["info", "source", "upload", "types", "bank"];
            const cur = order.indexOf(step === "paste" ? "upload" : step);
            return (
              <span key={s} className={`sq-stepdot ${i < cur ? "past" : ""} ${i === cur ? "now" : ""}`}>
                {i + 1}. {s}
              </span>
            );
          })}
        </div>
      )}

      {/* ============ STEP 1: exam info ============ */}
      {step === "info" && (
        <form className="sq-card" onSubmit={submitInfo}>
          <div className="sq-step"><b className="sq-n">1</b><h2>Exam information</h2></div>
          <p className="sq-sub">Basic exam data — you can change it later.</p>

          <div className="sq-grid2">
            <div>
              <label className="sq-label" htmlFor="c-subject">Subject</label>
              <select id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">— Choose subject —</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="sq-label" htmlFor="c-class">Class</label>
              <input id="c-class" type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. 1/1" />
            </div>
          </div>

          <div className="sq-grid2" style={{ marginTop: 10 }}>
            <div>
              <label className="sq-label" htmlFor="c-grade">Grade</label>
              <select id="c-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">— Choose grade —</option>
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="sq-label" htmlFor="c-time">Time (minutes, 0 = no timer)</label>
              <input id="c-time" type="number" min={0} max={300} value={time} onChange={(e) => setTime(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="sq-grid2" style={{ marginTop: 10 }}>
            <div>
              <label className="sq-label" htmlFor="c-points">Number of exam points</label>
              <input id="c-points" type="number" min={1} max={500} value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="sq-label" htmlFor="c-title">Exam title (optional)</label>
              <input id="c-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 1 quiz" />
            </div>
          </div>

          <button className="sq-btn sq-big" type="submit" style={{ marginTop: 16 }}>Next ← Choose the source</button>
        </form>
      )}

      {/* ============ STEP 2: source ============ */}
      {step === "source" && (
        <div className="sq-card">
          <div className="sq-step"><b className="sq-n">2</b><h2>Where do the questions come from?</h2></div>
          <p className="sq-sub">Choose how you want to add the questions for this exam.</p>

          <div className="sq-srcgrid">
            <button type="button" className="sq-src" style={{ ["--sc" as string]: "#7a4fd0", ["--sb" as string]: "#f3efff" }} onClick={() => chooseSource("qb")}>
              <span className="sq-src-ic">🗂</span>
              <b>Upload QB</b>
              <small>Upload a question bank file to reuse in many exams</small>
            </button>
            <button type="button" className="sq-src" style={{ ["--sc" as string]: "#4f9dff", ["--sb" as string]: "#e6f1ff" }} onClick={() => chooseSource("exam")}>
              <span className="sq-src-ic">📄</span>
              <b>Upload Exam</b>
              <small>Upload a ready exam file and save it to a grade folder</small>
            </button>
            <button type="button" className="sq-src" style={{ ["--sc" as string]: "#ff6fa5", ["--sb" as string]: "#ffeaf2" }} onClick={() => chooseSource("paste")}>
              <span className="sq-src-ic">📋</span>
              <b>Paste Exam</b>
              <small>Paste the exam text directly and we parse it</small>
            </button>
          </div>

          <div className="sq-row" style={{ marginTop: 14, justifyContent: "space-between" }}>
            <button type="button" className="sq-btn sq-ghost" onClick={() => setStep("info")}>← Back</button>
            <button type="button" className="sq-btn sq-ghost" onClick={() => setStep("types")}>
              Skip — use my saved banks →
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 3: upload ============ */}
      {step === "upload" && (
        <div className="sq-card">
          <div className="sq-step"><b className="sq-n">3</b><h2>{source === "qb" ? "Upload question bank" : "Upload exam"}</h2></div>
          <p className="sq-sub">
            Upload the file, choose which grade folder to save it in, then press Upload / Save — it goes straight to your Library.
          </p>

          <label className="sq-label">Save it in folder</label>
          <select value={bankGrade} onChange={(e) => setBankGrade(e.target.value)}>
            <option value="">— Choose folder —</option>
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>

          <label className="sq-label" style={{ marginTop: 10 }}>Bank name</label>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Unit 1 — Vocabulary" />

          <div
            className="sq-drop"
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          >
            <div style={{ fontSize: 34 }}>⬆️</div>
            <b>{parsed.length ? `${parsed.length} questions ready ✓` : "Click to choose the file"}</b>
            <small className="sq-small">TXT / CSV / MD — questions separated by an empty line</small>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.md,.json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          <details className="sq-small" style={{ marginTop: 8 }}>
            <summary>File format example</summary>
            <pre className="sq-pre" dir="ltr">{`[choose] What is the capital of Egypt? | Cairo | Giza | Luxor | Aswan | answer: Cairo

[tf] The sun rises in the west. | answer: false

[complete] Water boils at ___ degrees. | answer: 100

[correct] She go to school every day. | answer: She goes to school every day.`}</pre>
          </details>

          <div className="sq-row" style={{ marginTop: 14, justifyContent: "space-between" }}>
            <button type="button" className="sq-btn sq-ghost" onClick={() => setStep("source")}>← Back</button>
            <button type="button" className="sq-btn sq-green" onClick={saveUploadedBank}>⬆️ Upload / Save</button>
          </div>
        </div>
      )}

      {/* ============ STEP 3b: paste ============ */}
      {step === "paste" && (
        <div className="sq-card">
          <div className="sq-step"><b className="sq-n">3</b><h2>Paste exam</h2></div>
          <p className="sq-sub">Paste the questions here — each question block separated by an empty line.</p>

          <label className="sq-label">Save it in folder</label>
          <select value={bankGrade} onChange={(e) => setBankGrade(e.target.value)}>
            <option value="">— Choose folder —</option>
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>

          <label className="sq-label" style={{ marginTop: 10 }}>Bank name</label>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Unit 2 — Grammar" />

          <label className="sq-label" style={{ marginTop: 10 }}>Exam text</label>
          <textarea
            dir="auto"
            rows={10}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"[choose] Question? | A | B | C | D | answer: B\n\n[tf] Sentence. | answer: true\n\n[complete] Sentence with ___. | answer: word\n\n[correct] Wrong sentence. | answer: corrected sentence"}
          />

          <div className="sq-row" style={{ marginTop: 14, justifyContent: "space-between" }}>
            <button type="button" className="sq-btn sq-ghost" onClick={() => setStep("source")}>← Back</button>
            <button type="button" className="sq-btn sq-green" onClick={savePastedBank}>💾 Save to Library</button>
          </div>
        </div>
      )}

      {/* ============ STEP 4: question types ============ */}
      {step === "types" && (
        <div className="sq-card">
          <div className="sq-step"><b className="sq-n">4</b><h2>Question types</h2></div>
          <p className="sq-sub">Tap a card to turn a type on, then set the number of questions and the marks per question.</p>

          {TYPES.map((t) => {
            const meta = TYPE_META[t];
            const p = plan[t];
            return (
              <div
                key={t}
                className={`sq-tcard ${p.on ? "on" : ""}`}
                style={{ ["--tc" as string]: meta.color, ["--tb" as string]: meta.bg }}
              >
                <div className="sq-thead" onClick={() => toggleType(t)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleType(t)}>
                  <span className="sq-tic">{meta.icon}</span>
                  <div className="sq-tt">
                    {meta.label}
                    <small>{meta.desc}</small>
                    {p.on && pool.length > 0 && (
                      <small className={`sq-av ${availFor(t) < p.n ? "low" : ""}`}>
                        Available in selected banks: {availFor(t)}
                      </small>
                    )}
                  </div>
                  <span className="sq-tick">✓</span>
                </div>
                {p.on && (
                  <div className="sq-counters">
                    <div className="sq-cbox">
                      <span className="sq-cl">Number of questions</span>
                      <div className="sq-stepper">
                        <button type="button" onClick={() => bump(t, "n", -1)}>−</button>
                        <input type="number" min={1} max={50} value={p.n}
                          onChange={(e) => setPlan((pp) => ({ ...pp, [t]: { ...pp[t], n: Math.max(1, parseInt(e.target.value) || 1) } }))} />
                        <button type="button" onClick={() => bump(t, "n", 1)}>+</button>
                      </div>
                    </div>
                    <div className="sq-cbox">
                      <span className="sq-cl">Marks per question</span>
                      <div className="sq-stepper">
                        <button type="button" onClick={() => bump(t, "m", -0.5)}>−</button>
                        <input type="number" step={0.5} min={0.5} max={100} value={p.m}
                          onChange={(e) => setPlan((pp) => ({ ...pp, [t]: { ...pp[t], m: Math.max(0.5, parseFloat(e.target.value) || 1) } }))} />
                        <button type="button" onClick={() => bump(t, "m", 0.5)}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="sq-sumbar">
            <span className="sq-pill">Types <b>{onTypes.length}</b>/4</span>
            <span className="sq-pill">Questions <b>{totalQ}</b></span>
            <span className="sq-pill">Total marks <b>{Math.round(totalMarks * 100) / 100}</b> / {points}</span>
          </div>

          <div className="sq-row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="sq-btn sq-ghost" onClick={() => setStep("source")}>← Back</button>
            <button type="button" className="sq-btn" onClick={() => setStep("bank")}>Next ← Question bank</button>
          </div>
        </div>
      )}

      {/* ============ STEP 5: bank ============ */}
      {step === "bank" && (
        <div className="sq-card">
          <div className="sq-step"><b className="sq-n">5</b><h2>Question bank</h2></div>
          <p className="sq-sub">
            Pick the bank(s) for Grade {grade || "…"}, then choose the questions yourself or let us pick them randomly.
          </p>

          {gradeBanks.length === 0 ? (
            <div className="sq-err">
              No question banks saved for this grade yet.{" "}
              <button type="button" className="sq-linklike" onClick={() => setStep("upload")}>Upload one now →</button>
            </div>
          ) : (
            gradeBanks.map((b) => (
              <label key={b.id} className={`sq-bk ${pickedBanks[b.id] ? "on" : ""}`}>
                <input
                  type="checkbox"
                  checked={!!pickedBanks[b.id]}
                  onChange={(e) => setPickedBanks((p) => ({ ...p, [b.id]: e.target.checked }))}
                />
                <div>
                  <div className="sq-bk-nm" dir="auto">{b.name}</div>
                  <div className="sq-bk-mt">{b.subject} · Grade {b.grade} · {b.questions.length} questions</div>
                </div>
              </label>
            ))
          )}

          <div className="sq-grid2" style={{ marginTop: 12 }}>
            <button
              type="button"
              className={`sq-src ${random ? "sq-src-on" : ""}`}
              style={{ ["--sc" as string]: "#7a4fd0", ["--sb" as string]: "#f3efff" }}
              onClick={() => setRandom(true)}
            >
              <span className="sq-src-ic">🎲</span>
              <b>Random</b>
              <small>We pick random questions by your plan</small>
            </button>
            <button
              type="button"
              className={`sq-src ${!random ? "sq-src-on" : ""}`}
              style={{ ["--sc" as string]: "#5fb44a", ["--sb" as string]: "#eaf8e3" }}
              onClick={() => setRandom(false)}
            >
              <span className="sq-src-ic">👆</span>
              <b>Pick myself</b>
              <small>Choose exactly the questions you want</small>
            </button>
          </div>

          {!random && pool.length > 0 && (
            <div style={{ marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
              {pool.map((q) => (
                <label key={q.id} className={`sq-bk ${pickedQuestions[q.id] ? "on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={!!pickedQuestions[q.id]}
                    onChange={(e) => setPickedQuestions((p) => ({ ...p, [q.id]: e.target.checked }))}
                  />
                  <div>
                    <div className="sq-bk-nm" dir="auto">{q.text}</div>
                    <div className="sq-bk-mt">
                      <span style={{ color: TYPE_META[q.type].color, fontWeight: 800 }}>{TYPE_META[q.type].label}</span>
                      {q.answer ? ` · Answer: ${q.answer}` : ""}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="sq-sumbar">
            <span className="sq-pill">Banks <b>{Object.values(pickedBanks).filter(Boolean).length}</b></span>
            <span className="sq-pill">Pool <b>{pool.length}</b> questions</span>
            <span className="sq-pill">Plan <b>{totalQ}</b> questions · <b>{Math.round(totalMarks * 100) / 100}</b> marks</span>
          </div>

          <div className="sq-row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="sq-btn sq-ghost" onClick={() => setStep("types")}>← Back</button>
            <button type="button" className="sq-btn sq-big sq-green" style={{ width: "auto", paddingInline: 34 }} onClick={buildExam}>
              ✨ Create Exam
            </button>
          </div>
        </div>
      )}

      {/* ============ DONE ============ */}
      {step === "done" && (
        <div className="sq-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 46 }}>🎉</div>
          <h2 style={{ margin: "4px 0" }}>Exam created and saved to your Library</h2>
          <p className="sq-sub">
            {title.trim() || `${subject} exam — Grade ${grade}`} · {totalQ} questions · {Math.round(totalMarks * 100) / 100} marks
            {time > 0 ? ` · ${time} minutes` : ""}
          </p>
          <div className="sq-ok">The exam is saved automatically in your Library. You can open it anytime from any device on this browser.</div>
          <div className="sq-row" style={{ justifyContent: "center", marginTop: 10 }}>
            <Link className="sq-btn" to="/library">📚 Open Library</Link>
            <button
              type="button"
              className="sq-btn sq-ghost"
              onClick={() => {
                setStep("info");
                setCreatedId("");
                setParsed([]);
                setPasteText("");
                setBankName("");
                setPickedQuestions({});
                navigate({ to: "/create" });
              }}
            >
              ＋ Create another exam
            </button>
          </div>
          {createdId && <p className="sq-small" style={{ marginTop: 10 }}>Exam ID: {createdId}</p>}
        </div>
      )}
    </Shell>
  );
}
