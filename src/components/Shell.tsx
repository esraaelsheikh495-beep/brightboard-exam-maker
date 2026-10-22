import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isLoggedIn, setLoggedIn } from "@/lib/store";
import { useStoredValue } from "@/hooks/use-stored-value";

export function Bg() {
  return (
    <div className="sq-bg" aria-hidden>
      <i className="b1" />
      <i className="b2" />
      <i className="b3" />
      <i className="b4" />
    </div>
  );
}

export function Nav() {
  const navigate = useNavigate();
  const [logged] = useStoredValue(isLoggedIn, false);
  return (
    <nav className="sq-nav">
      <Link to="/" className="sq-nav-link">Home</Link>
      {logged && (
        <>
          <Link to="/create" className="sq-nav-link">Create exam</Link>
          <Link to="/library" className="sq-nav-link">📚 Library</Link>
        </>
      )}
      {logged ? (
        <button
          type="button"
          className="sq-nav-link"
          onClick={() => {
            setLoggedIn(false);
            navigate({ to: "/" });
          }}
        >
          Sign out
        </button>
      ) : (
        <Link to="/login" className="sq-nav-link">Sign in</Link>
      )}
    </nav>
  );
}

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <Bg />
      <div className="sq-phone" style={wide ? { maxWidth: 760 } : undefined}>
        <Nav />
        {children}
      </div>
    </>
  );
}
