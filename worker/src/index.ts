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
  INGEST_SECRET?: string;
  // Connector config (set via `wrangler secret put ...`):
  EBAY_APP_ID?: string;
  EBAY_CERT_ID?: string;
  EBAY_ENV?: string;
  EBAY_MARKETPLACE?: string;
  APIFY_TOKEN?: string;
  LUFT_ENABLE_MOCK?: string;
}

async function ingest(env: Env): Promise<{ listings: number; comps: number; swept: number }> {
  // Captured before we fetch: any row refreshed this run gets a last_seen
  // stamped during/after fetch (> runStart), so it survives the stale-sweep.
  const runStart = new Date().toISOString();
  const ctx = workerContext(env as unknown as Record<string, unknown>);
  const connectors = activeConnectors(ctx);

  // Ensure dedupe_key is a NON-unique index before we upsert (self-healing).
  await migrateDedupeIndex(env.DB);

  // Keep results grouped by connector so the sweep can be scoped per source.
  const perConnector = await Promise.all(
    connectors.filter(providesListings).map(async (c) => {
      try {
        return { id: c.meta.id, items: await c.fetchListings(ctx) };
      } catch (e) {
        console.error(`[${c.meta.id}] listings failed:`, e);
        return { id: c.meta.id, items: [] as CanonicalListing[] };
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

  // Stale-sweep: drop each connector's ACTIVE rows that weren't refreshed this
  // run (last_seen < runStart) — i.e. cars sold or delisted since we last saw
  // them. Scoped per-connector via the id prefix and skipped when a connector
  // returned nothing, so a transient fetch failure can never wipe good data.
  let swept = 0;
  for (const r of perConnector) {
    if (!r.items.length) continue;
    try {
      const res = await env.DB.prepare(
        "DELETE FROM listings WHERE status = 'active' AND last_seen < ? AND id LIKE ?"
      )
        .bind(runStart, `${r.id}:%`)
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

  return { listings: listings.length, comps: comps.length, swept };
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

    if (url.pathname === "/health") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM listings").first<{ n: number }>();
      return Response.json({ ok: true, listings: row?.n ?? 0 });
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
