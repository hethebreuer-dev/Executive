// POST /api/subscribe — capture an email for the daily "new listings" digest.
// Forwards to the Worker's guarded /subscribe endpoint (which stores it in D1).
// The subscribe secret stays server-side.

export const runtime = "nodejs";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const SUBSCRIBE_SECRET = process.env.WORKER_SUBSCRIBE_SECRET;

export async function POST(req: Request) {
  if (!WORKER_URL || !SUBSCRIBE_SECRET) {
    return Response.json({ error: "Email signup isn't configured yet." }, { status: 503 });
  }
  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const email = (body.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/$/, "")}/subscribe`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-subscribe-secret": SUBSCRIBE_SECRET },
      body: JSON.stringify({ email }),
    });
    const json = await res.json().catch(() => ({}));
    return Response.json(json, { status: res.status });
  } catch (e) {
    console.error("subscribe failed:", e);
    return Response.json({ error: "Could not reach the signup service." }, { status: 502 });
  }
}
