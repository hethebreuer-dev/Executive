"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Auth } from "./Auth";

const NAV = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Market Data", href: "/market-data" },
  { label: "Workshop", href: "/workshop" },
  { label: "Sell", href: "/sell" },
];

function isActive(pathname: string, href: string) {
  if (href === "/marketplace")
    return pathname.startsWith("/marketplace") || pathname.startsWith("/listing");
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const onMarketplace = pathname.startsWith("/marketplace");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/marketplace?q=${encodeURIComponent(q.trim())}` : "/marketplace");
  }

  return (
    <header className="luft-header">
      <div className="luft-bar">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <Link
            href="/"
            className="display"
            style={{ fontWeight: 700, fontSize: 26, letterSpacing: "0.02em" }}
          >
            LUFT
          </Link>
          <span
            className="lbl"
            style={{ fontSize: 10, letterSpacing: "0.22em" }}
          >
            Air-Cooled
          </span>
        </div>

        <nav
          className="luft-nav-desktop"
          style={{ display: "flex", gap: 28, fontSize: 14, fontWeight: 500 }}
        >
          {NAV.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: active ? "#0d0d0d" : "#8a8a85",
                  borderBottom: active ? "2px solid #0d0d0d" : "2px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="luft-header-right"
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18 }}
        >
          {onMarketplace ? (
            <form
              onSubmit={submitSearch}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #e6e5e2",
                background: "#fafafa",
                borderRadius: 2,
                padding: "9px 14px",
                width: 260,
              }}
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search year, model, spec…"
                aria-label="Search listings"
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  width: "100%",
                  fontSize: 13,
                  color: "#0d0d0d",
                  fontFamily: "var(--font-libre-franklin), sans-serif",
                }}
              />
            </form>
          ) : null}
          <Auth />
          {!onMarketplace && (
            <Link
              href="/sell"
              style={{
                background: "#0d0d0d",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 18px",
              }}
            >
              List your car
            </Link>
          )}
        </div>

        <button
          type="button"
          className="luft-hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <path d="M5 5 19 19" />
                <path d="M19 5 5 19" />
              </>
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="luft-mobile-menu">
          {NAV.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Auth variant="menu" />
          <Link className="luft-mm-cta" href="/sell" onClick={() => setOpen(false)}>
            List your car
          </Link>
        </div>
      )}
    </header>
  );
}
