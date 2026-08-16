// PCARMARKET via the managed apify/cheerio-scraper actor.
//
// Scrapes the Porsche marketplace, pre-filtered to the air-cooled years
// (startYear=1964&endYear=1998) server-side. PCARMARKET is enthusiast-run and
// far more scrape-friendly than eBay. Runs on APIFY_TOKEN.
//
// The page-function is defensive (embedded-JSON walk + /auction/ anchor
// fallback) and emits a diagnostic when it finds nothing, so a markup change or
// client-rendering surfaces as an ingest error instead of a silent zero.

import { MIN_PLAUSIBLE_PRICE, type BodyStyle, type CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "apify~cheerio-scraper";

// Air-cooled Porsche cars, year-filtered server-side. Paginated with ?page=N.
function browseUrls(pages: number): string[] {
  const base =
    "https://www.pcarmarket.com/marketplace?itemType=cars&make=porsche&startYear=1964&endYear=1998&porscheOnly=true";
  const urls: string[] = [];
  for (let p = 1; p <= pages; p++) urls.push(`${base}&page=${p}`);
  return urls;
}
const START_URLS = browseUrls(6);

// Runs inside the actor. Collects listings from any embedded JSON blob (walking
// for objects that carry a pcarmarket /auction/ URL + a title), then falls back
// to /auction/ anchors in the DOM. Emits a diagnostic record if nothing matches.
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;
  var out = [];
  var seen = {};

  function priceIn(text) {
    var m = (text || '').match(/\\$[0-9][0-9,]{2,}/);
    return m ? m[0] : '';
  }
  function pushCard(url, title, price, img) {
    if (!url || url.indexOf('/auction/') === -1) return;
    if (url.indexOf('http') !== 0) url = 'https://www.pcarmarket.com' + url;
    url = url.split('?')[0];
    if (seen[url]) return;
    title = (title || '').replace(/\\s+/g, ' ').trim();
    if (!title || title.length < 4) return;
    seen[url] = true;
    out.push({ url: url, title: title, price: price || '', image: img || '' });
  }

  function pushItem(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    var url = '';
    ['url','permalink','link','absolute_url','path'].forEach(function (k) {
      if (!url && typeof o[k] === 'string' && o[k].indexOf('/auction/') !== -1) url = o[k];
    });
    if (!url) return;
    var title = o.title || o.name || o.headline || o.year_make_model || '';
    var img = '';
    ['thumbnail','image','image_url','thumbnail_url','photo'].forEach(function (k) {
      if (img) return;
      var v = o[k];
      if (typeof v === 'string') img = v; else if (v && typeof v === 'object' && typeof v.url === 'string') img = v.url;
    });
    var price = o.current_bid || o.current_bid_formatted || o.price || o.high_bid || o.amount || '';
    pushCard(url, String(title), typeof price === 'number' ? ('$' + price) : String(price), img);
  }
  function walk(node, depth) {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) walk(node[i], depth + 1); return; }
    if (typeof node === 'object') {
      pushItem(node);
      var keys = Object.keys(node);
      for (var j = 0; j < keys.length; j++) { var v = node[keys[j]]; if (v && typeof v === 'object') walk(v, depth + 1); }
    }
  }

  // 1) embedded JSON
  $('script').each(function () {
    var t = $(this).html() || '';
    if (t.length < 40 || t.indexOf('/auction/') === -1) return;
    var parsed = null; try { parsed = JSON.parse(t); } catch (e) { parsed = null; }
    if (parsed) walk(parsed, 0);
  });

  // 2) DOM fallback: /auction/ anchors, pulling a price from the nearest card.
  if (out.length === 0) {
    $('a[href*="/auction/"]').each(function () {
      var a = $(this);
      var href = a.attr('href') || '';
      var title = (a.attr('title') || a.text() || '').trim();
      var card = a.closest('[class*="listing"], [class*="card"], [class*="item"], li, article, div');
      var price = priceIn(card.text());
      var img = card.find('img').attr('src') || card.find('img').attr('data-src') || a.find('img').attr('src') || '';
      pushCard(href, title, price, img);
    });
  }

  if (out.length > 0) return out;

  var bodyText = ($('body').text() || '').replace(/\\s+/g, ' ').trim();
  return [{
    __diag: true,
    url: context.request ? context.request.url : '',
    pageTitle: ($('title').text() || '').trim(),
    h1: ($('h1').first().text() || '').trim(),
    auctionLinks: $('a[href*="/auction/"]').length,
    bodyLen: bodyText.length,
    textHead: bodyText.slice(0, 220)
  }];
}`;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

function parsePrice(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const first = s.split(/\bto\b|–|-/i)[0];
  const cleaned = first.replace(/[^0-9.]/g, "");
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
  const url = link.startsWith("http") ? link : `https://www.pcarmarket.com${link}`;

  const year = Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || year < 1963 || year > 1998) return null; // air-cooled range only

  const family = classifyModelFamily(rawTitle, year);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const price = parsePrice(item.price);
  if (price == null || price < MIN_PLAUSIBLE_PRICE) return null;

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
    notes: "Air-cooled Porsche listings from PCARMARKET's year-filtered marketplace. Runs on APIFY_TOKEN.",
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
      maxRequestsPerCrawl: 12,
      maxConcurrency: 4,
    };

    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) throw new Error(`PCARMARKET start failed: ${start.status}`);
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
      throw new Error("PCARMARKET returned an empty dataset — requests likely blocked (no pages fetched).");
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
          `PCARMARKET found no listing cards. url=${str(diag.url)} title="${str(diag.pageTitle)}" ` +
            `h1="${str(diag.h1)}" auction-links=${str(diag.auctionLinks)} bodyLen=${str(diag.bodyLen)} :: ${str(diag.textHead)}`
        );
      }
      if (rawCards.length) {
        const s = rawCards[0];
        throw new Error(
          `PCARMARKET scraped ${rawCards.length} cards but 0 passed the air-cooled filter. ` +
            `sample: title="${str(s.title)}" price="${str(s.price)}"`
        );
      }
    }
    return cars;
  },
};
