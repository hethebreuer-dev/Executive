// Autotrader Classics via the managed apify/cheerio-scraper actor.
//
// SINGLE-STAGE crawl. The search results page is server-rendered React: it
// embeds the full hydration state in an inline <script> as
// `window.__PRELOADED_STATE__ = {…}`, and that state's `listings.vehicles`
// carries every car on the page with authoritative fields (price as a number,
// vdp_url, year, mileage, photos, trim, exterior_color). So we don't need to
// visit detail pages or read JS-rendered cards — we parse that JSON straight
// off each enumerated ?page=N search page and emit one record per car. Air-
// cooled range is pinned via the year filter in the search URLs.

import type { BodyStyle, CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "apify~cheerio-scraper";

// Air-cooled only (1963–1998). 964/993/930 fold under the 911 line here; 912 is
// its own model. Pagination is a plain ?page=N query param (30 results/page).
// Enumerate the pages directly — the embedded state exposes pageCount (911 ≈ 10
// pages / ~296 cars; 912 is far smaller). Over-provision a little; pages past
// the end just render an empty listings.vehicles (nothing to emit).
function pagedSearchUrls(model: "911" | "912", pages: number): string[] {
  const urls: string[] = [];
  for (let p = 1; p <= pages; p++) {
    urls.push(
      `https://classics.autotrader.com/classic-cars-for-sale/porsche-${model}-for-sale?page=${p}&year_max=1998&year_min=1963`
    );
  }
  return urls;
}
const START_URLS = [...pagedSearchUrls("911", 11), ...pagedSearchUrls("912", 4)];

// Runs inside the actor. Finds the inline script holding
// `window.__PRELOADED_STATE__ = {…};`, extracts the JSON via brace-matching
// (string/escape aware), and returns one flat record per car pulled from
// listings.vehicles (plus the featured/prime sponsored slots). Returning an
// array pushes each element as its own dataset item. No detail-page hop.
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;

  // The state lives in a plain inline <script>. Scan script contents for the
  // assignment; context.body is the raw HTML as a fallback source.
  var blob = '';
  $('script').each(function () { var t = $(this).html() || ''; if (t.indexOf('__PRELOADED_STATE__') !== -1) blob = t; });
  if (!blob && typeof context.body === 'string') blob = context.body;

  var marker = blob.indexOf('__PRELOADED_STATE__');
  if (marker === -1) return null;
  var start = blob.indexOf('{', marker);
  if (start === -1) return null;

  // Brace-match from the first { to its partner, respecting strings/escapes.
  var depth = 0, inStr = false, esc = false, end = -1;
  for (var i = start; i < blob.length; i++) {
    var ch = blob[i];
    if (inStr) {
      if (esc) { esc = false; }
      else if (ch === '\\\\') { esc = true; }
      else if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') { depth++; }
    else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) return null;

  var state;
  try { state = JSON.parse(blob.slice(start, end)); } catch (e) { return null; }

  var L = (state && state.listings) || {};
  var bag = [];
  var vehicles = L.vehicles;
  if (vehicles && typeof vehicles === 'object') {
    Object.keys(vehicles).forEach(function (k) { bag.push(vehicles[k]); });
  }
  ['featured', 'prime'].forEach(function (key) {
    if (Array.isArray(L[key])) L[key].forEach(function (v) { if (v) bag.push(v); });
  });

  var out = [];
  bag.forEach(function (v) {
    if (!v || typeof v !== 'object') return;
    var photos = Array.isArray(v.photos) ? v.photos : [];
    out.push({
      url: v.vdp_url || '',
      title: v.title || '',
      price: typeof v.price === 'number' ? v.price : (v.price || null),
      year: typeof v.year === 'number' ? v.year : (v.year || null),
      mileage: typeof v.mileage === 'number' ? v.mileage : (v.mileage || null),
      image: photos[0] || '',
      trim: v.trim || '',
      color: v.exterior_color || '',
    });
  });
  return out;
}`;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

const num = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const digits = v.replace(/[^0-9]/g, "");
    if (!digits) return undefined;
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
};

function bodyFrom(title: string): BodyStyle {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster/i.test(title)) return "Cabriolet";
  return "Coupe";
}

export function autotraderMap(item: Raw): CanonicalListing | null {
  const rawTitle = (str(item.title) ?? "").trim();
  const year = num(item.year) ?? Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!rawTitle || !year) return null;
  if (year < 1963 || year > 1998) return null; // air-cooled range only (guards water-cooled)

  const family = classifyModelFamily(rawTitle);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const price = num(item.price);
  if (price == null) return null; // drop no-price listings

  const link = str(item.url) ?? "";
  if (!link) return null;
  const url = link.startsWith("http")
    ? link
    : `https://classics.autotrader.com${link}`;

  const trim = (str(item.trim) ?? "").trim();
  // "1967 Porsche 911" → "911"; append the trim word when the feed carries one
  // and the title doesn't already include it (e.g. trim "Coupe").
  const base = rawTitle.replace(/^\d{4}\s+porsche\s+/i, "").trim();
  const title =
    trim && !new RegExp(`\\b${trim}\\b`, "i").test(base) ? `${base} ${trim}` : base;
  const image = str(item.image);
  const color = (str(item.color) ?? "").trim() || undefined;
  const now = new Date().toISOString();

  return {
    id: `autotrader:${url}`,
    source: "Autotrader Classics",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title,
    body: bodyFrom(`${title} ${rawTitle}`),
    transmission: "Unknown",
    mileage: num(item.mileage),
    exteriorColor: color,
    listingType: "dealer",
    sellerType: "dealer",
    price,
    currency: "USD",
    photos: image ? [image] : [],
    title,
  };
}

export const autotraderConnector: ListingConnector = {
  meta: {
    id: "autotrader",
    name: "Autotrader Classics",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Single-stage: parse window.__PRELOADED_STATE__ (listings.vehicles) off each enumerated ?page=N search page. Runs on APIFY_TOKEN.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("autotrader");

    const input = {
      // Single-stage: each enumerated search page carries the full listings
      // state inline, so we scrape it directly — no link-following, no detail
      // hop (hence no linkSelector/globs).
      startUrls: START_URLS.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 40, // ~15 enumerated search pages + headroom
      maxConcurrency: 8,
    };

    // A dozen-plus page loads can edge past run-sync's ~100s gateway limit (a
    // 524), so start the run async, poll it, then read the dataset; every
    // request here stays short. (Mirrors the Elferspot connector.)
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) throw new Error(`Autotrader start failed: ${start.status}`);
    const run = ((await start.json()) as {
      data: { id: string; defaultDatasetId: string; status: string };
    }).data;

    const deadline = Date.now() + 280_000; // ~4.7 min ceiling
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("Autotrader run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`Autotrader poll failed: ${poll.status}`);
      status = ((await poll.json()) as { data: { status: string } }).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`Autotrader run ${status}`);

    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`Autotrader dataset failed: ${ds.status}`);

    const data = (await ds.json()) as unknown;
    const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];
    const out: CanonicalListing[] = [];
    for (const it of items) {
      const mapped = autotraderMap(it);
      if (mapped) out.push(mapped);
    }
    return out;
  },
};
