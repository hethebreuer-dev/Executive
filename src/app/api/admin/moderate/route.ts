// POST /api/admin/moderate — approve/reject a pending seller listing. Guarded by
// the admin key (also the /admin page key); forwards to the Worker with the
// server-held admin secret. Body: { key, id, action: "approve" | "reject" }.

export const runtime = "nodejs";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const ADMIN_SECRET = process.env.WORKER_ADMIN_SECRET; // server → Worker, never sent to client
const ADMIN_KEY = process.env.ADMIN_KEY; // the /admin page key the owner presents

export async function POST(req: Request) {
  if (!WORKER_URL || !ADMIN_SECRET || !ADMIN_KEY) {
    return Response.json({ error: "Admin isn't configured." }, { status: 503 });
  }
  let body: { key?: string; id?: string; action?: string };
  try {
    body = (await req.json()) as { key?: string; id?: string; action?: string };
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (body.key !== ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!body.id || (body.action !== "approve" && body.action !== "reject")) {
    return Response.json({ error: "id and action required" }, { status: 400 });
  }
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/$/, "")}/admin/moderate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-secret": ADMIN_SECRET },
      body: JSON.stringify({ id: body.id, action: body.action }),
    });
    const json = await res.json().catch(() => ({}));
    return Response.json(json, { status: res.status });
  } catch (e) {
    console.error("moderate failed:", e);
    return Response.json(
      { error: "Could not reach the listing service.", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
