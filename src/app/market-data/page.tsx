"use client";

import { useMemo, useState } from "react";
import { FooterSimple } from "@/components/luft/Footer";
import { LiveRow } from "@/components/luft/pieces";

type RangeKey = "3M" | "1Y" | "3Y" | "5Y";

const BASE: Record<string, number> = {
  all: 95000,
  "911": 78000,
  "912": 44000,
  "930": 135000,
  "964": 82000,
  "993": 150000,
};
const LABELS: Record<string, string> = {
  all: "All air-cooled",
  "911": "911 · SC · Carrera",
  "912": "912",
  "930": "930 Turbo",
  "964": "964",
  "993": "993",
};
const MODEL_KEYS = ["all", "911", "912", "930", "964", "993"];
const RANGE_KEYS: RangeKey[] = ["3M", "1Y", "3Y", "5Y"];
const RANGE_LABEL: Record<RangeKey, string> = {
  "3M": "Trailing 3 months",
  "1Y": "Trailing 12 months",
  "3Y": "Trailing 3 years",
  "5Y": "Trailing 5 years",
};

function series(key: string) {
  const b = BASE[key];
  const n = 60;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const v = b * (1 + 0.52 * t) * (1 + 0.055 * Math.sin(i / 5.5)) * (1 + 0.02 * Math.sin(i / 2.3));
    out.push(Math.round(v / 500) * 500);
  }
  return out;
}
const months = (key: RangeKey) => ({ "3M": 3, "1Y": 12, "3Y": 36, "5Y": 60 }[key]);
const fmtK = (v: number) => "$" + Math.round(v / 1000) + "k";
const fmtUSD = (v: number) => "$" + Math.round(v).toLocaleString("en-US");
function monthLabel(offsetFromEnd: number) {
  const d = new Date(2026, 6, 1);
  d.setMonth(d.getMonth() - offsetFromEnd);
  return d.toLocaleString("en-US", { month: "short" }) + " '" + String(d.getFullYear()).slice(2);
}
function sparkPoints(s: number[]) {
  const mn = Math.min(...s);
  const mx = Math.max(...s);
  return s
    .map((v, i) => ((i / (s.length - 1)) * 140).toFixed(1) + "," + (32 - ((v - mn) / (mx - mn || 1)) * 30).toFixed(1))
    .join(" ");
}

const GENS: [string, number][] = [
  ["993 Carrera / Turbo", 150000],
  ["930 Turbo", 138000],
  ["964 Carrera / Turbo", 88000],
  ["911 · SC · Carrera 3.2", 78000],
  ["912 / 912E", 44000],
];
const VOLS: [string, number][] = [
  ["Q3 24", 38],
  ["Q4 24", 44],
  ["Q1 25", 41],
  ["Q2 25", 52],
  ["Q3 25", 49],
  ["Q4 25", 58],
  ["Q1 26", 61],
  ["Q2 26", 67],
];
const MOVERS: [string, number][] = [
  ["993 Turbo / Turbo S", 18.4],
  ["964 Turbo 3.3", 14.1],
  ["911 Carrera RS 2.7", 11.2],
  ["911 Carrera 3.2 (G50)", 7.3],
  ["912 / 912E", 5.1],
];
const SALES = [
  { date: "Jul 18", car: "1997 993 Carrera S", price: "$182,500", miles: "31,200 mi", vs: "−2.4%", source: "Bring a Trailer" },
  { date: "Jul 16", car: "1989 911 Carrera 3.2 G50", price: "$94,000", miles: "58,900 mi", vs: "+5.1%", source: "Cars & Bids" },
  { date: "Jul 15", car: "1987 930 Turbo", price: "$149,750", miles: "44,100 mi", vs: "+8.5%", source: "PCARMARKET" },
  { date: "Jul 13", car: "1973 911 T", price: "$121,000", miles: "62,400 mi", vs: "+2.5%", source: "Broad Arrow" },
  { date: "Jul 11", car: "1994 964 Carrera 2", price: "$76,250", miles: "71,800 mi", vs: "−3.4%", source: "Bring a Trailer" },
  { date: "Jul 09", car: "1976 912E", price: "$41,900", miles: "88,600 mi", vs: "+1.8%", source: "Hemmings" },
];

export default function MarketDataPage() {
  const [model, setModel] = useState("all");
  const [range, setRange] = useState<RangeKey>("1Y");

  const v = useMemo(() => {
    const full = series(model);
    const m = months(range);
    const vis = full.slice(full.length - m);
    const high = vis.map((x) => x * 1.13);
    const low = vis.map((x) => x * 0.89);
    const minY = Math.min(...low);
    const maxY = Math.max(...high);
    const n = vis.length;
    const X = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * 1000);
    const Y = (val: number) => 12 + (1 - (val - minY) / (maxY - minY)) * 316;
    const line = vis.map((val, i) => X(i).toFixed(1) + "," + Y(val).toFixed(1)).join(" ");
    const bandTop = high.map((val, i) => X(i).toFixed(1) + "," + Y(val).toFixed(1)).join(" L");
    const bandBot = low
      .map((val, i) => X(i).toFixed(1) + "," + Y(val).toFixed(1))
      .reverse()
      .join(" L");
    const bandPath = "M" + bandTop + " L" + bandBot + " Z";

    const yTicks: { label: string; topPct: number }[] = [];
    for (let t = 0; t < 4; t++) {
      const val = minY + (maxY - minY) * ((3 - t) / 3);
      yTicks.push({ label: fmtK(val), topPct: (t / 3) * 100 });
    }
    const xTicks: string[] = [];
    const steps = Math.min(6, n);
    for (let s = 0; s < steps; s++) {
      const i = Math.round((s / (steps - 1)) * (n - 1));
      xTicks.push(monthLabel(n - 1 - i));
    }

    const cur = vis[vis.length - 1];
    const first = vis[0];
    const chg = ((cur - first) / first) * 100;
    const chgStr = (chg >= 0 ? "↑ " : "↓ ") + Math.abs(chg).toFixed(1) + "%";
    const vol = Math.round((BASE[model] < 60000 ? 260 : BASE[model] > 120000 ? 42 : 120) * (m / 12));
    const dom = model === "993" || model === "930" ? 46 : model === "912" ? 71 : 58;
    const str = model === "993" ? 83 : model === "912" ? 69 : 76;

    const kpis = [
      { label: "Median sale price", value: fmtUSD(cur), delta: chgStr, sub: LABELS[model], spark: sparkPoints(vis) },
      { label: "Vs 90 days ago", value: (chg >= 0 ? "+" : "") + (chg * 0.42).toFixed(1) + "%", delta: "Trending", sub: "rolling median", spark: sparkPoints(vis.slice(-6)) },
      { label: "Units sold · " + range, value: String(vol), delta: "↑ 8.1%", sub: "vs prior period", spark: sparkPoints(vis.map((val, i) => val * (0.8 + 0.02 * i))) },
      { label: "Avg days on market", value: String(dom), delta: "↓ 6 days", sub: "faster sell-through", spark: sparkPoints(vis.slice(-10).map((val) => maxY - val + minY)) },
      { label: "Sell-through rate", value: str + "%", delta: "↑ 3 pts", sub: "lots meeting reserve", spark: sparkPoints(vis.slice(-8)) },
    ];

    return { bandPath, line, yTicks, xTicks, kpis };
  }, [model, range]);

  return (
    <div style={{ background: "#ffffff" }}>
      {/* TITLE + CONTROLS */}
      <section className="luft-container" style={{ padding: "52px 40px 0" }}>
        <LiveRow pulse={false} marginBottom={16}>
          Market Data · Updated hourly
        </LiveRow>
        <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 60, lineHeight: 1, textTransform: "uppercase" }}>
          The air-cooled 911 market
        </h1>
        <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.55, color: "#5e5e5a", maxWidth: 600 }}>
          Real sold comps aggregated from 40+ US auction and dealer sources,
          benchmarked by generation, model, and year — not asking prices, actual
          results.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
            flexWrap: "wrap",
            marginTop: 34,
            borderBottom: "1px solid #0d0d0d",
            paddingBottom: 18,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MODEL_KEYS.map((k) => {
              const on = k === model;
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
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 2, border: "1px solid #e6e5e2" }}>
            {RANGE_KEYS.map((k) => {
              const on = k === range;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRange(k)}
                  style={{
                    border: "none",
                    background: on ? "#0d0d0d" : "transparent",
                    color: on ? "#ffffff" : "#5e5e5a",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 12,
                    padding: "9px 16px",
                    cursor: "pointer",
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* KPI ROW */}
      <section className="luft-container" style={{ padding: "0 40px" }}>
        <div className="luft-grid-5">
          {v.kpis.map((k, i) => (
            <div
              key={k.label}
              style={{
                padding: "24px 22px 22px",
                borderBottom: "1px solid #e6e5e2",
                borderTop: "1px solid #e6e5e2",
                borderRight: i === v.kpis.length - 1 ? "none" : "1px solid #e6e5e2",
              }}
            >
              <div className="lbl">{k.label}</div>
              <div className="mono" style={{ fontSize: 27, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 12 }}>
                {k.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span className="mono" style={{ fontSize: 12, color: "#0d0d0d" }}>
                  {k.delta}
                </span>
                <span style={{ fontSize: 11, color: "#8a8a85" }}>{k.sub}</span>
              </div>
              <svg viewBox="0 0 140 34" preserveAspectRatio="none" style={{ width: "100%", height: 26, marginTop: 14, display: "block" }}>
                <polyline points={k.spark} fill="none" stroke="#0d0d0d" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN TREND CHART */}
      <section className="luft-container" style={{ padding: "56px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
          <h2 className="display" style={{ fontWeight: 600, fontSize: 26, textTransform: "uppercase" }}>
            Median sale price · {LABELS[model]}
          </h2>
          <span className="lbl">{RANGE_LABEL[range]} · shaded band = comp range (low–high)</span>
        </div>
        <div style={{ border: "1px solid #e6e5e2", padding: "26px 26px 0", display: "grid", gridTemplateColumns: "64px 1fr" }}>
          <div style={{ position: "relative", height: 340 }}>
            {v.yTicks.map((t, i) => (
              <div
                key={i}
                className="mono"
                style={{ position: "absolute", right: 12, top: `${t.topPct}%`, transform: "translateY(-50%)", fontSize: 10, color: "#8a8a85" }}
              >
                {t.label}
              </div>
            ))}
          </div>
          <div style={{ position: "relative", height: 340 }}>
            <svg viewBox="0 0 1000 340" preserveAspectRatio="none" style={{ width: "100%", height: 340, display: "block" }}>
              {[12, 121, 230, 328].map((y) => (
                <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#eeeeec" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={v.bandPath} fill="#ececea" stroke="none" />
              <polyline points={v.line} fill="none" stroke="#0d0d0d" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 22px" }}>
            {v.xTicks.map((x, i) => (
              <span key={i} className="lbl">
                {x}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TWO PANELS */}
      <section className="luft-container luft-grid-2" style={{ padding: "56px 40px 0", gap: 48 }}>
        <div>
          <PanelHead>Median price by generation</PanelHead>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 18 }}>
            {GENS.map(([label, val]) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
                  <span className="mono" style={{ fontSize: 13 }}>
                    {fmtUSD(val)}
                  </span>
                </div>
                <div style={{ height: 10, background: "#f0efec" }}>
                  <div style={{ height: 10, width: `${(val / 150000) * 100}%`, background: "#0d0d0d" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <PanelHead>Sales volume by quarter</PanelHead>
          <div style={{ marginTop: 22, display: "flex", alignItems: "flex-end", gap: 10, height: 220 }}>
            {VOLS.map(([label, val]) => (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <span className="mono" style={{ fontSize: 11, marginBottom: 6 }}>
                  {val}
                </span>
                <div style={{ width: "100%", height: `${(val / 67) * 100}%`, background: "#0d0d0d", minHeight: 2 }} />
                <span className="lbl" style={{ marginTop: 8, fontSize: 9 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPRECIATION LEADERBOARD */}
      <section className="luft-container" style={{ padding: "56px 40px 0" }}>
        <PanelHead>12-month appreciation leaders</PanelHead>
        <div style={{ marginTop: 8 }}>
          {MOVERS.map(([label, pct], i) => (
            <div
              key={label}
              style={{ display: "grid", gridTemplateColumns: "40px 1.4fr 2fr 120px", gap: 24, alignItems: "center", padding: "18px 0", borderBottom: "1px solid #eeeeec" }}
            >
              <span className="mono" style={{ fontSize: 13, color: "#8a8a85" }}>
                0{i + 1}
              </span>
              <span style={{ fontSize: 16, fontWeight: 500 }}>{label}</span>
              <div style={{ height: 8, background: "#f0efec" }}>
                <div style={{ height: 8, width: `${(pct / 18.4) * 100}%`, background: "#0d0d0d" }} />
              </div>
              <span className="mono" style={{ fontSize: 18, textAlign: "right" }}>
                +{pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT VERIFIED SALES */}
      <section className="luft-container" style={{ padding: "56px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <h2 className="display" style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase" }}>
            Recent verified sales
          </h2>
          <span className="lbl">Trailing 30 days · 6 of 214 shown</span>
        </div>
        <div className="luft-scroll">
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.8fr 1fr 0.9fr 0.9fr 1fr", padding: "0 0 12px", borderBottom: "1px solid #0d0d0d" }}>
              <span className="lbl">Date</span>
              <span className="lbl">Car</span>
              <span className="lbl">Sold price</span>
              <span className="lbl">Mileage</span>
              <span className="lbl">Vs median</span>
              <span className="lbl" style={{ textAlign: "right" }}>
                Source
              </span>
            </div>
            {SALES.map((s) => (
              <div
                key={s.date + s.car}
                style={{ display: "grid", gridTemplateColumns: "0.8fr 1.8fr 1fr 0.9fr 0.9fr 1fr", padding: "17px 0", borderBottom: "1px solid #eeeeec", alignItems: "center" }}
              >
                <span className="mono" style={{ fontSize: 13, color: "#5e5e5a" }}>
                  {s.date}
                </span>
                <span style={{ fontSize: 15 }}>{s.car}</span>
                <span className="mono" style={{ fontSize: 14 }}>
                  {s.price}
                </span>
                <span className="mono" style={{ fontSize: 13, color: "#5e5e5a" }}>
                  {s.miles}
                </span>
                <span className="mono" style={{ fontSize: 13, color: "#5e5e5a" }}>
                  {s.vs}
                </span>
                <span style={{ fontSize: 13, textAlign: "right", color: "#5e5e5a" }}>
                  {s.source}
                </span>
              </div>
            ))}
          </div>
        </div>
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
