import Link from "next/link";
import { DISCLAIMER, SOURCES_LINE, TAGLINE } from "@/lib/luft";
import { SubscribeForm } from "@/components/luft/SubscribeForm";

// Simple flex footer — Marketplace, Listing, Analytics, Workshop.
export function FooterSimple() {
  return (
    <footer className="luft-container" style={{ padding: "56px 40px 44px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 28,
          borderTop: "1px solid #e6e5e2",
          paddingTop: 36,
          paddingBottom: 36,
          borderBottom: "1px solid #e6e5e2",
          marginBottom: 28,
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <div className="display" style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase", lineHeight: 1.1 }}>
            New air-cooled listings, every morning
          </div>
          <p style={{ fontSize: 14, color: "#5e5e5a", marginTop: 8, lineHeight: 1.55 }}>
            One email a day with every 911, 912, and 930 that just came to market.
          </p>
        </div>
        <SubscribeForm />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span className="display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "0.02em" }}>
            LUFT
          </span>
          <span
            className="mono"
            style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0d0d0d" }}
          >
            {TAGLINE}
          </span>
        </div>
        <span className="mono" style={{ fontSize: 12, color: "#8a8a85" }}>
          {SOURCES_LINE} · {DISCLAIMER}
        </span>
      </div>
    </footer>
  );
}

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Market",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Market Data", href: "/market-data" },
      { label: "Sell a car", href: "/sell" },
    ],
  },
  {
    title: "Workshop",
    links: [
      { label: "Service guides", href: "/workshop" },
      { label: "AI diagnostics", href: "/workshop" },
      { label: "LUFT Pro", href: "/workshop" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Sources", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

// Full grid footer — Home, Sell, Account.
export function FooterGrid() {
  return (
    <footer className="luft-container" style={{ padding: "88px 40px 48px" }}>
      <div
        className="luft-grid-4"
        style={{
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 40,
          borderTop: "1px solid #e6e5e2",
          paddingTop: 40,
        }}
      >
        <div>
          <span className="display" style={{ fontWeight: 700, fontSize: 24, letterSpacing: "0.02em" }}>
            LUFT
          </span>
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#0d0d0d",
              marginTop: 8,
            }}
          >
            {TAGLINE}
          </div>
          <p style={{ fontSize: 13, color: "#8a8a85", marginTop: 12, maxWidth: 280, lineHeight: 1.55 }}>
            The marketplace and workshop for air-cooled Porsche 911s. Built by enthusiasts, for owners.
          </p>
          <div className="lbl" style={{ margin: "22px 0 10px" }}>Daily new-listing alerts</div>
          <SubscribeForm />
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="lbl" style={{ marginBottom: 14 }}>
              {col.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14 }}>
              {col.links.map((l, i) => (
                <Link key={col.title + i} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 40,
          paddingTop: 22,
          borderTop: "1px solid #e6e5e2",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: "#8a8a85" }}>
          © 2026 LUFT · {SOURCES_LINE}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "#8a8a85" }}>
          {DISCLAIMER}
        </span>
      </div>
    </footer>
  );
}
