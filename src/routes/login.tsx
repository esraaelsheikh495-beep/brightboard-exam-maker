import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { setLoggedIn, saveTeacher, getTeacher } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "دخول المعلم — Smart Quiz Platform" },
      { name: "description", content: "تسجيل دخول المعلم لفتح المكتبة وإدارة الامتحانات والنتائج." },
      { property: "og:title", content: "دخول المعلم — Smart Quiz Platform" },
      { property: "og:description", content: "تسجيل دخول المعلم لفتح المكتبة وإدارة الامتحانات والنتائج." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const isReg = mode === "register";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("اكتبي إيميل صحيح.");
    if (isReg && name.trim().length < 3) return setErr("اكتبي اسمك بالكامل (3 حروف على الأقل).");
    if (password.length < 8) return setErr("الباسورد لازم يكون 8 حروف أو أرقام على الأقل.");
    try {
    const prev = getTeacher();
    saveTeacher({
      name: isReg ? name.trim() : prev?.name || name.trim() || (email.split("@")[0] ?? ""),
      email,
      school: prev?.school ?? "",
      governorate: prev?.governorate ?? "",
      specialization: prev?.specialization ?? "",
      classes: prev?.classes ?? "",
    });
    setLoggedIn(true);
    } catch (error) { return setErr(error instanceof Error ? error.message : "تعذر الحفظ."); }
    navigate({ to: "/teacher" });
  };

  return (
    <Shell>
      <main className="sq-card" style={{ maxWidth: 520, margin: "30px auto" }} dir="rtl">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 46 }}>👩‍🏫</div>
          <h1 style={{ fontSize: 24, margin: "8px 0" }}>{isReg ? "حساب معلم جديد" : "دخول المعلم"}</h1>
          <p className="sq-sub">
            {isReg
              ? "التسجيل لمعلمي WE فقط."
              : "ادخلي بحسابك لفتح مكتبتك وإدارة امتحاناتك ونتائج طلابك."}
          </p>
        </div>

        {err && <div className="sq-err">{err}</div>}

        <form onSubmit={submit} autoComplete="on">
          {isReg && (
            <>
              <label className="sq-label" htmlFor="name">الاسم بالكامل</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} style={{ marginBottom: 10 }} />
            </>
          )}

          <label className="sq-label" htmlFor="email">الإيميل</label>
          <input id="email" type="text" inputMode="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={120} style={{ marginBottom: 10, textAlign: "left" }} />

          <label className="sq-label" htmlFor="password">الباسورد{isReg ? " (8 على الأقل)" : ""}</label>
          <input id="password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isReg ? "new-password" : "current-password"} required style={{ marginBottom: 14, textAlign: "left" }} />

          <button className="sq-btn sq-big" type="submit">{isReg ? "إنشاء الحساب" : "دخول"}</button>
        </form>

        <p className="sq-small" style={{ textAlign: "center", marginTop: 14 }}>
          {isReg ? (
            <>عندك حساب؟ <button type="button" className="sq-linklike" onClick={() => { setMode("login"); setErr(""); }}>سجّلي دخول</button></>
          ) : (
            <>معندكيش حساب؟ <button type="button" className="sq-linklike" onClick={() => { setMode("register"); setErr(""); }}>إنشاء حساب جديد</button></>
          )}
        </p>
        <p className="sq-small" style={{ textAlign: "center" }}>
          الامتحانات المنشورة تظل مفتوحة للطلاب من رابطها؛ تسجيل الدخول مطلوب لإدارة المعلم فقط.
        </p>
        <div style={{ textAlign: "center" }}>
          <Link className="sq-btn sq-ghost" to="/" style={{ marginTop: 8 }}>العودة للرئيسية</Link>
        </div>
      </main>
    </Shell>
  );
}
