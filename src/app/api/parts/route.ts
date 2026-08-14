// POST /api/parts — create a parts listing. No moderation: it goes live
// immediately. Photos are already uploaded to R2 (via the Worker's /upload) by
// the browser; we just store their URLs alongside the part.

import { createPart } from "@/lib/luft/parts";
import { PART_MODELS } from "@/lib/luft/parts-model";

export const runtime = "nodejs";

type Body = {
  title?: string;
  description?: string;
  model?: string;
  partNumber?: string;
  price?: number | string | null;
  photos?: unknown;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerContact?: string;
};

const toNum = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = parseInt(String(v).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function POST(req: Request) {
  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const title = (b.title || "").trim();
  const description = (b.description || "").trim();
  const email = (b.sellerEmail || "").trim().toLowerCase();
  const model = PART_MODELS.some((m) => m.key === b.model) ? (b.model as string) : "all";

  if (!title) return Response.json({ error: "Add a title for your part." }, { status: 400 });
  if (!description) return Response.json({ error: "Add a description." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return Response.json({ error: "Enter a valid contact email." }, { status: 400 });

  const photos = Array.isArray(b.photos)
    ? b.photos.filter((x): x is string => typeof x === "string").slice(0, 12)
    : [];

  try {
    const part = await createPart({
      title,
      description,
      model,
      partNumber: (b.partNumber || "").trim() || null,
      price: toNum(b.price),
      photos,
      sellerName: (b.sellerName || "").trim() || null,
      sellerEmail: email,
      sellerPhone: (b.sellerPhone || "").trim() || null,
      sellerContact: (b.sellerContact || "").trim() || null,
    });
    return Response.json({ ok: true, id: part.id });
  } catch (e) {
    console.error("create part failed:", e);
    return Response.json(
      { error: "Could not post your part.", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
