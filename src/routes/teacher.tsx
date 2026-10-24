import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Emblem } from "@/components/Emblem";
import { getTeacher, saveTeacher, GOVERNORATES } from "@/lib/store";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "بيانات المعلم — Smart Quiz Platform" },
      { name: "description", content: "بيانات المعلم: الاسم، المدرسة، المحافظة، التخصص، والفصول." },
      { property: "og:title", content: "بيانات المعلم — Smart Quiz Platform" },
      { property: "og:description", content: "بيانات المعلم: الاسم، المدرسة، المحافظة، التخصص، والفصول." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherPage,
});

function TeacherPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", school: "", governorate: "", specialization: "", classes: "",
  });
  useEffect(() => { const prev = getTeacher(); if (prev) setForm(prev); }, []);
  const [err, setErr] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 3) return setErr("اكتبي اسمك بالكامل (3 حروف على الأقل).");
    if (form.school.trim().length < 2) return setErr("اكتبي اسم مدرسة WE.");
    if (!form.governorate) return setErr("اختاري المحافظة.");
    if (form.specialization.trim().length < 2) return setErr("اكتبي التخصص.");
    if (!form.classes.trim()) return setErr("اكتبي فصولك (مثال: 1/1, 1/2, 1/3).");
    try { saveTeacher(form); } catch (error) { return setErr(error instanceof Error ? error.message : "تعذر الحفظ."); }
    navigate({ to: "/create" });
  };

  return (
    <Shell>
      <main className="sq-card" style={{ maxWidth: 560, margin: "26px auto" }} dir="rtl">
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <Emblem size={90} />
          <h1 style={{ fontSize: 22, margin: "6px 0" }}>بيانات المعلم</h1>
          <p className="sq-sub">المنصة لمعلمي WE فقط. البيانات دي بتظهر في ملف نتائج Excel.</p>
        </div>

        {err && <div className="sq-err">{err}</div>}

        <form onSubmit={submit}>
          <label className="sq-label" htmlFor="t-name">اسم المعلم</label>
          <input id="t-name" type="text" value={form.name} onChange={set("name")} placeholder="الاسم بالكامل" autoComplete="name" style={{ marginBottom: 10 }} />

          <div className="sq-grid2">
            <div>
              <label className="sq-label" htmlFor="t-school">مدرسة WE</label>
              <input id="t-school" type="text" value={form.school} onChange={set("school")} placeholder="مثال: مدرسة WE للتكنولوجيا" />
            </div>
            <div>
              <label className="sq-label" htmlFor="t-gov">المحافظة</label>
              <select id="t-gov" value={form.governorate} onChange={set("governorate")}>
                <option value="">— اختاري —</option>
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sq-grid2" style={{ marginTop: 10 }}>
            <div>
              <label className="sq-label" htmlFor="t-spec">التخصص</label>
              <input id="t-spec" type="text" value={form.specialization} onChange={set("specialization")} placeholder="مثال: لغة إنجليزية" />
            </div>
            <div>
              <label className="sq-label" htmlFor="t-classes">فصولك</label>
              <input id="t-classes" type="text" value={form.classes} onChange={set("classes")} placeholder="مثال: 1/1, 1/2, 1/3" />
            </div>
          </div>
          <p className="sq-small" style={{ margin: "6px 0 14px" }}>
            الفصول بتتفصل بفواصل، والنتائج بتتقسم حسب الفصل في ملف Excel.
          </p>

          <button className="sq-btn sq-big" type="submit">حفظ والمتابعة ← إنشاء امتحان</button>
        </form>
      </main>
    </Shell>
  );
}
