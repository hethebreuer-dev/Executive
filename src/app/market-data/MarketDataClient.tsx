"use client";

import { useMemo, useState } from "react";
import { FooterSimple } from "@/components/luft/Footer";
import { CardLink, LiveRow } from "@/components/luft/pieces";
import {
  deltaText,
  miles as fmtMiles,
  usd,
  usdk,
  type Listing,
  type ModelKey,
} from "@/lib/luft";
import { marketSummary } from "@/lib/luft/market";

const MODEL_KEYS: ModelKey[] = ["all", "911", "912", "930", "964", "993"];
const LABELS: Record<ModelKey, string> = {
  all: "All air-cooled",
  "911": "911 · SC · Carrera",
  "912": "912",
  "930": "930 Turbo",
  "964": "964",
  "993": "993",
};

export function MarketDataClient({ listings }: { listings: Listing[] }) {
  const [model, setModel] = useState<ModelKey>("all");

  const summary = useMemo(() => marketSummary(listings), [listings]);
  const gens = useMemo(() => summary.filter((s) => s.key !== "all" && s.count > 0), [summary]);
  const maxGenMedian = Math.max(1, ...gens.map((g) => g.median));
  const maxGenCount = Math.max(1, ...gens.map((g) => g.count));

  const v = useMemo(() => {
    const subset =
      model === "all" ? listings : listings.filter((l) => l.key === model);
    const prices = subset.map((l) => l.price).sort((a, b) => a - b);
    const cur = summary.find((s) => s.key === model)!;

    // Price distribution — bucket the selected subset into 12 bins.
    const bins = 12;
    const lo = prices[0] ?? 0;
    const hi = prices[prices.length - 1] ?? 0;
    const span = hi - lo || 1;
    const hist = new Array(bins).fill(0) as number[];
    for (const p of prices) {
      const idx = Math.min(bins - 1, Math.floor(((p - lo) / span) * bins));
      hist[idx]++;
    }
    const maxBin = Math.max(1, ...hist);

    // Table: priciest first (link out to source).
    const table = [...subset].sort((a, b) => b.price - a.price).slice(0, 12);

    return { cur, lo, hi, hist, maxBin, count: subset.length, table };
  }, [model, listings, summary]);

  const kpis = [
    { label: "Live listings", value: v.count ? v.count.toLocaleString("en-US") : "—" },
    { label: "Median asking", value: v.cur.median ? usd(v.cur.median) : "—" },
    { label: "Average asking", value: v.cur.avg ? usd(v.cur.avg) : "—" },
    { label: "Lowest", value: v.cur.min ? usdk(v.cur.min) : "—" },
    { label: "Highest", value: v.cur.max ? usdk(v.cur.max) : "—" },
  ];

  return (
    <div style={{ background: "#ffffff" }}>
      {/* TITLE + CONTROLS */}
      <section className="luft-container" style={{ padding: "52px 40px 0" }}>
        <LiveRow pulse={false} marginBottom={16}>
          Market Data · Live asking prices · Updated hourly
        </LiveRow>
        <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 60, lineHeight: 1, textTransform: "uppercase" }}>
          The air-cooled 911 market
        </h1>
        <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 620 }}>
          Every air-cooled 911, 912, and 930 currently for sale across 40+ US
          auction and dealer sources — {listings.length.toLocaleString("en-US")}{" "}
          live listings, benchmarked by generation. Figures are asking-price
          medians, recomputed hourly from live inventory.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 34, borderBottom: "1px solid #0d0d0d", paddingBottom: 18 }}>
          {MODEL_KEYS.map((k) => {
            const on = k === model;
            const c = summary.find((s) => s.key === k)?.count ?? 0;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setModel(k)}
                style={{
                  border: on ? "1px solid #0d0d0d" : "1px solid #e6e5e2",
                  background: on ? "#0d0d0d" : "transparent",
                  color: on ? "#ffffff" : "#0d0d0d",
                  fontFamily: "var(--font-libre-franklin), sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  padding: "8px 15px",
                  cursor: "pointer",
                }}
              >
                {LABELS[k]}
                <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: on ? "#b0afaa" : "#a3a29d" }}>
                  {c}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* KPI ROW */}
      <section className="luft-container" style={{ padding: "0 40px" }}>
        <div className="luft-grid-5">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              style={{
                padding: "24px 22px 22px",
                borderBottom: "1px solid #e6e5e2",
                borderTop: "1px solid #e6e5e2",
                borderRight: i === kpis.length - 1 ? "none" : "1px solid #e6e5e2",
              }}
            >
              <div className="lbl">{k.label}</div>
              <div className="mono" style={{ fontSize: 27, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 12 }}>
                {k.value}
              </div>
              <div style={{ fontSize: 11, color: "#8a8a85", marginTop: 8 }}>{LABELS[model]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICE DISTRIBUTION */}
      <section className="luft-container" style={{ padding: "56px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
          <h2 className="display" style={{ fontWeight: 600, fontSize: 26, textTransform: "uppercase" }}>
            Asking-price distribution · {LABELS[model]}
          </h2>
          <span className="lbl">{v.count} listings · {usdk(v.lo)}–{usdk(v.hi)}</span>
        </div>
        <div style={{ border: "1px solid #e6e5e2", padding: "28px 30px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 200 }}>
            {v.hist.map((n, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <span className="mono" style={{ fontSize: 10, color: "#8a8a85", marginBottom: 5 }}>{n || ""}</span>
                <div style={{ width: "100%", height: `${(n / v.maxBin) * 100}%`, background: "#0d0d0d", minHeight: n ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, borderTop: "1px solid #eeeeec", paddingTop: 10 }}>
            <span className="lbl">{usdk(v.lo)}</span>
            <span className="lbl">{usdk(Math.round((v.lo + v.hi) / 2))}</span>
            <span className="lbl">{usdk(v.hi)}</span>
          </div>
        </div>
      </section>

      {/* TWO PANELS: median + count by generation */}
      <section className="luft-container luft-grid-2" style={{ padding: "56px 40px 0", gap: 48 }}>
        <div>
          <PanelHead>Median asking by generation</PanelHead>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 18 }}>
            {gens.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setModel(g.key)}
                style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{g.label}</span>
                  <span className="mono" style={{ fontSize: 13 }}>{usd(g.median)}</span>
                </div>
                <div style={{ height: 10, background: "#f0efec" }}>
                  <div style={{ height: 10, width: `${(g.median / maxGenMedian) * 100}%`, background: "#0d0d0d" }} />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <PanelHead>Live listings by generation</PanelHead>
          <div style={{ marginTop: 22, display: "flex", alignItems: "flex-end", gap: 12, height: 220 }}>
            {gens.map((g) => (
              <div key={g.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <span className="mono" style={{ fontSize: 12, marginBottom: 6 }}>{g.count}</span>
                <div style={{ width: "100%", height: `${(g.count / maxGenCount) * 100}%`, background: "#0d0d0d", minHeight: 2 }} />
                <span className="lbl" style={{ marginTop: 8, fontSize: 9, textAlign: "center" }}>{g.key}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRENT LISTINGS TABLE */}
      <section className="luft-container" style={{ padding: "56px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <h2 className="display" style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase" }}>
            Highest-priced live listings · {LABELS[model]}
          </h2>
          <span className="lbl">Top {v.table.length} of {v.count}</span>
        </div>
        <div className="luft-scroll">
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 0.9fr 0.9fr 1fr", padding: "0 0 12px", borderBottom: "1px solid #0d0d0d" }}>
              <span className="lbl">Car</span>
              <span className="lbl">Asking</span>
              <span className="lbl">Vs market</span>
              <span className="lbl">Mileage</span>
              <span className="lbl" style={{ textAlign: "right" }}>Source</span>
            </div>
            {v.table.map((c) => (
              <CardLink
                key={c.canonicalId}
                c={c}
                style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 0.9fr 0.9fr 1fr", padding: "16px 0", borderBottom: "1px solid #eeeeec", alignItems: "center", color: "inherit" }}
              >
                <span style={{ fontSize: 15 }}>{c.year} {c.title}</span>
                <span className="mono" style={{ fontSize: 14 }}>{usd(c.price)}</span>
                <span className="mono" style={{ fontSize: 13, color: "#5e5e5a" }}>{deltaText(c.delta)}</span>
                <span className="mono" style={{ fontSize: 13, color: "#5e5e5a" }}>{c.miles ? fmtMiles(c.miles) : "—"}</span>
                <span style={{ fontSize: 13, textAlign: "right", color: "#5e5e5a" }}>{c.source}</span>
              </CardLink>
            ))}
          </div>
        </div>
        <p className="mono" style={{ fontSize: 11, color: "#8a8a85", marginTop: 20 }}>
          Asking prices only. Sold-result history is paywalled at the source and
          not included — see a car&apos;s source listing for full detail.
        </p>
      </section>

      <FooterSimple />
    </div>
  );
}

function PanelHead({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="display"
      style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase", borderBottom: "1px solid #0d0d0d", paddingBottom: 14 }}
    >
      {children}
    </h2>
  );
}
