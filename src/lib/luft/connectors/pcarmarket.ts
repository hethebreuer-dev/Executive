// PCARMARKET via its JSON marketplace API (fetched by apify/cheerio-scraper).
//
// The marketplace grid is client-rendered, but the SPA loads its listings from
// a clean JSON endpoint (/api/marketplace/?type=cars&…), already filtered to the
// air-cooled years server-side. We fetch that JSON with the cheerio actor (no
// browser, no rental) and parse it — far simpler and cheaper than rendering the
// page. The parser is defensive about the JSON shape and emits a diagnostic
// (with a sample of the payload) when it can't find listings.

import { MIN_PLAUSIBLE_PRICE, type BodyStyle, type CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "apify~cheerio-scraper";

// The SPA's listings API, air-cooled years pinned. Air-cooled inventory is small
// (~1 page), so a couple of pages covers it; beyond the last page the API 404s
// with a "Invalid page" body (handled gracefully).
function apiUrls(pages: number): string[] {
  const base =
    "https://www.pcarmarket.com/api/marketplace/?type=cars&limit=48&make=porsche&series=all&start_year=1964&end_year=1998&sort_by=recent";
  const urls: string[] = [];
  for (let p = 1; p <= pages; p++) urls.push(`${base}&page=${p}`);
  return urls;
}
const START_URLS = apiUrls(2);

// Runs inside the actor. context.body is the JSON payload; find the listings
// array (defensively), then emit one flat record per car. Builds the auction
// URL from a slug when the object doesn't carry a full URL.
const PAGE_FUNCTION = `async function pageFunction(context) {
  // cheerio-scraper exposes a parsed JSON body as context.json; fall back to
  // parsing context.body, which can be a Buffer for JSON responses (a plain
  // typeof-string check misses it, leaving the payload unparsed).
  var json = context.json || null;
  if (!json) {
    var raw = context.body;
    if (raw && typeof raw !== 'string' && typeof raw.toString === 'function') raw = raw.toString('utf8');
    try { json = JSON.parse(raw); } catch (e) { json = null; }
  }
  if (!json) {
    return { __diag: true, url: context.request ? context.request.url : '', note: 'body not JSON', head: String(context.body || '').slice(0, 200) };
  }

  function firstArray(o, depth) {
    if (!o || depth > 5) return null;
    if (Array.isArray(o)) return o;
    if (typeof o === 'object') {
      var known = ['results','items','data','listings','vehicles','objects','cars','auctions'];
      for (var i = 0; i < known.length; i++) { if (Array.isArray(o[known[i]])) return o[known[i]]; }
      var kk = Object.keys(o);
      for (var j = 0; j < kk.length; j++) { var r = firstArray(o[kk[j]], depth + 1); if (r && r.length) return r; }
    }
    return null;
  }
  var arr = firstArray(json, 0);
  if (arr === null) {
    return { __diag: true, url: context.request ? context.request.url : '', note: 'no array found', keys: Object.keys(json).join(','), sample: JSON.stringify(json).slice(0, 400) };
  }

  var out = [];
  arr.forEach(function (o) {
    if (!o || typeof o !== 'object') return;
    var v = o.vehicle || {};
    // Prefer the structured vehicle fields (clean, reliable year); fall back to
    // the display title minus its "MarketPlace: " prefix.
    var title = (v.year || v.make || v.model) ? [v.year, v.make, v.model].filter(Boolean).join(' ') : '';
    if (!title) title = String(o.title || '').replace(/^\\s*marketplace:\\s*/i, '').trim();
    title = String(title || '').trim();

    var slug = o.slug || o.marketplace_listing_slug || '';
    var url = slug ? ('https://www.pcarmarket.com/auction/' + slug) : '';
    if (!title || !url) return;

    var img = o.featured_image_large_url || o.featured_image_url || '';
    out.push({
      url: url,
      title: title,
      // Price candidates in preference order — live bid, then estimated value.
      price: (typeof o.current_bid === 'number' ? ('$' + o.current_bid) : String(o.current_bid || '')),
      highBid: (typeof o.high_bid === 'number' ? o.high_bid : null),
      retail: String(o.retail_value || ''),
      reserve: (typeof o.reserve_price === 'number' ? o.reserve_price : null),
      image: String(img || ''),
      year: v.year || o.year || null
    });
  });

  if (out.length) return out;
  if (arr.length === 0) return []; // legitimately empty (trailing) page
  return { __diag: true, url: context.request ? context.request.url : '', note: 'array found but 0 parsed', arrLen: arr.length, sample: JSON.stringify(arr[0]).slice(0, 500) };
}`;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

const num = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const d = v.replace(/[^0-9]/g, "");
    if (!d) return undefined;
    const n = parseInt(d, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
};

function parsePrice(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const cleaned = s.split(/\bto\b|–|-/i)[0].replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function bodyFrom(title: string): BodyStyle {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}

export function pcarmarketMap(item: Raw): CanonicalListing | null {
  const rawTitle = (str(item.title) ?? "").trim();
  const link = str(item.url) ?? "";
  if (!rawTitle || !link) return null;
  const url = link.startsWith("http") ? link : `https://www.pcarmarket.com/${link.replace(/^\//, "")}`;

  const year = num(item.year) ?? Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || year < 1963 || year > 1998) return null; // air-cooled range only

  const family = classifyModelFamily(rawTitle, year);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  // First plausible price across the candidates — a live current bid can be low
  // early in an auction, so fall back to high bid / retail estimate / reserve
  // rather than dropping the car.
  const candidates = [parsePrice(item.price), num(item.highBid), parsePrice(item.retail), num(item.reserve)];
  const price = candidates.find((p): p is number => p != null && p >= MIN_PLAUSIBLE_PRICE) ?? null;
  if (price == null) return null;

  const image = str(item.image);
  const title = rawTitle.replace(/^\d{4}\s+/, "").replace(/^porsche\s+/i, "").trim() || rawTitle;
  const now = new Date().toISOString();

  return {
    id: `pcarmarket:${url}`,
    source: "PCARMARKET",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title,
    body: bodyFrom(rawTitle),
    transmission: "Unknown",
    listingType: "auction",
    sellerType: "private",
    price,
    currency: "USD",
    photos: image ? [image] : [],
    title,
  };
}

export const pcarmarketConnector: ListingConnector = {
  meta: {
    id: "pcarmarket",
    name: "PCARMARKET",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Air-cooled Porsche listings from PCARMARKET's JSON marketplace API. Runs on APIFY_TOKEN.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("pcarmarket");

    const input = {
      startUrls: START_URLS.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 10,
      maxConcurrency: 4,
    };

    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) {
      const detail = await start.text().catch(() => "");
      throw new Error(`PCARMARKET start failed: ${start.status} ${detail.slice(0, 200)}`);
    }
    const run = ((await start.json()) as {
      data: { id: string; defaultDatasetId: string; status: string };
    }).data;

    const deadline = Date.now() + 280_000;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("PCARMARKET run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`PCARMARKET poll failed: ${poll.status}`);
      status = ((await poll.json()) as { data: { status: string } }).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`PCARMARKET run ${status}`);

    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`PCARMARKET dataset failed: ${ds.status}`);
    const data = (await ds.json()) as unknown;
    const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];

    if (items.length === 0) {
      throw new Error("PCARMARKET returned an empty dataset — requests likely blocked.");
    }

    const diag = items.find((it) => it && it.__diag);
    const rawCards = items.filter((it) => it && !it.__diag);

    const byId = new Map<string, CanonicalListing>();
    for (const it of rawCards) {
      const mapped = pcarmarketMap(it);
      if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    const cars = [...byId.values()];

    if (cars.length === 0) {
      if (diag) {
        throw new Error(
          `PCARMARKET parsed no listings. url=${str(diag.url)} note="${str(diag.note)}" ` +
            `keys=${str(diag.keys)} arrLen=${str(diag.arrLen)} sample=${str(diag.sample) ?? str(diag.head)}`
        );
      }
      if (rawCards.length) {
        const s = rawCards[0];
        throw new Error(
          `PCARMARKET scraped ${rawCards.length} cards but 0 passed the filter. ` +
            `sample: title="${str(s.title)}" price="${str(s.price)}" url="${str(s.url)}"`
        );
      }
    }
    return cars;
  },
};
