import { createFileRoute, Link } from "@tanstack/react-router";
import { Emblem } from "@/components/Emblem";
import { Bg } from "@/components/Shell";
import { isLoggedIn } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Quiz Platform — Create exams like Google Forms" },
      {
        name: "description",
        content:
          "A smart platform for WE teachers: upload your question bank, pick question types, and build auto-graded exams in minutes.",
      },
      { property: "og:title", content: "Smart Quiz Platform" },
      {
        property: "og:description",
        content:
          "Upload your question bank, pick question types, and build auto-graded exams in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const logged = isLoggedIn();
  return (
    <>
      <Bg />
      <main className="sq-hero">
        <div className="sq-rise" style={{ filter: "drop-shadow(0 18px 28px rgba(122,79,208,.25))" }}>
          <Emblem size={200} />
        </div>
        <h1 className="sq-hero-title sq-rise">Smart Quiz Platform</h1>
        <p className="sq-gift sq-rise">
          <span className="sq-heart">❤</span> A gift of love from WE AlArish to WE everywhere{" "}
          <span className="sq-heart">❤</span>
        </p>

        <Link to={logged ? "/create" : "/login"} className="sq-start sq-rise">
          {logged ? "Get Started" : "Teacher sign in"} <span className="sq-arr">➜</span>
        </Link>

        <div className="sq-pills">
          <span>🗂 Upload your question bank</span>
          <span>🎲 Random questions from the bank</span>
          <span>✅ Auto-grading</span>
          <span>📊 Grades in Excel</span>
        </div>
      </main>
    </>
  );
}
