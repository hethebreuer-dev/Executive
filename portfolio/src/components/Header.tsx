import Link from "next/link";
import { nav, site } from "@/data/site";

const shell: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  padding: "22px var(--gutter)",
  background: "var(--bg)",
  borderBottom: "1px solid var(--border-subtle)",
};

const wordmark: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: "0.24em",
  whiteSpace: "nowrap",
};

// Full nav header — homepage, ventures, resume. `active` marks the current
// section in white.
export function Header({ active }: { active?: string }) {
  return (
    <header style={shell}>
      <Link href="/" style={wordmark}>
        {site.wordmark}
      </Link>
      <nav
        style={{
          display: "flex",
          gap: 34,
          fontSize: 14,
          color: "var(--text-dim)",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {nav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              color: active === item.label ? "var(--text)" : "var(--text-dim)",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

// Project-page header — back link, centered wordmark, next-project link.
export function ProjectHeader({
  nextName,
  nextHref,
}: {
  nextName: string;
  nextHref: string;
}) {
  const side: React.CSSProperties = {
    fontSize: 14,
    color: "var(--text-dim)",
    flex: "1 1 0",
    whiteSpace: "nowrap",
  };
  return (
    <header style={shell}>
      <Link href="/#work" style={{ ...side, textAlign: "left" }}>
        ← Work
      </Link>
      <Link href="/" style={{ ...wordmark, flex: "0 0 auto", textAlign: "center" }}>
        {site.wordmark}
      </Link>
      <Link
        href={nextHref}
        style={{ ...side, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        Next: {nextName} →
      </Link>
    </header>
  );
}
