// POST /api/account/delete-listing  { email, id }
// Lets a seller remove one of their own listings (e.g. after it sells). Scoped
// to user-created rows (id LIKE 'user:%') AND matched on seller_email, so a
// caller can only delete a listing that belongs to the email they present.
// (This mirrors the prototype's client-side auth model — not hardened auth.)

import { d1ConfigFromEnv, d1Query } from "@/lib/luft/d1";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; id?: string };
  try {
    body = (await req.json()) as { email?: string; id?: string };
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const id = (body.id || "").trim();
  if (!email || !id) return Response.json({ error: "email and id required" }, { status: 400 });
  if (!id.startsWith("user:")) return Response.json({ error: "Not a removable listing" }, { status: 400 });

  const cfg = d1ConfigFromEnv();
  if (!cfg) return Response.json({ error: "Not configured" }, { status: 503 });

  try {
    const { changes } = await d1Query(
      cfg,
      "DELETE FROM listings WHERE id = ? AND seller_email = ? AND id LIKE 'user:%'",
      [id, email]
    );
    if (!changes) return Response.json({ error: "Listing not found." }, { status: 404 });
    return Response.json({ ok: true, removed: changes });
  } catch (e) {
    console.error("delete listing failed:", e);
    return Response.json(
      { error: "Could not remove the listing.", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
