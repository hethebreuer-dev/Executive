// POST /api/account/delete-part  { email, id }
// Lets a seller remove one of their own parts (e.g. after it sells). Scoped to
// the seller_email presented, so a caller can only delete a part tied to their
// own email. (Mirrors the car delete-listing route's prototype auth model.)

import { deletePart } from "@/lib/luft/parts";

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

  try {
    const removed = await deletePart(id, email);
    if (!removed) return Response.json({ error: "Part not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("delete part failed:", e);
    return Response.json(
      { error: "Could not remove the part.", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
