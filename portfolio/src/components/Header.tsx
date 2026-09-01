"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/data/site";

// Hide-on-scroll: fade the sticky header out when scrolling down, back in when
// scrolling up (or near the top). The fade itself is gated to mobile in CSS
// (.site-nav[data-hidden]); desktop keeps the header always visible.
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) {
        setHidden(false);
      } else if (Math.abs(y - lastY.current) > 6) {
        setHidden(y > lastY.current);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

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
// section in white. Row on desktop; stacks left-aligned on mobile (see
// .site-nav in globals.css). Pass `minimal` for just the wordmark (a home
// link), used on the standalone Anduril microsite.
export function Header({
  active,
  minimal,
}: {
  active?: string;
  minimal?: boolean;
}) {
  const hidden = useHideOnScroll();
  return (
    <header className="site-nav" data-hidden={hidden}>
      <Link href="/" className="site-nav__mark">
        {site.wordmark}
      </Link>
      {!minimal && (
        <nav className="site-nav__links">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                color:
                  active === item.label ? "var(--text)" : "var(--text-dim)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

// Detail-page header — back link, centered wordmark, next link. Used by both
// project and venture pages.
export function ProjectHeader({
  nextName,
  nextHref,
  backHref = "/#work",
  backLabel = "← Work",
}: {
  nextName: string;
  nextHref: string;
  backHref?: string;
  backLabel?: string;
}) {
  const side: React.CSSProperties = {
    fontSize: 14,
    color: "var(--text-dim)",
    flex: "1 1 0",
    whiteSpace: "nowrap",
  };
  return (
    <header style={shell}>
      <Link href={backHref} style={{ ...side, textAlign: "left" }}>
        {backLabel}
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
