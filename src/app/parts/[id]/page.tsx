import Link from "next/link";
import { FooterSimple } from "@/components/luft/Footer";
import { getPart } from "@/lib/luft/parts";
import { partModelLabel, type Part } from "@/lib/luft/parts-model";
import { MediaGallery } from "@/components/luft/MediaGallery";

// Re-read per request so a newly-posted part is reachable without a redeploy.
export const revalidate = 0;
export const dynamic = "force-dynamic";

const usd = (n: number) => "$" + n.toLocaleString("en-US");

function prettyDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const part = await getPart(decodeURIComponent(id)).catch(() => null);

  if (!part) {
    return (
      <div style={{ background: "#ffffff" }}>
        <section className="luft-container" style={{ padding: "96px 40px", textAlign: "center" }}>
          <div className="display" style={{ fontSize: 32, textTransform: "uppercase", color: "#0d0d0d" }}>
            This part is no longer listed.
          </div>
          <p style={{ marginTop: 12, fontSize: 15, color: "#5e5e5a" }}>
            It may have sold or been removed.{" "}
            <Link href="/parts" style={{ textDecoration: "underline" }}>
              Back to the parts marketplace
            </Link>
            .
          </p>
        </section>
        <FooterSimple />
      </div>
    );
  }

  return <PartDetail p={part} />;
}

function PartDetail({ p }: { p: Part }) {
  const photos = p.photos ?? [];
  const fitment = p.model === "all" ? "Fits multiple / universal" : partModelLabel(p.model);
  const listed = prettyDate(p.createdAt);

  const mailto = `mailto:${p.sellerEmail}?subject=${encodeURIComponent("LUFT parts — " + p.title)}`;
  const telHref = p.sellerPhone ? `tel:${p.sellerPhone.replace(/[^\d+]/g, "")}` : null;
  const wantsPhone = p.sellerContact === "Phone" || p.sellerContact === "Text";

  const specs: { k: string; v: string }[] = [
    { k: "Fits", v: fitment },
    ...(p.partNumber ? [{ k: "Part number", v: p.partNumber }] : []),
    ...(p.sellerName ? [{ k: "Seller", v: p.sellerName }] : []),
    ...(p.sellerContact ? [{ k: "Preferred contact", v: p.sellerContact }] : []),
    ...(listed ? [{ k: "Listed", v: listed }] : []),
  ];

  return (
    <div style={{ background: "#ffffff" }}>
      {/* SUB-BAR */}
      <div
        className="luft-container"
        style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e6e5e2", gap: 16, flexWrap: "wrap" }}
      >
        <Link href="/parts" style={{ fontSize: 13, color: "#5e5e5a" }}>
          ← All parts
        </Link>
        <span className="lbl" style={{ fontSize: 10 }}>
          Parts / {fitment}
        </span>
      </div>

      {/* GALLERY — capped landscape hero + square thumbnails, with a
          click-to-enlarge lightbox (client component). */}
      <section className="luft-container" style={{ padding: "28px 40px 0" }}>
        <MediaGallery photos={photos} badge={p.model === "all" ? "Fits multiple" : partModelLabel(p.model)} />
      </section>

      {/* BODY */}
      <div className="luft-container luft-grid-2" style={{ padding: "48px 40px 0", gridTemplateColumns: "1fr 372px", gap: 64, alignItems: "start" }}>
        <main>
          <div className="lbl" style={{ color: "#0d0d0d" }}>
            Parts marketplace · Listed on LUFT{listed ? ` · ${listed}` : ""}
          </div>
          <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 46, lineHeight: 1.04, textTransform: "uppercase", margin: "14px 0 10px" }}>
            {p.title}
          </h1>
          <p style={{ fontSize: 16, color: "#5e5e5a", lineHeight: 1.5 }}>
            {[fitment, p.partNumber ? `Part # ${p.partNumber}` : null].filter(Boolean).join(" · ")}
          </p>

          <BlockHead>Description</BlockHead>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3f3f3d", maxWidth: 640, whiteSpace: "pre-wrap" }}>
            {p.description}
          </p>

          <BlockHead>Details</BlockHead>
          <div className="luft-stack-sm" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 56px" }}>
            {specs.map((s) => (
              <div key={s.k} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "13px 0", borderBottom: "1px solid #eeeeec" }}>
                <span className="lbl" style={{ color: "#8a8a85", paddingTop: 2 }}>{s.k}</span>
                <span className="mono" style={{ fontSize: 13, color: "#0d0d0d", textAlign: "right" }}>{s.v}</span>
              </div>
            ))}
          </div>

        </main>

        {/* STICKY PRICE RAIL */}
        <aside className="luft-sticky-aside" style={{ position: "sticky", top: 96, alignSelf: "start", border: "1px solid #e6e5e2" }}>
          <div style={{ padding: "24px 24px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="lbl">{p.price ? "Asking" : "Price"}</span>
              <span className="lbl" style={{ color: "#0d0d0d" }}>● Available</span>
            </div>
            <div className="mono" style={{ fontSize: p.price ? 40 : 28, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 12 }}>
              {p.price ? usd(p.price) : "Make an offer"}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e6e5e2", padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            {[
              ["Fits", fitment],
              ["Part #", p.partNumber || "—"],
              ["Seller", p.sellerName || "Private seller"],
              ["Listed", listed || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="lbl" style={{ marginBottom: 5 }}>{k}</div>
                <div className="mono" style={{ fontSize: 14, wordBreak: "break-word" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e6e5e2", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <a href={mailto} style={{ textAlign: "center", background: "#0d0d0d", color: "#ffffff", fontSize: 14, fontWeight: 600, padding: 15 }}>
              Email seller →
            </a>
            {wantsPhone && telHref && (
              <a href={telHref} style={{ textAlign: "center", border: "1px solid #0d0d0d", color: "#0d0d0d", fontSize: 14, fontWeight: 600, padding: 14 }}>
                {p.sellerContact === "Text" ? "Text seller" : "Call seller"} ↗
              </a>
            )}
            <div className="mono" style={{ fontSize: 11, color: "#8a8a85", textAlign: "center", marginTop: 4 }}>
              You contact the seller directly · LUFT doesn&rsquo;t handle payment
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

function BlockHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid #e6e5e2", marginTop: 40, paddingTop: 32 }}>
      <h2 className="display" style={{ fontWeight: 600, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.01em", marginBottom: 18 }}>
        {children}
      </h2>
    </div>
  );
}
