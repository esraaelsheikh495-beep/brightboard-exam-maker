import { createFileRoute, Link } from "@tanstack/react-router";
import { Emblem } from "@/components/Emblem";
import { Bg, Nav } from "@/components/Shell";
import { isLoggedIn, getStats } from "@/lib/store";
import { useStoredValue } from "@/hooks/use-stored-value";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Quiz Platform — Create exams like Google Forms" },
      {
        name: "description",
        content:
           "Create and download exams from your saved question banks with manual or random selection.",
      },
      { property: "og:title", content: "Smart Quiz Platform" },
      {
        property: "og:description",
        content:
           "Create and download exams from saved question banks with manual or random selection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [logged] = useStoredValue(isLoggedIn, false);
  const [stats] = useStoredValue(getStats, { exams: 0, banks: 0, questions: 0 });
  return (
    <>
      <Bg />
      <main className="sq-hero">
        <Nav />
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
          <span>📝 Exams <b>{stats.exams}</b></span>
          <span>🗂 Banks <b>{stats.banks}</b></span>
          <span>Questions <b>{stats.questions}</b></span>
        </div>
        <Link to="/library" className="sq-btn sq-ghost">Open Library</Link>
      </main>
    </>
  );
}
