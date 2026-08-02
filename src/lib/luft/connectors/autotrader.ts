// Autotrader Classics via the managed apify/cheerio-scraper actor.
//
// TWO-STAGE crawl (like Elferspot): the search cards render their PRICE via
// JavaScript, so a no-JS scrape of the search page gets title/mileage but no
// price. Instead we follow (a) the numbered pagination links to walk all ~300
// results and (b) each car's /classic-cars/ detail link, and read authoritative
// fields from the detail page's JSON-LD (structured vehicle data, server-
// rendered for SEO) — price, mileage, image, name. Runs async (run+poll) since
// crawling every detail page is well past run-sync's ~100s limit. Air-cooled
// range is pinned via the year filter in the search URLs.

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
// Enumerate the pages directly rather than following pagination links — the
// light HTML variant omits those links, so link-following is unreliable. ~300
// 911s ≈ 10 pages; 912 is far smaller. Over-provisioned pages just return
// duplicate/empty results (deduped downstream), so a few extra is harmless.
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

// Runs inside the actor. Search pages are only link sources (the actor enqueues
// each /classic-cars/…/porsche/… card link via linkSelector+globs), so we return
// null there. On a detail page we read the price/mileage/image/name from JSON-LD
// (server-rendered structured vehicle data), falling back to og:image / <h1> /
// a body-text price match. A detail page with no price maps to null downstream.
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;
  var url = context.request.url;
  if (!/\\/classic-cars\\/\\d{4}\\/porsche\\//i.test(url)) return null; // search page → just a link source

  var rec = { url: url, title: '', price: '', mileage: '', image: '', body: '' };
  $('script[type="application/ld+json"]').each(function () {
    try {
      var node = JSON.parse($(this).contents().text() || '{}');
      var nodes = node['@graph'] || (Array.isArray(node) ? node : [node]);
      nodes.forEach(function (it) {
        if (!it || typeof it !== 'object') return;
        var t = it['@type'];
        if (!(t === 'Car' || t === 'Vehicle' || t === 'Product' || t === 'Motorcycle' || it.offers)) return;
        if (it.name && !rec.title) rec.title = String(it.name);
        var off = it.offers || {};
        var price = off && (off.price || (off.priceSpecification && off.priceSpecification.price));
        if (price && !rec.price) rec.price = '$' + price;
        if (it.image && !rec.image) rec.image = typeof it.image === 'string' ? it.image : (it.image.url || it.image[0] || '');
        var od = it.mileageFromOdometer;
        if (od && !rec.mileage) rec.mileage = (typeof od === 'object' ? (od.value || '') : od) + ' mi';
        if (it.bodyType && !rec.body) rec.body = String(it.bodyType);
      });
    } catch (e) {}
  });
  if (!rec.title) rec.title = ($('h1').first().text() || $('title').first().text() || '').replace(/\\s+/g, ' ').trim();
  if (!rec.image) rec.image = $('meta[property="og:image"]').attr('content') || '';
  if (!rec.price) { var pm = ($('body').text() || '').match(/\\$\\s*[\\d,]{4,}/); if (pm) rec.price = pm[0]; }
  return rec;
}`;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

/** "$89,900" → 89900 · "Make An Offer" / "" → undefined */
function parsePrice(s?: string): number | undefined {
  if (!s) return undefined;
  const digits = s.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? undefined : n;
}

/** "82,060 mi" → 82060 */
function parseMileage(s?: string): number | undefined {
  if (!s) return undefined;
  const digits = s.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? undefined : n;
}

function bodyFrom(title: string): BodyStyle {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster/i.test(title)) return "Cabriolet";
  return "Coupe";
}

export function autotraderMap(item: Raw): CanonicalListing | null {
  const rawTitle = (str(item.title) ?? "").trim();
  const year = Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!rawTitle || !year) return null;
  if (year < 1963 || year > 1998) return null; // air-cooled range only (guards water-cooled)

  const family = classifyModelFamily(rawTitle);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const price = parsePrice(str(item.price));
  if (price == null) return null; // drop no-price listings

  const link = str(item.url) ?? "";
  const url = link.startsWith("http")
    ? link
    : `https://classics.autotrader.com${link}`;
  const title = rawTitle.replace(/^\d{4}\s+porsche\s+/i, "").trim();
  const image = str(item.image);
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
    body: bodyFrom(str(item.body) || rawTitle),
    transmission: "Unknown",
    mileage: parseMileage(str(item.mileage)),
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
    notes: "Two-stage: enumerated ?page=N search pages → detail-page JSON-LD for price (async run+poll). Runs on APIFY_TOKEN.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("autotrader");

    const input = {
      // Enumerated search pages (all ?page=N) are the entry points; the actor
      // enqueues each Porsche detail link it finds on them (glob below), and the
      // page function scrapes price/specs from those detail pages.
      startUrls: START_URLS.map((url) => ({ url })),
      linkSelector: "a",
      globs: [{ glob: "https://classics.autotrader.com/classic-cars/*/porsche/**" }],
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 400, // ~300 detail pages + the enumerated search pages
      maxConcurrency: 12,
    };

    // Walking the pagination loads dozens of pages (~5s each) — past run-sync's
    // ~100s gateway limit (a 524). Start the run async, poll it, then read the
    // dataset; each request here stays short. (Mirrors the Elferspot connector.)
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
