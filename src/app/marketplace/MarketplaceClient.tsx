"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  MODEL_DEFS,
  deltaColor,
  deltaText,
  miles,
  usd,
  usdk,
  type Listing,
  type ModelKey,
} from "@/lib/luft";
import { FooterSimple } from "@/components/luft/Footer";
import { CardLink, CardPhoto, ImageSlot, LiveRow } from "@/components/luft/pieces";

type SortKey =
  | "relevance"
  | "value"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "year-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Featured" },
  { value: "value", label: "Best value vs market" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "year-desc", label: "Year: newest" },
  { value: "year-asc", label: "Year: oldest" },
];

const BODY_OPTIONS = ["Coupe", "Targa", "Cabriolet"];
const TRANS_OPTIONS = ["Manual", "Tiptronic", "Sportomatic"];

/** Match a coarse transmission group against the free-text transmission field
 *  (e.g. "5-spd G50", "6-spd manual", "Tiptronic", "Sportomatic"). */
function matchTrans(group: string, trans: string): boolean {
  const t = trans.toLowerCase();
  if (group === "Manual") return /manual|-spd|\bspd\b|speed|915|g50/.test(t);
  if (group === "Tiptronic") return /tiptronic|automatic/.test(t);
  if (group === "Sportomatic") return /sportomatic/.test(t);
  return false;
}

/** "$30k" / "30k" / "30000" → 30000 · "" → null */
function parsePriceInput(s: string): number | null {
  const cleaned = s.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return null;
  return /k\+?$/.test(cleaned) ? Math.round(n * 1000) : Math.round(n);
}

function sortListings(list: Listing[], sort: SortKey) {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "year-desc":
      return out.sort((a, b) => b.year - a.year);
    case "year-asc":
      return out.sort((a, b) => a.year - b.year);
    case "value":
      return out.sort((a, b) => a.delta - b.delta);
    default:
      return out.sort((a, b) => b.delta - a.delta);
  }
}

export function MarketplaceClient({ listings }: { listings: Listing[] }) {
  const qParam = useSearchParams().get("q") ?? "";
  const [model, setModel] = useState<ModelKey>("all");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [query, setQuery] = useState(qParam);
  const [bodies, setBodies] = useState<string[]>([]);
  const [transmissions, setTransmissions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Re-sync the search box when the header submits ?q=… on this page — done
  // during render (React's "adjust state on prop change" pattern), not an effect.
  const [prevQ, setPrevQ] = useState(qParam);
  if (qParam !== prevQ) {
    setPrevQ(qParam);
    setQuery(qParam);
  }

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const hasFilters =
    model !== "all" ||
    query.trim() !== "" ||
    bodies.length > 0 ||
    transmissions.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "";

  function resetFilters() {
    setModel("all");
    setQuery("");
    setBodies([]);
    setTransmissions([]);
    setMinPrice("");
    setMaxPrice("");
  }

  const view = useMemo(() => {
    let filtered =
      model === "all" ? [...listings] : listings.filter((c) => c.key === model);

    if (bodies.length) filtered = filtered.filter((c) => bodies.includes(c.body));
    if (transmissions.length)
      filtered = filtered.filter((c) => transmissions.some((t) => matchTrans(t, c.trans)));

    const min = parsePriceInput(minPrice);
    const max = parsePriceInput(maxPrice);
    if (min != null) filtered = filtered.filter((c) => c.price >= min);
    if (max != null) filtered = filtered.filter((c) => c.price <= max);

    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length) {
      filtered = filtered.filter((c) => {
        const hay = `${c.year} ${c.title} ${c.source} ${c.city} ${c.state} ${c.trans} ${c.body}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }

    const list = sortListings(filtered, sort);
    const prices = list.map((c) => c.price).sort((a, b) => a - b);
    const median = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
    const low = prices.length ? prices[0] : 0;
    const high = prices.length ? prices[prices.length - 1] : 0;

    // Real asking-price distribution (12 bins) rendered as the hero sparkline.
    const bins = 12;
    const span = high - low || 1;
    const hist = new Array(bins).fill(0) as number[];
    for (const p of prices) hist[Math.min(bins - 1, Math.floor(((p - low) / span) * bins))]++;
    const maxBin = Math.max(1, ...hist);
    const spark = hist
      .map((n, i) => (i / (bins - 1)) * 300 + "," + (52 - (n / maxBin) * 48).toFixed(1))
      .join(" ");

    const md = MODEL_DEFS.find((m) => m.key === model);
    return {
      list,
      featured: list[0] ?? null,
      rest: list.slice(1),
      count: list.length,
      median,
      low,
      high,
      marketLabel: md ? md.label : "All air-cooled",
      sparkPoints: spark,
    };
  }, [model, sort, listings, query, bodies, transmissions, minPrice, maxPrice]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: listings.length };
    for (const m of MODEL_DEFS) {
      if (m.key !== "all") c[m.key] = listings.filter((l) => l.key === m.key).length;
    }
    return c;
  }, [listings]);

  function toggleSave(id: number) {
    setSaved((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <div style={{ background: "#ffffff" }}>
      {/* HERO */}
      <section className="luft-container" style={{ padding: "52px 40px 40px" }}>
        <div className="luft-grid-2" style={{ gap: 56, alignItems: "end" }}>
          <div>
            <LiveRow>Live Marketplace</LiveRow>
            <h1
              className="display luft-h1"
              style={{
                fontWeight: 600,
                fontSize: 66,
                lineHeight: 1.08,
                textTransform: "uppercase",
              }}
            >
              Air-cooled 911s,
              <br />
              <span
                style={{
                  textDecoration: "underline",
                  textDecorationThickness: 3,
                  textUnderlineOffset: 5,
                }}
              >
                every listing
              </span>{" "}
              in one place.
            </h1>
            <p
              style={{
                marginTop: 22,
                fontSize: 16,
                lineHeight: 1.55,
                color: "#5e5e5a",
                maxWidth: 520,
              }}
            >
              We aggregate every air-cooled 911, 912, and 930 for sale across the
              United States — auction, dealer, and private — and benchmark each
              against the live market for its generation, updated continuously.
            </p>

            <div
              style={{
                display: "flex",
                marginTop: 34,
                borderTop: "1px solid #e6e5e2",
                borderBottom: "1px solid #e6e5e2",
              }}
            >
              <div style={{ flex: 1, minWidth: 0, padding: "16px 20px 16px 0", borderRight: "1px solid #e6e5e2" }}>
                <div className="lbl" style={{ marginBottom: 7 }}>
                  Median · {view.marketLabel}
                </div>
                <div className="mono" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }}>
                  {usdk(view.median)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, padding: "16px 20px", borderRight: "1px solid #e6e5e2" }}>
                <div className="lbl" style={{ marginBottom: 7 }}>
                  Asking range
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", color: "#7a7a76" }}
                >
                  {view.count ? `${usdk(view.low)}–${usdk(view.high)}` : "—"}
                </div>
              </div>
              <div style={{ flex: 1.1, minWidth: 0, padding: "16px 0 16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  Live listings · {view.count}
                </div>
                <svg viewBox="0 0 300 56" preserveAspectRatio="none" style={{ width: "100%", height: 28, display: "block" }}>
                  <polyline points={view.sparkPoints} fill="none" stroke="#0d0d0d" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          <ImageSlot
            src="/luft/hero-marketplace.png"
            alt="Air-cooled Porsche 911 side profile"
            tag="Editorial Feature"
            height={520}
          />
        </div>
      </section>

      {/* BODY */}
      <div
        className="luft-container luft-grid-2"
        style={{ padding: "0 40px 96px", gridTemplateColumns: "236px 1fr", gap: 48 }}
      >
        {/* REFINE SIDEBAR */}
        <aside className="luft-sticky-aside" style={{ position: "sticky", top: 96, alignSelf: "start", height: "fit-content" }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#8a8a85",
              paddingBottom: 14,
              borderBottom: "1px solid #e6e5e2",
            }}
          >
            Refine
          </div>

          <div style={{ padding: "22px 0", borderBottom: "1px solid #e6e5e2" }}>
            <FilterLabel>Generation</FilterLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {MODEL_DEFS.map((m) => {
                const on = model === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModel(m.key)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textAlign: "left",
                      width: "100%",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: 2,
                      fontFamily: "var(--font-libre-franklin), sans-serif",
                      fontSize: 14,
                      fontWeight: on ? 600 : 400,
                      background: on ? "#0d0d0d" : "transparent",
                      color: on ? "#ffffff" : "#3f3f3d",
                    }}
                  >
                    <span>{m.label}</span>
                    <span className="mono" style={{ fontSize: 11, color: on ? "#cfcfca" : "#adaca7" }}>
                      {counts[m.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <CheckGroup
            title="Body"
            items={BODY_OPTIONS}
            selected={bodies}
            onToggle={(v) => toggle(bodies, setBodies, v)}
          />

          <div style={{ padding: "22px 0", borderBottom: "1px solid #e6e5e2" }}>
            <FilterLabel>Price</FilterLabel>
            <div style={{ display: "flex", gap: 8 }}>
              <PriceInput value={minPrice} onChange={setMinPrice} placeholder="$30k" />
              <PriceInput value={maxPrice} onChange={setMaxPrice} placeholder="$600k+" />
            </div>
          </div>

          <CheckGroup
            title="Transmission"
            items={TRANS_OPTIONS}
            selected={transmissions}
            onToggle={(v) => toggle(transmissions, setTransmissions, v)}
            last
          />
        </aside>

        {/* RESULTS */}
        <main>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search year, model, spec, source… (e.g. “1973 Carrera RS”)"
              style={{
                width: "100%",
                border: "1px solid #e6e5e2",
                background: "#fafafa",
                borderRadius: 2,
                padding: "13px 40px 13px 16px",
                fontSize: 14,
                color: "#0d0d0d",
                fontFamily: "var(--font-libre-franklin), sans-serif",
                outline: "none",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#8a8a85",
                  fontSize: 18,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 22,
              borderBottom: "1px solid #e6e5e2",
              marginBottom: 4,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 14, color: "#5e5e5a" }}>
              <strong style={{ color: "#0d0d0d", fontWeight: 600 }}>{view.count}</strong>{" "}
              {view.count === 1 ? "car listed" : "cars listed"} · {view.marketLabel}
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    marginLeft: 12,
                    border: "none",
                    background: "transparent",
                    color: "#8a8a85",
                    fontSize: 13,
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontFamily: "var(--font-libre-franklin), sans-serif",
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#8a8a85" }}>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                style={{
                  border: "1px solid #e6e5e2",
                  background: "#fafafa",
                  borderRadius: 2,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#0d0d0d",
                  cursor: "pointer",
                  fontFamily: "var(--font-libre-franklin), sans-serif",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {view.featured && <FeaturedCard c={view.featured} />}

          {view.rest.length > 0 ? (
            <div
              style={{
                display: "grid",
                // min(100%,300px): 300-wide cards on desktop, but never wider
                // than the viewport on a narrow phone (which would overflow).
                gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))",
                gap: "34px 30px",
              }}
            >
              {view.rest.map((c) => (
                <ResultCard
                  key={c.id}
                  c={c}
                  saved={!!saved[c.id]}
                  onSave={() => toggleSave(c.id)}
                />
              ))}
            </div>
          ) : !view.featured ? (
            <div style={{ textAlign: "center", padding: "90px 20px", color: "#8a8a85" }}>
              <div className="display" style={{ fontSize: 30, color: "#0d0d0d", textTransform: "uppercase" }}>
                No matching cars — yet.
              </div>
              <p style={{ marginTop: 10, fontSize: 14 }}>
                We scan new inventory every few minutes. Adjust your filters or check
                back shortly.
              </p>
            </div>
          ) : null}
        </main>
      </div>

      {/* WORKSHOP BAND */}
      <section style={{ background: "#0d0d0d", color: "#ffffff" }}>
        <div
          className="luft-container luft-grid-2"
          style={{ padding: "72px 40px", gap: 64, alignItems: "center" }}
        >
          <div>
            <span
              className="mono"
              style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#cfcfca" }}
            >
              Workshop · AI Service
            </span>
            <h2
              className="display"
              style={{
                fontWeight: 600,
                fontSize: 54,
                lineHeight: 0.98,
                textTransform: "uppercase",
                margin: "18px 0 16px",
              }}
            >
              Own it. Understand it.
              <br />
              <span style={{ color: "#cfcfca" }}>Fix it yourself.</span>
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#b0afaa", maxWidth: 460 }}>
              Guided, step-by-step service walkthroughs tuned to your exact chassis
              and year — from a stubborn CIS cold start to a full 964 top-end
              refresh. AI-assisted, torque-spec accurate.
            </p>
            <Link
              href="/workshop"
              style={{
                display: "inline-block",
                marginTop: 26,
                background: "#ffffff",
                color: "#0d0d0d",
                fontSize: 14,
                fontWeight: 600,
                padding: "14px 26px",
                borderRadius: 2,
              }}
            >
              Explore Workshop →
            </Link>
          </div>
          <div style={{ border: "1px solid #262626", borderRadius: 3, background: "#151515", padding: 26 }}>
            <div
              className="mono"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                color: "#8a8a85",
                paddingBottom: 16,
                borderBottom: "1px solid #262626",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0d0d0d" }} />
              1985 911 CARRERA 3.2 · VALVE ADJUSTMENT
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18, fontSize: 14, lineHeight: 1.5 }}>
              {[
                ["01", "Bring engine to full operating temp, then let cool 4+ hrs to a true cold state.", false],
                ["02", "Rotate to TDC on cylinder 1 — align the crank pulley notch.", false],
                ["03", "Set intake & exhaust to 0.10 mm (0.004 in) with a feeler gauge.", true],
              ].map(([n, t, dim]) => (
                <div key={n as string} style={{ display: "flex", gap: 12, opacity: dim ? 0.5 : 1 }}>
                  <span className="mono" style={{ color: "#0d0d0d" }}>
                    {n}
                  </span>
                  <span style={{ color: "#dcdcd8" }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, background: "#1d1d1d", borderRadius: 2, padding: "12px 14px", fontSize: 13, color: "#b0afaa" }}>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>Ask the Workshop:</span>{" "}
              “Why won’t my 3.2 idle when warm?”
            </div>
          </div>
        </div>
      </section>

      <FooterSimple />
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "#0d0d0d",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function CheckGroup({
  title,
  items,
  selected,
  onToggle,
  last,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  last?: boolean;
}) {
  return (
    <div style={{ padding: "22px 0", borderBottom: last ? "none" : "1px solid #e6e5e2" }}>
      <FilterLabel>{title}</FilterLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {items.map((it) => {
          const on = selected.includes(it);
          return (
            <button
              key={it}
              type="button"
              onClick={() => onToggle(it)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: on ? "#0d0d0d" : "#3f3f3d",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                padding: 0,
                textAlign: "left",
                fontFamily: "var(--font-libre-franklin), sans-serif",
                fontWeight: on ? 600 : 400,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                  border: on ? "1px solid #0d0d0d" : "1px solid #adaca7",
                  background: on ? "#0d0d0d" : "transparent",
                  borderRadius: 2,
                  color: "#ffffff",
                  fontSize: 11,
                  lineHeight: "13px",
                  textAlign: "center",
                }}
              >
                {on ? "✓" : ""}
              </span>
              {it}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      className="mono"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: 1,
        // min-width:0 lets the input shrink inside the flex row; without it the
        // default min-width:auto keeps two inputs + gap wider than a narrow
        // phone, which the body's overflow-x:hidden then clips ("cut off").
        minWidth: 0,
        width: "100%",
        border: "1px solid #e6e5e2",
        background: "#fafafa",
        borderRadius: 2,
        padding: "8px 10px",
        fontSize: 12,
        color: "#0d0d0d",
        outline: "none",
      }}
    />
  );
}

function FeaturedCard({ c }: { c: Listing }) {
  return (
    <CardLink
      c={c}
      className="luft-grid-2"
      style={{
        gridTemplateColumns: "1.15fr 1fr",
        border: "1px solid #e6e5e2",
        background: "#ffffff",
        borderRadius: 3,
        overflow: "hidden",
        margin: "32px 0 44px",
        color: "inherit",
      }}
    >
      <CardPhoto c={c} style={{ minHeight: 360 }}>
        <span
          className="mono"
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "#0d0d0d",
            color: "#ffffff",
            padding: "5px 9px",
            borderRadius: 2,
          }}
        >
          Featured
        </span>
        {!c.photos?.length && (
          <span className="mono" style={{ position: "absolute", bottom: 16, left: 16, fontSize: 11, color: "#8a8a85" }}>
            [ {c.caption} ]
          </span>
        )}
      </CardPhoto>
      <div style={{ padding: "38px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a8a85" }}>
              {c.source}
            </span>
            <span className="mono" style={{ fontSize: 12, color: deltaColor(c.delta) }}>
              {deltaText(c.delta)}
            </span>
          </div>
          <h2
            className="display"
            style={{ fontWeight: 500, fontSize: 44, lineHeight: 1.02, letterSpacing: "-0.01em", margin: "16px 0 6px" }}
          >
            {c.year} {c.title}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "#5e5e5a", marginTop: 12, maxWidth: 400 }}>
            {c.blurb ||
              "Aggregated live listing with verified provenance and full photo set on the source platform."}
          </p>
        </div>
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", gap: 26, paddingBottom: 22, borderBottom: "1px solid #f1f0ed" }}>
            <SpecMini label="Mileage" value={miles(c.miles)} />
            <SpecMini label="Gearbox" value={c.trans} />
            <SpecMini label="Location" value={[c.city, c.state].filter(Boolean).join(", ") || "—"} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22 }}>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a8a85", marginBottom: 4 }}>
                Asking
              </div>
              <div className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}>
                {usd(c.price)}
              </div>
            </div>
            <span
              style={{ background: "#0d0d0d", color: "#ffffff", fontSize: 14, fontWeight: 600, padding: "14px 26px", borderRadius: 2 }}
            >
              View listing →
            </span>
          </div>
        </div>
      </div>
    </CardLink>
  );
}

function SpecMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#adaca7", marginBottom: 5 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 14 }}>
        {value}
      </div>
    </div>
  );
}

function ResultCard({
  c,
  saved,
  onSave,
}: {
  c: Listing;
  saved: boolean;
  onSave: () => void;
}) {
  const meta = [miles(c.miles), c.trans, [c.city, c.state].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");
  return (
    <CardLink
      c={c}
      style={{
        border: "1px solid #e6e5e2",
        background: "#ffffff",
        borderRadius: 3,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        color: "inherit",
      }}
    >
      <CardPhoto c={c} style={{ aspectRatio: "4 / 3" }}>
        <span
          className="mono"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: "rgba(251,249,245,.92)",
            color: "#3f3f3d",
            padding: "4px 8px",
            borderRadius: 2,
          }}
        >
          {c.source}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave();
          }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            border: saved ? "1px solid #0d0d0d" : "1px solid #e6e5e2",
            background: saved ? "#0d0d0d" : "rgba(251,249,245,.92)",
            color: saved ? "#ffffff" : "#3f3f3d",
            fontFamily: "var(--font-libre-franklin), sans-serif",
            fontWeight: 500,
            fontSize: 11,
            padding: "5px 10px",
            borderRadius: 2,
            cursor: "pointer",
          }}
        >
          {saved ? "Saved" : "+ Save"}
        </span>
        {!c.photos?.length && (
          <span className="mono" style={{ position: "absolute", bottom: 12, left: 12, fontSize: 10, color: "#a3a29d" }}>
            [ {c.caption} ]
          </span>
        )}
        <span
          className="mono"
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            fontSize: 10,
            background: "rgba(12,12,12,.9)",
            color: "#dcdcd8",
            padding: "4px 7px",
            borderRadius: 2,
          }}
        >
          {deltaText(c.delta)}
        </span>
      </CardPhoto>
      <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 className="display" style={{ fontWeight: 500, fontSize: 25, lineHeight: 1.05, letterSpacing: "-0.005em" }}>
          {c.year} {c.title}
        </h3>
        <div className="mono" style={{ fontSize: 12, color: "#8a8a85", marginTop: 7 }}>
          {meta}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto", paddingTop: 18 }}>
          <span className="mono" style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.01em" }}>
            {usd(c.price)}
          </span>
          <span style={{ fontSize: 12, color: "#0d0d0d", fontWeight: 500 }}>View →</span>
        </div>
      </div>
    </CardLink>
  );
}
