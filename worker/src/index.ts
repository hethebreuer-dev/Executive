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

async function ingest(env: Env): Promise<{ listings: number; comps: number }> {
  const ctx = workerContext(env as unknown as Record<string, unknown>);
  const connectors = activeConnectors(ctx);

  const listingResults = await Promise.all(
    connectors.filter(providesListings).map((c) =>
      c.fetchListings(ctx).catch((e) => {
        console.error(`[${c.meta.id}] listings failed:`, e);
        return [] as CanonicalListing[];
      })
    )
  );
  const listings = dedupeListings(listingResults.flat());
  await upsertListings(env.DB, listings);

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

  return { listings: listings.length, comps: comps.length };
}

async function upsertListings(db: D1Database, listings: CanonicalListing[]) {
  if (!listings.length) return;
  const stmt = db.prepare(
    `INSERT INTO listings (
       id, source, source_id, url, first_seen, last_seen, status, year,
       model_family, trim, body, transmission, vin, matching_numbers, mileage,
       exterior_color, interior_color, listing_type, seller_type, price, currency,
       ends_at, city, state, comp_delta_pct, photos, title, caption, blurb, dedupe_key
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(dedupe_key) DO UPDATE SET
       last_seen=excluded.last_seen, status=excluded.status, price=excluded.price,
       comp_delta_pct=excluded.comp_delta_pct, photos=excluded.photos,
       url=excluded.url, title=excluded.title, mileage=excluded.mileage`
  );
  await db.batch(
    listings.map((l) =>
      stmt.bind(
        l.id, l.source, l.sourceId, l.url, l.firstSeen, l.lastSeen, l.status, l.year,
        l.modelFamily, l.trim, l.body, l.transmission, l.vin ?? null,
        l.matchingNumbers == null ? null : l.matchingNumbers ? 1 : 0, l.mileage ?? null,
        l.exteriorColor ?? null, l.interiorColor ?? null, l.listingType, l.sellerType,
        Math.round(l.price), l.currency, l.endsAt ?? null, l.city ?? null, l.state ?? null,
        l.compDeltaPct ?? null, JSON.stringify(l.photos ?? []), l.title,
        l.caption ?? null, l.blurb ?? null, dedupeKey(l)
      )
    )
  );
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
      const result = await ingest(env);
      return Response.json({ ok: true, ...result });
    }

    return new Response("LUFT ingest worker", { status: 200 });
  },
};

export default handler;
