import Link from "next/link";
import { FooterSimple } from "@/components/luft/Footer";
import { SaveButton } from "@/components/luft/SaveButton";
import { repository } from "@/lib/luft/factory";
import { usd, miles } from "@/lib/luft";
import type { CanonicalListing } from "@/lib/luft/model";

const SPECS: { k: string; v: string }[] = [
  { k: "Model", v: "Carrera RS 2.7 (M472)" },
  { k: "Body", v: "Touring Coupe" },
  { k: "Engine", v: "2.7L air-cooled flat-6" },
  { k: "Induction", v: "Bosch MFI" },
  { k: "Output", v: "210 hp @ 6300 rpm" },
  { k: "Gearbox", v: "915 5-speed manual" },
  { k: "Drivetrain", v: "Rear-wheel drive" },
  { k: "Mileage", v: "42,100 mi (indicated)" },
  { k: "Exterior", v: "Grand Prix White" },
  { k: "Interior", v: "Black leatherette" },
  { k: "Wheels", v: '15" Fuchs, restored' },
  { k: "Production", v: "1 of 1,580 built" },
];

const INCLUSIONS = [
  "Porsche Certificate of Authenticity",
  "Original ducktail engine lid, undamaged",
  "Documented 2021 Emory mechanical refresh",
  "Books, tool roll, and jack",
  "Full photographic restoration record",
  "Clean, transferable title",
];

const COMPS = [
  { name: "1973 RS 2.7 Touring · GP White", price: "$868,000", vs: "−0.8%", date: "Jan 2026", source: "Bring a Trailer" },
  { name: "1973 RS 2.7 Touring · Silver", price: "$842,000", vs: "−3.8%", date: "May 2026", source: "Gooding & Co" },
  { name: "1973 RS 2.7 Touring · Blue", price: "$810,000", vs: "−7.4%", date: "Dec 2025", source: "Bonhams" },
  { name: "1973 RS 2.7 Touring · Yellow", price: "$795,000", vs: "−9.1%", date: "Feb 2026", source: "Broad Arrow" },
  { name: "1973 RS 2.7 Lightweight · White", price: "$1,050,000", vs: "+20% (LW)", date: "Mar 2026", source: "RM Sotheby’s" },
];

const GUIDES = [
  { tag: "Engine · MFI", title: "Cold-start MFI tuning", desc: "Dial in the mechanical injection cold-enrichment for a clean start on a 2.7.", meta: "Intermediate · 45 min" },
  { tag: "Engine · Valvetrain", title: "Valve clearance (2.7)", desc: "Set intake and exhaust lash cold to spec on the early flat-six.", meta: "Intermediate · 2 hr" },
  { tag: "Engine · Timing", title: "Chain tensioner refresh", desc: "Inspect and upgrade the early idler/tensioner setup before failure.", meta: "Advanced · 3 hr" },
];

const SIMILAR = [
  { title: "1972 911 T", meta: "65,000 mi · 915 · Los Angeles, CA", price: "$118,000", source: "Broad Arrow", caption: "911 T — oil-flap", id: 10 },
  { title: "1997 993 Carrera S", meta: "28,500 mi · 6-spd · Denver, CO", price: "$189,000", source: "RM Sotheby’s", caption: "993 C2S — profile", id: 2 },
  { title: "1991 964 Turbo 3.3", meta: "41,600 mi · 5-spd · New York, NY", price: "$265,000", source: "Gooding & Co", caption: "964 Turbo — rear", id: 7 },
];

const BADGES = ["MATCHING NUMBERS", "DUCKTAIL INTACT", "COA INCLUDED", "3 OWNERS"];

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await repository.getListing(decodeURIComponent(id)).catch(() => null);
  if (listing) return <RealListing c={listing} />;
  // Fallback: the static featured showcase (mock/legacy/unknown ids).
  return <FeaturedShowcase />;
}

function FeaturedShowcase() {
  return (
    <div style={{ background: "#ffffff" }}>
      {/* SUB-BAR */}
      <div
        className="luft-container"
        style={{
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e6e5e2",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link href="/marketplace" style={{ fontSize: 13, color: "#5e5e5a" }}>
          ← All air-cooled listings
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="lbl" style={{ fontSize: 10 }}>
            Marketplace / 911 / 1973 Carrera RS 2.7 / Lot 0473
          </span>
          <SaveButton />
        </div>
      </div>

      {/* GALLERY */}
      <section className="luft-container" style={{ padding: "28px 40px 0" }}>
        <div className="luft-grid-2" style={{ gridTemplateColumns: "2.2fr 1fr", gap: 10, height: 520 }}>
          <div className="luft-hatch" style={{ position: "relative", border: "1px solid #e6e5e2" }}>
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
              }}
            >
              Featured Lot
            </span>
            <GalleryCaption>Front 3/4 hero — Grand Prix White RS 2.7</GalleryCaption>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="luft-hatch" style={{ position: "relative", flex: 1, border: "1px solid #e6e5e2" }}>
              <GalleryCaption>Ducktail / rear</GalleryCaption>
            </div>
            <div className="luft-hatch" style={{ position: "relative", flex: 1, border: "1px solid #e6e5e2" }}>
              <GalleryCaption>Interior / gauges</GalleryCaption>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 10 }}>
          {["engine", "wheels", "script", "detail"].map((t) => (
            <div key={t} className="luft-hatch" style={{ position: "relative", height: 104, border: "1px solid #e6e5e2" }}>
              <GalleryCaption small>{t}</GalleryCaption>
            </div>
          ))}
          <div
            style={{
              position: "relative",
              height: 104,
              border: "1px solid #e6e5e2",
              background: "#0d0d0d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: "#ffffff" }}>
              + 38 photos
            </span>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div
        className="luft-container luft-grid-2"
        style={{ padding: "48px 40px 0", gridTemplateColumns: "1fr 372px", gap: 64, alignItems: "start" }}
      >
        <main>
          <div className="lbl" style={{ color: "#0d0d0d" }}>
            Lot 0473 · Live · Auction ends in 4d 6h
          </div>
          <h1
            className="display luft-h1"
            style={{
              fontWeight: 600,
              fontSize: 52,
              lineHeight: 1.02,
              textTransform: "uppercase",
              margin: "14px 0 10px",
            }}
          >
            1973 911 Carrera RS 2.7
          </h1>
          <p style={{ fontSize: 17, color: "#5e5e5a", lineHeight: 1.5 }}>
            Matching-numbers M472 Touring · Grand Prix White over black ·
            Documented Emory mechanical refresh
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
            {BADGES.map((b) => (
              <span
                key={b}
                className="mono"
                style={{ fontSize: 11, border: "1px solid #e6e5e2", padding: "7px 12px" }}
              >
                {b}
              </span>
            ))}
          </div>

          <BlockHead>Provenance</BlockHead>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3f3f3d", maxWidth: 640 }}>
            One of 1,580 Carrera RS 2.7s built for homologation, this Touring-spec
            (M472) example retains its numbers-matching 2.7-litre MFI flat-six and
            original 915 gearbox. Finished in Grand Prix White with the signature
            red Carrera script and Fuchs, it presents with its factory-correct
            ducktail engine lid intact.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3f3f3d", maxWidth: 640, marginTop: 16 }}>
            Sold new through Porsche AG in Stuttgart, the car passed through two
            long-term European collections before a sympathetic mechanical refresh
            by Emory Motorsports in 2021 — documented with a full photographic
            record and receipts. Accompanied by its Porsche Certificate of
            Authenticity, tool kit, and books.
          </p>

          <BlockHead>Specification</BlockHead>
          <div className="luft-stack-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 56px" }}>
            {SPECS.map((s) => (
              <div
                key={s.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "13px 0",
                  borderBottom: "1px solid #eeeeec",
                }}
              >
                <span className="lbl" style={{ color: "#8a8a85", paddingTop: 2 }}>
                  {s.k}
                </span>
                <span className="mono" style={{ fontSize: 13, color: "#0d0d0d", textAlign: "right" }}>
                  {s.v}
                </span>
              </div>
            ))}
          </div>

          <BlockHead>Condition &amp; inclusions</BlockHead>
          <div className="luft-stack-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 56px", maxWidth: 720 }}>
            {INCLUSIONS.map((i) => (
              <div key={i} style={{ display: "flex", gap: 12, fontSize: 15, color: "#3f3f3d", lineHeight: 1.4 }}>
                <span className="mono" style={{ color: "#8a8a85" }}>
                  —
                </span>
                <span>{i}</span>
              </div>
            ))}
          </div>
        </main>

        {/* STICKY PRICE RAIL */}
        <aside className="luft-sticky-aside" style={{ position: "sticky", top: 96, alignSelf: "start", border: "1px solid #e6e5e2" }}>
          <div style={{ padding: "24px 24px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="lbl">Asking · via Broad Arrow</span>
              <span className="lbl" style={{ color: "#0d0d0d" }}>
                ● Live
              </span>
            </div>
            <div className="mono" style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 12 }}>
              $875,000
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, border: "1px solid #e6e5e2", padding: "7px 12px" }}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
                +6%
              </span>
              <span style={{ fontSize: 12, color: "#5e5e5a" }}>vs 90-day comp median</span>
            </div>
            <div style={{ fontSize: 12, color: "#8a8a85", marginTop: 10 }}>
              Median $825,000 across 5 verified sold comps
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e6e5e2", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            {[
              ["Year", "1973"],
              ["Mileage", "42,100 mi"],
              ["Gearbox", "915 5-spd"],
              ["Location", "Emory, CA"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="lbl" style={{ marginBottom: 5 }}>
                  {k}
                </div>
                <div className="mono" style={{ fontSize: 14 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e6e5e2", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href="#"
              style={{ textAlign: "center", background: "#0d0d0d", color: "#ffffff", fontSize: 14, fontWeight: 600, padding: 15, letterSpacing: "0.01em" }}
            >
              View on Broad Arrow ↗
            </a>
            <a
              href="#"
              style={{ textAlign: "center", border: "1px solid #0d0d0d", color: "#0d0d0d", fontSize: 14, fontWeight: 600, padding: 14 }}
            >
              Download comps report
            </a>
            <div className="mono" style={{ fontSize: 11, color: "#8a8a85", textAlign: "center", marginTop: 4 }}>
              Aggregated · updated 2 hrs ago
            </div>
          </div>
        </aside>
      </div>

      {/* MARKET COMPS */}
      <section className="luft-container" style={{ padding: "72px 40px 8px" }}>
        <div
          style={{
            borderTop: "1px solid #0d0d0d",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div className="lbl" style={{ color: "#0d0d0d" }}>
              Market Analytics
            </div>
            <h2 className="display" style={{ fontWeight: 600, fontSize: 38, textTransform: "uppercase", marginTop: 8 }}>
              How this price compares
            </h2>
          </div>
          <p style={{ fontSize: 14, color: "#5e5e5a", maxWidth: 400, lineHeight: 1.55 }}>
            Benchmarked against verified sold Carrera RS 2.7 Touring examples over
            the trailing 90 days, drawn from every auction and dealer source we
            track.
          </p>
        </div>

        {/* comp band */}
        <div style={{ border: "1px solid #e6e5e2", marginTop: 32, padding: "38px 44px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 34 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>
                90-day low
              </div>
              <div className="mono" style={{ fontSize: 18 }}>
                $780,000
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Median
              </div>
              <div className="mono" style={{ fontSize: 18 }}>
                $825,000
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lbl" style={{ marginBottom: 6 }}>
                90-day high
              </div>
              <div className="mono" style={{ fontSize: 18 }}>
                $915,000
              </div>
            </div>
          </div>
          <div style={{ position: "relative", height: 8, background: "#f0efec", margin: "0 0 6px" }}>
            <div style={{ position: "absolute", left: "33%", top: -6, bottom: -6, width: 1, background: "#adaca7" }} />
            <div style={{ position: "absolute", left: "20%", right: "18%", top: 0, bottom: 0, background: "#dcdcd8" }} />
            <div style={{ position: "absolute", left: "70%", top: -16, bottom: -16, width: 2, background: "#0d0d0d" }} />
          </div>
          <div style={{ position: "relative", height: 44 }}>
            <div style={{ position: "absolute", left: "33%", transform: "translateX(-50%)", textAlign: "center", top: 6 }}>
              <span className="lbl">Median</span>
            </div>
            <div style={{ position: "absolute", left: "70%", transform: "translateX(-50%)", textAlign: "center", top: 2 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
                This car · $875k
              </div>
              <span className="lbl">+6% vs median</span>
            </div>
          </div>
        </div>

        {/* comps table */}
        <div style={{ marginTop: 40 }}>
          <div className="luft-scroll">
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr 1fr", padding: "0 0 12px", borderBottom: "1px solid #0d0d0d" }}>
                <span className="lbl">Comparable</span>
                <span className="lbl">Sold price</span>
                <span className="lbl">Vs this</span>
                <span className="lbl">Date</span>
                <span className="lbl" style={{ textAlign: "right" }}>
                  Source
                </span>
              </div>
              {COMPS.map((c) => (
                <div
                  key={c.name}
                  style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.9fr 0.9fr 1fr", padding: "17px 0", borderBottom: "1px solid #eeeeec", alignItems: "center" }}
                >
                  <span style={{ fontSize: 15 }}>{c.name}</span>
                  <span className="mono" style={{ fontSize: 14 }}>
                    {c.price}
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: "#5e5e5a" }}>
                    {c.vs}
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: "#5e5e5a" }}>
                    {c.date}
                  </span>
                  <span style={{ fontSize: 13, textAlign: "right", color: "#5e5e5a" }}>
                    {c.source}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GARAGE CROSS-SELL */}
      <section style={{ background: "#0d0d0d", color: "#ffffff", marginTop: 80 }}>
        <div className="luft-container" style={{ padding: "64px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div className="lbl" style={{ color: "#cfcfca" }}>
                Workshop · AI Service
              </div>
              <h2 className="display" style={{ fontWeight: 600, fontSize: 36, textTransform: "uppercase", marginTop: 10 }}>
                Own this 2.7? Service guides for the 901 platform
              </h2>
            </div>
            <Link href="/workshop" style={{ color: "#ffffff", borderBottom: "1px solid #ffffff", fontSize: 14, fontWeight: 500, paddingBottom: 3 }}>
              Open Workshop ↗
            </Link>
          </div>
          <div className="luft-grid-3" style={{ gap: 16, marginTop: 36 }}>
            {GUIDES.map((g) => (
              <div key={g.title} style={{ border: "1px solid #262626", background: "#151515", padding: "22px 22px 24px" }}>
                <div className="lbl" style={{ color: "#8a8a85" }}>
                  {g.tag}
                </div>
                <h3 className="display" style={{ fontWeight: 500, fontSize: 22, textTransform: "uppercase", margin: "12px 0 8px" }}>
                  {g.title}
                </h3>
                <p style={{ fontSize: 14, color: "#b0afaa", lineHeight: 1.5 }}>{g.desc}</p>
                <div className="lbl" style={{ color: "#cfcfca", marginTop: 16 }}>
                  {g.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMILAR */}
      <section className="luft-container" style={{ padding: "72px 40px 0" }}>
        <div style={{ borderTop: "1px solid #0d0d0d", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="display" style={{ fontWeight: 600, fontSize: 30, textTransform: "uppercase" }}>
            More air-cooled listings
          </h2>
          <Link href="/marketplace" style={{ fontSize: 14, color: "#5e5e5a" }}>
            View all →
          </Link>
        </div>
        <div className="luft-grid-3" style={{ gap: 30, marginTop: 32 }}>
          {SIMILAR.map((c) => (
            <Link key={c.title} href={`/listing/${c.id}`} style={{ border: "1px solid #e6e5e2", display: "flex", flexDirection: "column" }}>
              <div className="luft-hatch" style={{ position: "relative", aspectRatio: "4 / 3" }}>
                <span
                  className="mono"
                  style={{ position: "absolute", top: 12, left: 12, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(250,250,250,.92)", color: "#3f3f3d", padding: "4px 8px" }}
                >
                  {c.source}
                </span>
                <span className="mono" style={{ position: "absolute", bottom: 12, left: 12, fontSize: 10, color: "#a3a29d" }}>
                  [ {c.caption} ]
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <h3 className="display" style={{ fontWeight: 500, fontSize: 22, textTransform: "uppercase", lineHeight: 1.04 }}>
                  {c.title}
                </h3>
                <div className="mono" style={{ fontSize: 12, color: "#8a8a85", marginTop: 7 }}>
                  {c.meta}
                </div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 14 }}>
                  {c.price}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FooterSimple />
    </div>
  );
}

function GalleryCaption({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#a3a29d",
        textAlign: "center",
        padding: 12,
      }}
    >
      <span className="mono" style={{ fontSize: small ? 10 : 12 }}>
        {children}
      </span>
    </div>
  );
}

function BlockHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid #e6e5e2", marginTop: 40, paddingTop: 32 }}>
      <h2
        className="display"
        style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.01em", marginBottom: 18 }}
      >
        {children}
      </h2>
    </div>
  );
}

// Real data-driven detail page — used for repository-backed listings (seller
// submissions and any internally-hosted car). Scraped cars link out to source.
function RealListing({ c }: { c: CanonicalListing }) {
  const photos = c.photos ?? [];
  const hero = photos[0];
  const rest = photos.slice(1, 5);
  const location = [c.city, c.state].filter(Boolean).join(", ");
  const specs: { k: string; v: string }[] = [
    { k: "Model", v: `${c.modelFamily} ${c.trim}`.trim() },
    { k: "Body", v: c.body },
    { k: "Transmission", v: c.transmission },
    { k: "Year", v: String(c.year) },
    ...(c.mileage ? [{ k: "Mileage", v: miles(c.mileage) }] : []),
    ...(c.exteriorColor ? [{ k: "Exterior", v: c.exteriorColor }] : []),
    ...(c.interiorColor ? [{ k: "Interior", v: c.interiorColor }] : []),
    ...(c.vin ? [{ k: "VIN", v: c.vin }] : []),
    ...(c.matchingNumbers != null ? [{ k: "Matching numbers", v: c.matchingNumbers ? "Yes" : "No" }] : []),
    ...(location ? [{ k: "Location", v: location }] : []),
  ];

  return (
    <div style={{ background: "#ffffff" }}>
      {/* SUB-BAR */}
      <div className="luft-container" style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e6e5e2", gap: 16, flexWrap: "wrap" }}>
        <Link href="/marketplace" style={{ fontSize: 13, color: "#5e5e5a" }}>
          ← All air-cooled listings
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="lbl" style={{ fontSize: 10 }}>
            Marketplace / {c.modelFamily} / {c.year} {c.trim}
          </span>
          <SaveButton />
        </div>
      </div>

      {/* GALLERY */}
      <section className="luft-container" style={{ padding: "28px 40px 0" }}>
        <div className="luft-grid-2" style={{ gridTemplateColumns: "2.2fr 1fr", gap: 10, height: 520 }}>
          <div className={hero ? "" : "luft-hatch"} style={{ position: "relative", border: "1px solid #e6e5e2", background: hero ? "#0d0d0d" : undefined, overflow: "hidden" }}>
            {hero && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero} alt={`${c.year} ${c.title}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <span className="mono" style={{ position: "absolute", top: 16, left: 16, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", background: "#0d0d0d", color: "#ffffff", padding: "5px 9px" }}>
              {c.sellerType === "dealer" ? "Dealer" : "Private seller"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1].map((i) => (
              <div key={i} className={rest[i] ? "" : "luft-hatch"} style={{ position: "relative", flex: 1, border: "1px solid #e6e5e2", background: rest[i] ? "#0d0d0d" : undefined, overflow: "hidden" }}>
                {rest[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rest[i]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="luft-container luft-grid-2" style={{ padding: "48px 40px 0", gridTemplateColumns: "1fr 372px", gap: 64, alignItems: "start" }}>
        <main>
          <div className="lbl" style={{ color: "#0d0d0d" }}>
            {c.source} · Listed on LUFT
          </div>
          <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 52, lineHeight: 1.02, textTransform: "uppercase", margin: "14px 0 10px" }}>
            {c.year} {c.title}
          </h1>
          <p style={{ fontSize: 17, color: "#5e5e5a", lineHeight: 1.5 }}>
            {[c.trim, c.body, c.transmission, c.exteriorColor].filter(Boolean).join(" · ")}
          </p>

          {c.blurb && (
            <>
              <BlockHead>Notes from the seller</BlockHead>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3f3f3d", maxWidth: 640, whiteSpace: "pre-wrap" }}>{c.blurb}</p>
            </>
          )}
          {c.caption && (
            <>
              <BlockHead>Known issues &amp; needs</BlockHead>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3f3f3d", maxWidth: 640, whiteSpace: "pre-wrap" }}>{c.caption}</p>
            </>
          )}

          <BlockHead>Specification</BlockHead>
          <div className="luft-stack-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 56px" }}>
            {specs.map((s) => (
              <div key={s.k} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "13px 0", borderBottom: "1px solid #eeeeec" }}>
                <span className="lbl" style={{ color: "#8a8a85", paddingTop: 2 }}>{s.k}</span>
                <span className="mono" style={{ fontSize: 13, color: "#0d0d0d", textAlign: "right" }}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* EXTRA PHOTOS */}
          {photos.length > 1 && (
            <>
              <BlockHead>Photos</BlockHead>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "4 / 3", background: "#0d0d0d", border: "1px solid #e6e5e2", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        {/* STICKY PRICE RAIL */}
        <aside className="luft-sticky-aside" style={{ position: "sticky", top: 96, alignSelf: "start", border: "1px solid #e6e5e2" }}>
          <div style={{ padding: "24px 24px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="lbl">Asking</span>
              <span className="lbl" style={{ color: "#0d0d0d" }}>● Live</span>
            </div>
            <div className="mono" style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 12 }}>
              {usd(c.price)}
            </div>
            {c.compDeltaPct != null && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, border: "1px solid #e6e5e2", padding: "7px 12px" }}>
                <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
                  {c.compDeltaPct > 0 ? "+" : ""}{c.compDeltaPct}%
                </span>
                <span style={{ fontSize: 12, color: "#5e5e5a" }}>vs generation median</span>
              </div>
            )}
          </div>
          <div style={{ borderTop: "1px solid #e6e5e2", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            {[
              ["Year", String(c.year)],
              ["Mileage", c.mileage ? miles(c.mileage) : "—"],
              ["Gearbox", c.transmission],
              ["Location", location || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="lbl" style={{ marginBottom: 5 }}>{k}</div>
                <div className="mono" style={{ fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e6e5e2", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ textAlign: "center", background: "#0d0d0d", color: "#ffffff", fontSize: 14, fontWeight: 600, padding: 15 }}>
              Contact {c.sellerType === "dealer" ? "dealer" : "seller"}
            </span>
            <div className="mono" style={{ fontSize: 11, color: "#8a8a85", textAlign: "center" }}>
              Messaging routes through LUFT · coming soon
            </div>
          </div>
        </aside>
      </div>

      <div style={{ marginTop: 80 }}>
        <FooterSimple />
      </div>
    </div>
  );
}
