// Bring a Trailer (live auctions) via the managed apify/cheerio-scraper actor.
//
// Scrapes BaT's Porsche model pages (/porsche/911/, /porsche/912/) and keeps
// only LIVE, air-cooled auctions (≤ 1998, i.e. through the 993). BaT is behind
// Cloudflare bot protection and its ToS restricts automated access, so this
// connector is OPT-IN: it runs only when APIFY_TOKEN *and* LUFT_ENABLE_BAT are
// both set. Apify residential proxy handles the bot wall.
//
// The page-function is deliberately defensive: BaT renders its auctions grid
// from an embedded JSON island whose exact key path changes over time, so we
// recursively walk any embedded JSON (and fall back to DOM anchors) collecting
// objects that carry a /listing/ URL + title. The map() below then filters to
// live, air-cooled cars. Expect the first real run to need a field tweak.

import { MIN_PLAUSIBLE_PRICE, type BodyStyle, type CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "apify~cheerio-scraper";

const START_URLS = [
  "https://bringatrailer.com/porsche/911/",
  "https://bringatrailer.com/porsche/912/",
];

// Runs inside the actor. Recursively walks every embedded JSON blob (and falls
// back to <a href*="/listing/"> anchors) and emits one flat record per BaT
// auction it can identify: { url, title, year, bid, image, end, sold, active }.
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;
  var results = [];
  var seen = {};

  function pushItem(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    var url = '';
    ['url','permalink','link','listing_url','href'].forEach(function (k) {
      if (!url && typeof o[k] === 'string' && o[k].indexOf('/listing/') !== -1) url = o[k];
    });
    if (!url) return;
    if (url.indexOf('http') !== 0) url = 'https://bringatrailer.com' + url;
    if (seen[url]) return;
    var title = o.title || o.name || o.headline || o.post_title || '';
    if (!title) return;
    seen[url] = true;

    var img = '';
    ['thumbnail_url','image','thumbnail','photo','image_url','featured_image'].forEach(function (k) {
      if (img) return;
      var v = o[k];
      if (typeof v === 'string') img = v;
      else if (v && typeof v === 'object' && typeof v.url === 'string') img = v.url;
    });

    var bid = null;
    ['current_bid','current_bid_formatted','high_bid','price','amount','bid'].forEach(function (k) {
      if (bid == null && o[k] != null) bid = o[k];
    });
    var end = o.timestamp_end || o.end_timestamp || o.ends_at || o.auction_end || o.timestamp || null;
    var sold = o.sold_for || o.sold_text || o.sold || null;
    var active = (o.active !== undefined) ? o.active : (o.is_active !== undefined ? o.is_active : null);

    results.push({
      url: url,
      title: String(title),
      year: o.year || null,
      bid: bid,
      image: img,
      end: end,
      sold: sold ? 1 : 0,
      active: active === null ? null : (active ? 1 : 0)
    });
  }

  function walk(node, depth) {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) walk(node[i], depth + 1); return; }
    if (typeof node === 'object') {
      pushItem(node);
      var keys = Object.keys(node);
      for (var j = 0; j < keys.length; j++) {
        var v = node[keys[j]];
        if (v && typeof v === 'object') walk(v, depth + 1);
      }
    }
  }

  // 1) Embedded JSON — application/json blocks and any inline script that
  //    mentions a listing URL. Try a straight parse; only walk what parses.
  $('script').each(function () {
    var t = $(this).html() || '';
    if (t.length < 40 || t.indexOf('/listing/') === -1) return;
    var parsed = null;
    try { parsed = JSON.parse(t); } catch (e) { parsed = null; }
    if (parsed) walk(parsed, 0);
  });

  // 2) React/props mount nodes carrying JSON in a data-* attribute.
  $('[data-listing],[data-listings],[data-props],[data-react-props],[data-item]').each(function () {
    var self = this;
    ['data-listing','data-listings','data-props','data-react-props','data-item'].forEach(function (attr) {
      var raw = $(self).attr(attr);
      if (!raw) return;
      try { walk(JSON.parse(raw), 0); } catch (e) {}
    });
  });

  // 3) Last-resort DOM fallback: anchor cards linking to an auction.
  if (results.length === 0) {
    $('a[href*="/listing/"]').each(function () {
      var href = $(this).attr('href') || '';
      if (href.indexOf('/listing/') === -1) return;
      if (href.indexOf('http') !== 0) href = 'https://bringatrailer.com' + href;
      if (seen[href]) return;
      var title = ($(this).attr('title') || $(this).text() || '').trim().replace(/\\s+/g, ' ');
      if (!title || title.length < 4) return;
      seen[href] = true;
      results.push({ url: href, title: title, year: null, bid: null, image: '', end: null, sold: 0, active: null });
    });
  }

  return results;
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

/** Normalize a BaT end timestamp (unix seconds, unix ms, or ISO) to epoch ms. */
function toEndMs(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v > 1e12) return v; // already ms
    if (v > 1e9) return v * 1000; // unix seconds
    return undefined;
  }
  if (typeof v === "string") {
    const asNum = Number(v);
    if (Number.isFinite(asNum) && asNum > 1e9) return toEndMs(asNum);
    const t = Date.parse(v);
    return Number.isNaN(t) ? undefined : t;
  }
  return undefined;
}

function bodyFrom(title: string): BodyStyle {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster/i.test(title)) return "Cabriolet";
  return "Coupe";
}

export function bringATrailerMap(item: Raw): CanonicalListing | null {
  const rawTitle = (str(item.title) ?? "").trim();
  const link = str(item.url) ?? "";
  if (!rawTitle || !link) return null;
  const url = link.startsWith("http") ? link : `https://bringatrailer.com${link}`;

  const year = num(item.year) ?? Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || year < 1963 || year > 1998) return null; // air-cooled only

  const family = classifyModelFamily(rawTitle, year);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  // Live auctions only — drop anything already sold or past its end time.
  if (num(item.sold)) return null;
  if (item.active === 0) return null;
  const endMs = toEndMs(item.end);
  if (endMs != null && endMs < Date.now()) return null;

  const price = num(item.bid);
  if (price == null || price < MIN_PLAUSIBLE_PRICE) return null;

  const title = rawTitle
    .replace(/^\d{4}\s+/, "")
    .replace(/^porsche\s+/i, "")
    .trim() || rawTitle;
  const image = str(item.image);
  const now = new Date().toISOString();

  return {
    id: `bringatrailer:${url}`,
    source: "Bring a Trailer",
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
    sellerType: "auction",
    price,
    currency: "USD",
    endsAt: endMs != null ? new Date(endMs).toISOString() : undefined,
    photos: image ? [image] : [],
    title,
  };
}

export const bringATrailerConnector: ListingConnector = {
  meta: {
    id: "bring-a-trailer",
    name: "Bring a Trailer",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes:
      "Live air-cooled auctions from BaT Porsche model pages. OPT-IN: needs APIFY_TOKEN and LUFT_ENABLE_BAT (BaT ToS restricts scraping; keep off unless intended).",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    // Opt-in: both the Apify token and an explicit enable flag are required, so
    // BaT is never hit unless the operator deliberately turns it on.
    return Boolean(ctx.env("APIFY_TOKEN")) && Boolean(ctx.env("LUFT_ENABLE_BAT"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("bring-a-trailer");

    const input = {
      startUrls: START_URLS.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 12,
      maxConcurrency: 4,
    };

    // Start async + poll (BaT pages behind a bot wall can be slow), mirroring
    // the Autotrader/Elferspot connectors so no single request stalls.
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) throw new Error(`BaT start failed: ${start.status}`);
    const run = ((await start.json()) as {
      data: { id: string; defaultDatasetId: string; status: string };
    }).data;

    const deadline = Date.now() + 280_000;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("BaT run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`BaT poll failed: ${poll.status}`);
      status = ((await poll.json()) as { data: { status: string } }).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`BaT run ${status}`);

    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`BaT dataset failed: ${ds.status}`);
    const data = (await ds.json()) as unknown;
    const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];

    // De-dupe by canonical id (the same auction can appear in more than one
    // embedded blob on the page).
    const byId = new Map<string, CanonicalListing>();
    for (const it of items) {
      const mapped = bringATrailerMap(it);
      if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    return [...byId.values()];
  },
};
