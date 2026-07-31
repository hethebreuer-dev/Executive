// GET /api/account/listings?email=... — a seller's own listings (any status),
// read from the repository. Used by the account page to show real, live data.

import { repository } from "@/lib/luft/factory";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return Response.json({ listings: [] });
  try {
    const listings = await repository.listBySeller(email);
    return Response.json({ listings });
  } catch (e) {
    console.error("account listings failed:", e);
    return Response.json({ listings: [] });
  }
}
