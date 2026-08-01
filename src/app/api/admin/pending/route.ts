// GET /api/admin/pending?key=... — list pending seller submissions. The owner's
// page key (ADMIN_KEY) authorizes; the server holds the Worker admin secret.

export const runtime = "nodejs";
export const revalidate = 0;

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const ADMIN_SECRET = process.env.WORKER_ADMIN_SECRET;
const ADMIN_KEY = process.env.ADMIN_KEY;

export async function GET(req: Request) {
  if (!WORKER_URL || !ADMIN_SECRET || !ADMIN_KEY) {
    return Response.json({ error: "Admin isn't configured." }, { status: 503 });
  }
  const key = new URL(req.url).searchParams.get("key");
  if (key !== ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/$/, "")}/admin/pending`, {
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    const json = await res.json().catch(() => ({}));
    return Response.json(json, { status: res.status });
  } catch (e) {
    console.error("admin pending failed:", e);
    return Response.json(
      {
        error: "Could not reach the listing service.",
        detail: e instanceof Error ? e.message : String(e),
        workerUrl: WORKER_URL,
      },
      { status: 502 }
    );
  }
}
