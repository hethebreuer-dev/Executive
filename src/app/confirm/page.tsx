// /confirm?token=… — the double opt-in landing page. The confirmation email's
// button links here; this forwards the token to the Worker (which flips the
// subscriber from 'pending' to 'active'), then shows a branded confirmation.

import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const SUBSCRIBE_SECRET = process.env.WORKER_SUBSCRIBE_SECRET;

async function confirm(token: string): Promise<"active" | "invalid" | "error"> {
  if (!WORKER_URL || !SUBSCRIBE_SECRET) return "error";
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/$/, "")}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-subscribe-secret": SUBSCRIBE_SECRET },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return "error";
    const j = (await res.json().catch(() => ({}))) as { status?: string };
    return j.status === "active" ? "active" : "invalid";
  } catch {
    return "error";
  }
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await confirm(token) : "invalid";

  const heading =
    result === "active"
      ? "You're subscribed"
      : result === "invalid"
        ? "Link not recognized"
        : "Something went wrong";
  const body =
    result === "active"
      ? "You're confirmed. Every morning you'll get an email with the new air-cooled 911, 912, and 930 listings that just came to market."
      : result === "invalid"
        ? "This confirmation link is invalid or has already been used. Try subscribing again from the site."
        : "We couldn't confirm that just now. Please click the link in your email again in a moment.";

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
        Browse the marketplace →
      </Link>
    </main>
  );
}
