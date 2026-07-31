// LUFT ingestion Worker (Cloudflare). Runs the same connectors the app uses —
// on a cron — normalizing, deduping, and upserting into D1. The app then reads
// D1 through D1Repository. Deploy + schedule via worker/wrangler.toml.
//
//   wrangler d1 create luft                 # then paste the id into wrangler.toml
//   wrangler d1 execute luft --remote --file=./worker/schema.sql
//   wrangler secret put EBAY_APP_ID         # + EBAY_CERT_ID, INGEST_SECRET, ...
//   wrangler deploy

import {
  providesComps,
  providesListings,
} from "../../src/lib/luft/connectors/connector";
import { workerContext } from "../../src/lib/luft/connectors/context";
import type { CanonicalListing, SoldComp } from "../../src/lib/luft/model";
import { dedupeKey, dedupeListings } from "../../src/lib/luft/normalize";
import { activeConnectors } from "../../src/lib/luft/registry";

export interface Env {
  DB: D1Database;
  PHOTOS?: R2Bucket; // R2 bucket for seller-uploaded photos
  INGEST_SECRET?: string;
  SUBMIT_SECRET?: string; // guards POST /submit (set on the app too)
  ADMIN_SECRET?: string; // guards GET /admin/pending + POST /admin/moderate
  // Connector config (set via `wrangler secret put ...`):
  EBAY_APP_ID?: string;
  EBAY_CERT_ID?: string;
  EBAY_ENV?: string;
  EBAY_MARKETPLACE?: string;
  APIFY_TOKEN?: string;
  LUFT_ENABLE_MOCK?: string;
}

// --- Seller submissions (the "List your car" backend) --------------------------
// Seller-created listings live in the same `listings` table, distinguished by an
// `id` prefixed `user:` and `status='pending'` until an admin approves them
// (→ 'active'). The stale-sweep is scoped by connector-id prefix, so it never
// touches these rows.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-submit-secret,x-admin-secret",
};

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per photo

interface SubmitPayload {
  title?: string;
  year?: number;
  modelFamily?: string;
  trim?: string;
  body?: string;
  transmission?: string;
  mileage?: number | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  vin?: string | null;
  matchingNumbers?: boolean | null;
  price?: number;
  currency?: string;
  city?: string | null;
  state?: string | null;
  sellerType?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string | null;
  sellerContact?: string | null;
  photos?: string[];
  blurb?: string | null;
  caption?: string | null;
}

// Add the seller columns to an existing D1 (self-healing; ADD COLUMN throws if
// the column already exists, which we ignore — SQLite has no ADD COLUMN IF NOT
// EXISTS).
async function ensureUserColumns(db: D1Database) {
  const cols = [
    "seller_name TEXT",
    "seller_email TEXT",
    "seller_phone TEXT",
    "seller_contact TEXT",
    "submitted_at TEXT",
  ];
  for (const c of cols) {
    try {
      await db.prepare(`ALTER TABLE listings ADD COLUMN ${c}`).run();
    } catch {
      /* column already exists */
    }
  }
}

async function insertUserListing(db: D1Database, p: SubmitPayload): Promise<string> {
  const id = `user:${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const photos = Array.isArray(p.photos) ? p.photos.slice(0, 24) : [];
  const dedupe = (p.vin || `${p.year}-${p.modelFamily}-${p.sellerEmail}`).toLowerCase();
  await db
    .prepare(
      `INSERT INTO listings (
         id, source, source_id, url, first_seen, last_seen, status, year,
         model_family, trim, body, transmission, vin, matching_numbers, mileage,
         exterior_color, interior_color, listing_type, seller_type, price, currency,
         ends_at, city, state, comp_delta_pct, photos, title, caption, blurb, dedupe_key,
         seller_name, seller_email, seller_phone, seller_contact, submitted_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      id, "LUFT Seller", id, "", now, now, "pending", p.year ?? 0,
      p.modelFamily ?? "911", p.trim ?? "", p.body ?? "Coupe", p.transmission ?? "Manual",
      p.vin ?? null, p.matchingNumbers == null ? null : p.matchingNumbers ? 1 : 0,
      p.mileage ?? null, p.exteriorColor ?? null, p.interiorColor ?? null,
      "classified", p.sellerType === "dealer" ? "dealer" : "private",
      Math.round(p.price ?? 0), p.currency ?? "USD", null, p.city ?? null, p.state ?? null,
      null, JSON.stringify(photos), p.title ?? "", p.caption ?? null, p.blurb ?? null, dedupe,
      p.sellerName ?? null, p.sellerEmail ?? null, p.sellerPhone ?? null,
      p.sellerContact ?? null, now
    )
    .run();
  return id;
}

interface SourceReport {
  id: string;
  count: number;
  error?: string;
}

async function ingest(
  env: Env
): Promise<{ listings: number; comps: number; swept: number; sources: SourceReport[] }> {
  const ctx = workerContext(env as unknown as Record<string, unknown>);
  const connectors = activeConnectors(ctx);

  // Ensure dedupe_key is a NON-unique index before we upsert (self-healing).
  await migrateDedupeIndex(env.DB);

  // Keep results grouped by connector so the sweep can be scoped per source,
  // and capture per-connector errors so /ingest can report them (a refused or
  // failing source is otherwise invisible — it just returns nothing).
  const perConnector = await Promise.all(
    connectors.filter(providesListings).map(async (c) => {
      try {
        return { id: c.meta.id, items: await c.fetchListings(ctx), error: undefined as string | undefined };
      } catch (e) {
        console.error(`[${c.meta.id}] listings failed:`, e);
        return {
          id: c.meta.id,
          items: [] as CanonicalListing[],
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );
  // dedupeListings merges same-car-across-sources by fuzzy key; then collapse
  // any exact id (= source URL) duplicates, since one car can appear on several
  // Classic.com pages (e.g. the f-body parent and the nested 912 page). A batch
  // must never carry the same PK twice.
  const merged = dedupeListings(perConnector.flatMap((r) => r.items));
  const byId = new Map<string, CanonicalListing>();
  for (const l of merged) byId.set(l.id, l);
  const listings = [...byId.values()];
  await upsertListings(env.DB, listings);

  // Stale-sweep with a 6-hour grace period: drop each connector's ACTIVE rows
  // only if they haven't been seen for 6h — NOT merely absent from this run.
  // Scrapers return a different subset each run (rotating proxies), so a
  // one-run miss shouldn't delist a real car; 6h ≈ many consecutive runs.
  // Scoped per-connector via the id prefix and skipped when a connector
  // returned nothing, so a transient fetch failure can never wipe good data.
  const staleCutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  let swept = 0;
  for (const r of perConnector) {
    if (!r.items.length) continue;
    try {
      const res = await env.DB.prepare(
        "DELETE FROM listings WHERE status = 'active' AND last_seen < ? AND id LIKE ?"
      )
        .bind(staleCutoff, `${r.id}:%`)
        .run();
      swept += res.meta?.changes ?? 0;
    } catch (e) {
      // The listings are already upserted; a failed sweep just leaves stale
      // rows for next run — never fail the whole ingest over it.
      console.error(`[${r.id}] sweep failed:`, e);
    }
  }

  const compResults = await Promise.all(
    connectors.filter(providesComps).map((c) =>
      c.fetchComps(ctx).catch((e) => {
        console.error(`[${c.meta.id}] comps failed:`, e);
        return [] as SoldComp[];
      })
    )
  );
  const comps = compResults.flat();
  await upsertComps(env.DB, comps);

  const sources: SourceReport[] = perConnector.map((r) => ({
    id: r.id,
    count: r.items.length,
    ...(r.error ? { error: r.error } : {}),
  }));

  return { listings: listings.length, comps: comps.length, swept, sources };
}

// Drop any UNIQUE index on dedupe_key and recreate it non-unique. Idempotent
// and cheap at this table size, so it's safe to run each ingest — existing D1s
// get healed without a manual console migration. dedupe_key is a fuzzy merge
// hint (applied in-memory by dedupeListings), not a hard identity: a UNIQUE
// constraint on it fights the id PK when a car's derived key drifts between
// scrapes, which is what was throwing "UNIQUE constraint failed: listings.id".
async function migrateDedupeIndex(db: D1Database) {
  try {
    await db.batch([
      db.prepare("DROP INDEX IF EXISTS idx_listings_dedupe"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_listings_dedupe ON listings(dedupe_key)"),
    ]);
  } catch (e) {
    console.error("dedupe index migration skipped:", e);
  }
}

async function upsertListings(db: D1Database, listings: CanonicalListing[]) {
  if (!listings.length) return;
  // Upsert on the stable primary key (id = source URL), NOT dedupe_key.
  const stmt = db.prepare(
    `INSERT INTO listings (
       id, source, source_id, url, first_seen, last_seen, status, year,
       model_family, trim, body, transmission, vin, matching_numbers, mileage,
       exterior_color, interior_color, listing_type, seller_type, price, currency,
       ends_at, city, state, comp_delta_pct, photos, title, caption, blurb, dedupe_key
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       last_seen=excluded.last_seen, status=excluded.status, price=excluded.price,
       comp_delta_pct=excluded.comp_delta_pct, photos=excluded.photos,
       url=excluded.url, title=excluded.title, mileage=excluded.mileage,
       dedupe_key=excluded.dedupe_key`
  );
  const bound = listings.map((l) =>
    stmt.bind(
      l.id, l.source, l.sourceId, l.url, l.firstSeen, l.lastSeen, l.status, l.year,
      l.modelFamily, l.trim, l.body, l.transmission, l.vin ?? null,
      l.matchingNumbers == null ? null : l.matchingNumbers ? 1 : 0, l.mileage ?? null,
      l.exteriorColor ?? null, l.interiorColor ?? null, l.listingType, l.sellerType,
      Math.round(l.price), l.currency, l.endsAt ?? null, l.city ?? null, l.state ?? null,
      l.compDeltaPct ?? null, JSON.stringify(l.photos ?? []), l.title,
      l.caption ?? null, l.blurb ?? null, dedupeKey(l)
    )
  );
  // Chunk the batch: photo arrays make rows large, and a single batch of many
  // hundreds can exceed D1's request-size limit (an opaque 500). 25 is safe.
  const CHUNK = 25;
  for (let i = 0; i < bound.length; i += CHUNK) {
    await db.batch(bound.slice(i, i + CHUNK));
  }
}

async function upsertComps(db: D1Database, comps: SoldComp[]) {
  if (!comps.length) return;
  const stmt = db.prepare(
    `INSERT INTO sold_comps (id, source, model_family, trim, year, sold_price, sold_at, mileage, url)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET sold_price=excluded.sold_price, sold_at=excluded.sold_at`
  );
  await db.batch(
    comps.map((c) =>
      stmt.bind(
        c.id, c.source, c.modelFamily, c.trim, c.year, Math.round(c.soldPrice),
        c.soldAt, c.mileage ?? null, c.url ?? null
      )
    )
  );
}

const handler = {
  // Scheduled ingestion (cron in wrangler.toml).
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      ingest(env).then((r) => console.log("ingest ok:", r)).catch((e) => console.error("ingest failed:", e))
    );
  },

  // Manual trigger + health check.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/health") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM listings").first<{ n: number }>();
      return Response.json({ ok: true, listings: row?.n ?? 0 });
    }

    // --- Seller photo upload → R2 -------------------------------------------
    // Public (called from the browser). Bounded by content-type + size; keys
    // are random so nothing is guessable/overwritable.
    if (url.pathname === "/upload" && request.method === "POST") {
      if (!env.PHOTOS) return Response.json({ error: "Uploads not configured" }, { status: 503, headers: CORS });
      const ct = request.headers.get("content-type") || "";
      const ext = IMAGE_EXT[ct];
      if (!ext) return Response.json({ error: "Only JPEG/PNG/WebP/GIF/AVIF images" }, { status: 415, headers: CORS });
      const buf = await request.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_UPLOAD_BYTES) {
        return Response.json({ error: "Image must be 1 byte–10 MB" }, { status: 413, headers: CORS });
      }
      const key = `${crypto.randomUUID()}.${ext}`;
      await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: ct } });
      return Response.json({ url: `${url.origin}/photo/${key}` }, { headers: CORS });
    }

    // --- Serve an uploaded photo from R2 ------------------------------------
    if (url.pathname.startsWith("/photo/") && request.method === "GET") {
      if (!env.PHOTOS) return new Response("Not found", { status: 404 });
      const key = decodeURIComponent(url.pathname.slice("/photo/".length));
      const obj = await env.PHOTOS.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }

    // --- Seller listing submission (secret-guarded; the app forwards) -------
    if (url.pathname === "/submit" && request.method === "POST") {
      if (!env.SUBMIT_SECRET || request.headers.get("x-submit-secret") !== env.SUBMIT_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      let p: SubmitPayload;
      try {
        p = (await request.json()) as SubmitPayload;
      } catch {
        return Response.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
      }
      if (!p.title || !p.year || !p.modelFamily || !p.price || !p.sellerEmail) {
        return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS });
      }
      try {
        await ensureUserColumns(env.DB);
        const id = await insertUserListing(env.DB, p);
        return Response.json({ ok: true, id }, { headers: CORS });
      } catch (e) {
        console.error("submit failed:", e);
        return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500, headers: CORS });
      }
    }

    // --- Admin: list pending submissions ------------------------------------
    if (url.pathname === "/admin/pending" && request.method === "GET") {
      if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      await ensureUserColumns(env.DB);
      const { results } = await env.DB.prepare(
        `SELECT id, title, year, model_family, price, seller_name, seller_email,
                seller_phone, seller_contact, city, state, submitted_at, photos
           FROM listings WHERE status = 'pending' ORDER BY submitted_at DESC`
      ).all();
      return Response.json({ ok: true, pending: results ?? [] }, { headers: CORS });
    }

    // --- Admin: approve / reject a submission -------------------------------
    if (url.pathname === "/admin/moderate" && request.method === "POST") {
      if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      let body: { id?: string; action?: string };
      try {
        body = (await request.json()) as { id?: string; action?: string };
      } catch {
        return Response.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
      }
      if (!body.id || (body.action !== "approve" && body.action !== "reject")) {
        return Response.json({ error: "id and action (approve|reject) required" }, { status: 400, headers: CORS });
      }
      const status = body.action === "approve" ? "active" : "withdrawn";
      const res = await env.DB.prepare(
        "UPDATE listings SET status = ? WHERE id = ? AND id LIKE 'user:%'"
      )
        .bind(status, body.id)
        .run();
      return Response.json({ ok: true, changed: res.meta?.changes ?? 0, status }, { headers: CORS });
    }

    if (url.pathname === "/ingest" && request.method === "POST") {
      if (!env.INGEST_SECRET || request.headers.get("x-ingest-secret") !== env.INGEST_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }
      try {
        const result = await ingest(env);
        return Response.json({ ok: true, ...result });
      } catch (e) {
        // Surface the real error as JSON so the browser console shows the
        // message instead of Cloudflare's HTML 500 page.
        console.error("ingest failed:", e);
        const message = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
        return Response.json({ ok: false, error: message }, { status: 500 });
      }
    }

    return new Response("LUFT ingest worker", { status: 200 });
  },
};

export default handler;
