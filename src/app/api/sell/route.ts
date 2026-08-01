// POST /api/sell — receive a seller's listing (metadata + already-uploaded photo
// URLs) and forward it to the ingestion Worker's guarded /submit endpoint, which
// writes it to D1 as a 'pending' listing. The submit secret stays server-side.

export const runtime = "nodejs";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const SUBMIT_SECRET = process.env.WORKER_SUBMIT_SECRET;

type Body = Record<string, unknown>;

export async function POST(req: Request) {
  if (!WORKER_URL || !SUBMIT_SECRET) {
    return Response.json(
      { error: "Listing submission isn't configured yet." },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  // Minimal server-side validation mirroring the Worker's requirements.
  const required = ["title", "year", "modelFamily", "price", "sellerEmail"];
  for (const k of required) {
    if (body[k] == null || body[k] === "") {
      return Response.json({ error: `Missing ${k}` }, { status: 400 });
    }
  }

  try {
    const res = await fetch(`${WORKER_URL.replace(/\/$/, "")}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-submit-secret": SUBMIT_SECRET },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return Response.json(json, { status: res.status });
  } catch (e) {
    console.error("sell submit failed:", e);
    return Response.json(
      { error: "Could not reach the listing service.", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
