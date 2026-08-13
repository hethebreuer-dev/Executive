import Link from "next/link";
import { repository } from "@/lib/luft/factory";
import { toLegacyListing, usd, usdk, GENERATIONS, type Listing } from "@/lib/luft";
import { marketSummary, withMarketDelta } from "@/lib/luft/market";
import { FooterGrid } from "@/components/luft/Footer";
import {
  CtaPrimary,
  CtaSecondary,
  ImageSlot,
  ListingCard,
  LiveRow,
  SectionHead,
} from "@/components/luft/pieces";

// Re-read per request so newly-ingested listings show without a redeploy.
export const revalidate = 0;

const VALUE_PROPS = [
  {
    n: "01",
    title: "Aggregated, not siloed",
    body: "Auction houses, dealers, and private sellers across 40+ US sources — every air-cooled 911 in one continuously-updated feed.",
  },
  {
    n: "02",
    title: "Priced against the market",
    body: "Every car is benchmarked against the live market for its exact generation — median, low, and high across every comparable for sale — so you bid on data, not hype.",
  },
  {
    n: "03",
    title: "Built for owners",
    body: "The relationship doesn’t end at the sale. Keep your car right with chassis-specific service guides and AI diagnostics.",
  },
];

export default async function HomePage() {
  const { items, total } = await repository.listListings({ limit: 500 });
  const legacy: Listing[] = withMarketDelta(items.map(toLegacyListing));
  // Prefer cars with photos for the featured strip; fall back to the first few.
  const withPhotos = legacy.filter((l) => l.photos.length > 0);
  const featured = (withPhotos.length >= 3 ? withPhotos : legacy).slice(0, 3);

  const summary = marketSummary(legacy);
  const all = summary.find((s) => s.key === "all")!;
  // Generations with live inventory, priciest median first — for the band.
  const gens = summary
    .filter((s) => s.key !== "all" && s.count > 0)
    .sort((a, b) => b.median - a.median);
  const maxGenMedian = Math.max(1, ...gens.map((g) => g.median));

  const count = total;
  const stats = [
    { label: "Live listings", value: count ? count.toLocaleString("en-US") : "—" },
    { label: "Median · all air-cooled", value: all.median ? usdk(all.median) : "—" },
    { label: "Sources tracked", value: "40+" },
    {
      label: "Asking range",
      value: all.count ? `${usdk(all.min)}–${usdk(all.max)}` : "—",
    },
  ];

  return (
    <div style={{ background: "#ffffff" }}>
      {/* HERO */}
      <section className="luft-container" style={{ padding: "64px 40px 0" }}>
        <div
          className="luft-grid-2"
          style={{ gridTemplateColumns: "1.08fr 1fr", gap: 56, alignItems: "end" }}
        >
          <div>
            <LiveRow marginBottom={22}>
              Live · {count.toLocaleString("en-US")} air-cooled listings right now
            </LiveRow>
            <h1
              className="display luft-h1"
              style={{
                fontWeight: 600,
                fontSize: 82,
                lineHeight: 0.92,
                textTransform: "uppercase",
              }}
            >
              Buy. Sell.
              <br />
              Breathe&nbsp;air-cooled.
            </h1>
            <p
              style={{
                marginTop: 24,
                fontSize: 17,
                lineHeight: 1.55,
                color: "#5e5e5a",
                maxWidth: 520,
              }}
            >
              Every air-cooled 911, 912, and 930 for sale in America — one market.
              Buy against real sold comps, sell to enthusiasts who know the
              difference, and keep it breathing long after the keys change hands.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 34, flexWrap: "wrap" }}>
              <CtaPrimary href="/marketplace" large>
                Browse the market →
              </CtaPrimary>
              <CtaSecondary href="/market-data" large>
                Explore market data
              </CtaSecondary>
            </div>
          </div>
          <ImageSlot
            src="/luft/hero-road.jpg"
            alt="Air-cooled 911s at speed"
            tag="Get on the road"
            height={520}
          />
        </div>

        <div
          className="luft-grid-4"
          style={{ border: "1px solid #e6e5e2", marginTop: 48 }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: "26px 28px",
                borderRight: i < stats.length - 1 ? "1px solid #e6e5e2" : "none",
              }}
            >
              <div className="lbl">{s.label}</div>
              <div className="mono" style={{ fontSize: 30, fontWeight: 500, marginTop: 10 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="luft-container" style={{ padding: "88px 40px 0" }}>
        <SectionHead
          title="Live on the market"
          action={
            <Link href="/marketplace" style={{ fontSize: 14, color: "#5e5e5a" }}>
              View all {count.toLocaleString("en-US")} →
            </Link>
          }
        />
        <div className="luft-grid-3" style={{ gap: 30, marginTop: 32 }}>
          {featured.map((c) => (
            <ListingCard key={c.id} c={c} href={`/listing/${c.id}`} />
          ))}
        </div>
      </section>

      {/* MARKET DATA BAND */}
      <section className="luft-container" style={{ padding: "88px 40px 0" }}>
        <div className="luft-grid-2" style={{ gap: 56, alignItems: "center" }}>
          <div>
            <div className="lbl" style={{ color: "#0d0d0d" }}>
              Market Data
            </div>
            <h2
              className="display"
              style={{
                fontWeight: 600,
                fontSize: 46,
                lineHeight: 1,
                textTransform: "uppercase",
                margin: "12px 0 16px",
              }}
            >
              Priced against the live market
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5e5e5a", maxWidth: 440 }}>
              Every listing is benchmarked to the live market for its generation —
              the median asking price across every comparable air-cooled car for
              sale right now — so you know where a number sits before you bid.
            </p>
            <Link
              href="/market-data"
              style={{
                display: "inline-block",
                marginTop: 26,
                border: "1px solid #0d0d0d",
                fontSize: 15,
                fontWeight: 600,
                padding: "15px 28px",
              }}
            >
              See the full market data →
            </Link>
          </div>
          <div style={{ border: "1px solid #e6e5e2", padding: "28px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="lbl">Median asking · by generation</span>
              <span className="mono" style={{ fontSize: 13, color: "#8a8a85" }}>
                {all.count.toLocaleString("en-US")} live
              </span>
            </div>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 15 }}>
              {gens.map((g) => (
                <div key={g.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{g.label}</span>
                    <span className="mono" style={{ fontSize: 13 }}>{usd(g.median)}</span>
                  </div>
                  <div style={{ height: 8, background: "#f0efec" }}>
                    <div style={{ height: 8, width: `${(g.median / maxGenMedian) * 100}%`, background: "#0d0d0d" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GENERATIONS */}
      <section className="luft-container" style={{ padding: "88px 40px 0" }}>
        <div style={{ borderTop: "1px solid #0d0d0d", paddingTop: 24 }}>
          <h2
            className="display"
            style={{ fontWeight: 600, fontSize: 34, textTransform: "uppercase" }}
          >
            Browse by generation
          </h2>
        </div>
        <div className="luft-grid-5" style={{ gap: 16, marginTop: 32 }}>
          {GENERATIONS.map((g) => (
            <Link
              key={g.label}
              href={`/marketplace?model=${g.key}`}
              style={{ border: "1px solid #e6e5e2", display: "flex", flexDirection: "column" }}
            >
              <div style={{ aspectRatio: "1 / 1", position: "relative", overflow: "hidden", background: "#e5e4e0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.img}
                  alt={`Air-cooled Porsche ${g.label}`}
                  loading="lazy"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: 16 }}>
                <h3
                  className="display"
                  style={{ fontWeight: 500, fontSize: 22, textTransform: "uppercase" }}
                >
                  {g.label}
                </h3>
                <div className="mono" style={{ fontSize: 11, color: "#8a8a85", marginTop: 5 }}>
                  {g.years}
                </div>
                <div className="mono" style={{ fontSize: 14, marginTop: 10 }}>
                  {g.from}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WORKSHOP BAND */}
      <section style={{ background: "#0d0d0d", color: "#ffffff", marginTop: 96 }}>
        <div
          className="luft-container luft-grid-2"
          style={{ padding: "80px 40px", gap: 56, alignItems: "center" }}
        >
          <div>
            <div className="lbl" style={{ color: "#cfcfca" }}>
              The Workshop · AI Service &amp; Restoration
            </div>
            <h2
              className="display"
              style={{
                fontWeight: 600,
                fontSize: 52,
                lineHeight: 0.98,
                textTransform: "uppercase",
                margin: "14px 0 16px",
              }}
            >
              Own it.
              <br />
              Understand it. Fix it.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#b0afaa", maxWidth: 440 }}>
              Guided, torque-spec-accurate service walkthroughs tuned to your exact
              chassis — plus an AI that diagnoses symptoms from a stubborn CIS cold
              start to a full 964 top-end refresh.
            </p>
            <div style={{ display: "flex", gap: 24, marginTop: 26, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/workshop"
                style={{
                  background: "#ffffff",
                  color: "#0d0d0d",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "15px 28px",
                }}
              >
                Open the Workshop →
              </Link>
              <span className="mono" style={{ fontSize: 12, color: "#cfcfca" }}>
                Free to browse · Pro $19/mo
              </span>
            </div>
          </div>
          <div style={{ position: "relative", width: "100%", height: 400, border: "1px solid #262626", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/luft/restoration.jpg"
              alt="Bare 911 bodyshell on a restoration cart"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <span
              className="mono"
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                background: "#ffffff",
                color: "#0d0d0d",
                padding: "5px 9px",
              }}
            >
              Restoration
            </span>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="luft-container" style={{ padding: "80px 40px 0" }}>
        <div
          className="luft-grid-3"
          style={{ gap: 1, background: "#e6e5e2", border: "1px solid #e6e5e2" }}
        >
          {VALUE_PROPS.map((v) => (
            <div key={v.n} style={{ background: "#ffffff", padding: "36px 32px" }}>
              <div className="mono" style={{ fontSize: 13, color: "#8a8a85" }}>
                {v.n}
              </div>
              <h3
                className="display"
                style={{
                  fontWeight: 500,
                  fontSize: 24,
                  textTransform: "uppercase",
                  margin: "16px 0 10px",
                }}
              >
                {v.title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5e5e5a" }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="luft-container" style={{ padding: "88px 40px 0" }}>
        <div
          style={{
            border: "1px solid #0d0d0d",
            padding: "56px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              className="display"
              style={{ fontWeight: 600, fontSize: 40, lineHeight: 1, textTransform: "uppercase" }}
            >
              Selling an air-cooled 911?
            </h2>
            <p style={{ fontSize: 16, color: "#5e5e5a", marginTop: 12, maxWidth: 460 }}>
              List once and reach every serious air-cooled buyer in the country —
              with a fair-market price band built in.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <CtaPrimary href="/sell" large>
              List your car
            </CtaPrimary>
            <CtaSecondary href="/market-data" large>
              Get a valuation
            </CtaSecondary>
          </div>
        </div>
      </section>

      <FooterGrid />
    </div>
  );
}
