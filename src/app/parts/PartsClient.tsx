"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FooterSimple } from "@/components/luft/Footer";
import { PART_MODELS, partModelLabel, type Part } from "@/lib/luft/parts-model";

const usd = (n: number) => "$" + n.toLocaleString("en-US");

export function PartsClient({ parts }: { parts: Part[] }) {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("all");

  const view = useMemo(() => {
    let list = parts;
    // Model filter: "all" shows everything; a specific model shows parts tagged
    // for it plus universal ("all / multiple") parts.
    if (model !== "all") list = list.filter((p) => p.model === model || p.model === "all");
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length) {
      list = list.filter((p) => {
        const hay = `${p.title} ${p.description} ${p.partNumber ?? ""}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }
    return list;
  }, [parts, query, model]);

  return (
    <div style={{ background: "#ffffff" }}>
      {/* HERO */}
      <section className="luft-container" style={{ padding: "52px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div className="lbl" style={{ color: "#0d0d0d" }}>
              Parts &amp; Spares · Air-Cooled
            </div>
            <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 60, lineHeight: 1.0, textTransform: "uppercase", margin: "12px 0 10px" }}>
              Parts marketplace
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 540 }}>
              Used, NOS, and restored parts for air-cooled 911s, 912s, and 930s —
              listed by enthusiasts and specialists. Find what fits your chassis.
            </p>
          </div>
          <Link
            href="/parts/sell"
            style={{ background: "#0d0d0d", color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "15px 28px", whiteSpace: "nowrap" }}
          >
            List a part →
          </Link>
        </div>
      </section>

      {/* CONTROLS */}
      <section className="luft-container" style={{ padding: "32px 40px 0" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search parts — e.g. Fuchs, CIS distributor, 964 seats, part number…"
          aria-label="Search parts"
          style={{
            width: "100%",
            border: "1px solid #e6e5e2",
            background: "#fafafa",
            borderRadius: 2,
            padding: "13px 16px",
            fontSize: 14,
            color: "#0d0d0d",
            outline: "none",
            fontFamily: "var(--font-libre-franklin), sans-serif",
          }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {PART_MODELS.map((m) => {
            const on = model === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setModel(m.key)}
                style={{
                  fontFamily: "var(--font-libre-franklin), sans-serif",
                  fontSize: 13,
                  fontWeight: on ? 600 : 500,
                  padding: "8px 14px",
                  cursor: "pointer",
                  background: on ? "#0d0d0d" : "#ffffff",
                  color: on ? "#ffffff" : "#3f3f3d",
                  border: on ? "1px solid #0d0d0d" : "1px solid #e6e5e2",
                  borderRadius: 2,
                }}
              >
                {m.key === "all" ? "All parts" : m.label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 13, color: "#8a8a85", marginTop: 16, paddingBottom: 4 }}>
          {view.length} part{view.length === 1 ? "" : "s"} listed
        </div>
      </section>

      {/* GRID */}
      <section className="luft-container" style={{ padding: "18px 40px 0" }}>
        {view.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "28px 26px" }}>
            {view.map((p) => (
              <PartCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#8a8a85" }}>
            <div className="display" style={{ fontSize: 28, color: "#0d0d0d", textTransform: "uppercase" }}>
              No parts match — yet.
            </div>
            <p style={{ marginTop: 10, fontSize: 14 }}>
              Try another search or model, or{" "}
              <Link href="/parts/sell" style={{ textDecoration: "underline" }}>list the first one</Link>.
            </p>
          </div>
        )}
      </section>

      <FooterSimple />
    </div>
  );
}

function PartCard({ p }: { p: Part }) {
  const photo = p.photos[0];
  const contactHref = `mailto:${p.sellerEmail}?subject=${encodeURIComponent("LUFT parts — " + p.title)}`;
  return (
    <div style={{ border: "1px solid #e6e5e2", background: "#ffffff", borderRadius: 3, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className={photo ? "" : "luft-hatch"} style={{ position: "relative", aspectRatio: "4 / 3", background: photo ? "#e5e4e0" : undefined, overflow: "hidden" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={p.title} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
        <span className="mono" style={{ position: "absolute", top: 12, left: 12, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(251,249,245,.92)", color: "#3f3f3d", padding: "4px 8px", borderRadius: 2 }}>
          {p.model === "all" ? "Fits multiple" : partModelLabel(p.model)}
        </span>
      </div>
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.25 }}>{p.title}</h3>
        <p style={{ fontSize: 13.5, color: "#5e5e5a", lineHeight: 1.5, marginTop: 7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {p.description}
        </p>
        {p.partNumber && (
          <div className="mono" style={{ fontSize: 11, color: "#8a8a85", marginTop: 10 }}>
            Part # {p.partNumber}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: "auto", paddingTop: 16 }}>
          <span className="mono" style={{ fontSize: p.price ? 19 : 14, fontWeight: 500 }}>
            {p.price ? usd(p.price) : "Make an offer"}
          </span>
          <a href={contactHref} style={{ background: "#0d0d0d", color: "#ffffff", fontSize: 13, fontWeight: 600, padding: "9px 14px", whiteSpace: "nowrap" }}>
            Contact seller →
          </a>
        </div>
      </div>
    </div>
  );
}
