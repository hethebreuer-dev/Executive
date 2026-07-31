import { FooterSimple } from "@/components/luft/Footer";
import { AdminClient } from "./AdminClient";

// Owner-only moderation queue. Access with ?key=<ADMIN_KEY>. The key authorizes
// the API routes, which hold the Worker admin secret server-side.
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  return (
    <div style={{ background: "#ffffff", minHeight: "70vh" }}>
      <section className="luft-container" style={{ padding: "52px 40px 0" }}>
        <div className="lbl" style={{ color: "#0d0d0d" }}>
          Admin · Moderation
        </div>
        <h1 className="display luft-h1" style={{ fontWeight: 600, fontSize: 48, lineHeight: 0.98, textTransform: "uppercase", margin: "12px 0 6px" }}>
          Pending listings
        </h1>
        <p style={{ fontSize: 15, color: "#5e5e5a", maxWidth: 560 }}>
          Seller submissions awaiting review. Approve to publish to the marketplace, or reject to withdraw.
        </p>
      </section>
      <section className="luft-container" style={{ padding: "32px 40px 80px" }}>
        <AdminClient adminKey={key ?? ""} />
      </section>
      <FooterSimple />
    </div>
  );
}
