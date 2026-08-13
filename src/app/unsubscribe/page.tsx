// /unsubscribe?token=… — landing page for the unsubscribe link in each digest
// email. Server-side, forwards the token to the Worker (which flips the
// subscriber to 'unsubscribed'), then shows a branded confirmation.

import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const SUBSCRIBE_SECRET = process.env.WORKER_SUBSCRIBE_SECRET;

async function unsubscribe(token: string): Promise<"ok" | "notfound" | "error"> {
  if (!WORKER_URL || !SUBSCRIBE_SECRET) return "error";
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/$/, "")}/unsubscribe`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-subscribe-secret": SUBSCRIBE_SECRET },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return "error";
    const j = (await res.json().catch(() => ({}))) as { changed?: number };
    return j.changed ? "ok" : "notfound";
  } catch {
    return "error";
  }
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await unsubscribe(token) : "notfound";

  const heading =
    result === "ok"
      ? "You're unsubscribed"
      : result === "notfound"
        ? "Link not recognized"
        : "Something went wrong";
  const body =
    result === "ok"
      ? "You won't receive the daily LUFT listings email anymore. Changed your mind? You can re-subscribe from the site anytime."
      : result === "notfound"
        ? "This unsubscribe link is invalid or has already been used."
        : "We couldn't process that just now. Please try the link again in a moment.";

  return (
    <main
      className="luft-container"
      style={{ padding: "120px 40px", maxWidth: 640, textAlign: "center" }}
    >
      <div className="lbl" style={{ color: "#8a8a85", marginBottom: 16 }}>
        Email preferences
      </div>
      <h1
        className="display"
        style={{ fontWeight: 600, fontSize: 40, textTransform: "uppercase", lineHeight: 1.05 }}
      >
        {heading}
      </h1>
      <p style={{ fontSize: 16, color: "#5e5e5a", lineHeight: 1.6, marginTop: 16 }}>{body}</p>
      <Link
        href="/marketplace"
        style={{
          display: "inline-block",
          marginTop: 28,
          background: "#0d0d0d",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 600,
          padding: "13px 24px",
        }}
      >
        Back to the marketplace →
      </Link>
    </main>
  );
}
