// GET /api/account/parts?email=…  → the signed-in seller's own parts.
// Mirrors /api/account/listings for cars. Client-side auth prototype: the email
// is presented by the browser, so this is scoping, not hardened authorization.

import { listPartsBySeller } from "@/lib/luft/parts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return Response.json({ parts: [] });
  try {
    const parts = await listPartsBySeller(email);
    return Response.json({ parts });
  } catch (e) {
    console.error("list seller parts failed:", e);
    return Response.json({ parts: [] });
  }
}
