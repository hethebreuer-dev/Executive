// eBay Motors via the managed apify/cheerio-scraper actor.
//
// NOTE: this source originally used eBay's official Browse API, but that path
// requires an approved eBay developer account with Buy-API production access —
// which was denied — so the sanctioned API is unavailable to us. Instead we
// scrape public eBay Motors search results (the same Apify pattern as the other
// live sources). Runs on APIFY_TOKEN alone; the residential proxy handles
// eBay's bot protection.
//
// Air-cooled only: results are filtered to 1963–1998 (through the 993);
// classifyModelFamily drops water-cooled 996+ automatically.

import { MIN_PLAUSIBLE_PRICE, type BodyStyle, type CanonicalListing, type ListingType } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "apify~cheerio-scraper";

// We scrape the SERVER-RENDERED search endpoint (/sch/i.html) — the faceted
// /b/…/bn_… browse page renders its grid client-side (JS), which a cheerio
// scraper can't see. To pull the full air-cooled set (not just the sliver a
// plain "porsche 911" search yields, which is dominated by modern 996–992
// cars), we apply eBay's item-specific facets in the category-scoped search:
// Model Year = 1964–1998 and Model = 911/912/930/964/993. classifyModelFamily()
// still does the final generation bucketing in map().
const YEAR_FACET = (() => {
  const ys: number[] = [];
  for (let y = 1964; y <= 1998; y++) ys.push(y);
  return "Model%20Year=" + ys.join("%7C"); // "Model Year=1964|1965|…|1998"
})();
const MODEL_FACET = "Model=" + ["911", "912", "930", "964", "993"].join("%7C");

// Primary: the faceted category search. Backups: model-name keyword searches
// for the models that are inherently air-cooled (964/993/930/912) — a safety
// net in case the aspect filters aren't honored, since those queries can't
// return a modern car. De-duped by item id in fetchListings.
function schUrl(extra: string, page: number): string {
  return `https://www.ebay.com/sch/i.html?_sacat=6001&_ipg=240&_pgn=${page}&${extra}`;
}
const START_URLS = [
  ...[1, 2, 3, 4].map((p) => schUrl(`_nkw=porsche&${MODEL_FACET}&${YEAR_FACET}`, p)),
  schUrl("_nkw=" + encodeURIComponent("porsche 964"), 1),
  schUrl("_nkw=" + encodeURIComponent("porsche 993"), 1),
  schUrl("_nkw=" + encodeURIComponent("porsche 930"), 1),
  schUrl("_nkw=" + encodeURIComponent("porsche 912"), 1),
];

// Runs inside the actor. eBay renders each result as an `.s-item` (or, on the
// newer SRP, `.s-card`) card. Try the known card selectors, then a generic
// /itm/ anchor sweep. If nothing matches, emit ONE diagnostic record so the
// connector can report what the page actually was (bot-wall? new markup?).
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;
  var out = [];
  function addFrom(sel) {
    $(sel).each(function () {
      var el = $(this);
      var a = el.is('a') ? el : el.find('a[href*="/itm/"]').first();
      var link = a.attr('href') || el.find('.s-item__link, .s-card__link').attr('href') || '';
      if (!link || link.indexOf('/itm/') === -1) return;
      link = link.split('?')[0];
      var title = (el.find('.s-item__title, .s-card__title, [role=heading]').first().text() || a.attr('title') || a.text() || '').replace(/^\\s*New Listing/i, '').trim();
      if (!title || title.toLowerCase() === 'shop on ebay') return;
      var price = (el.find('.s-item__price, .s-card__price').first().text() || '').trim();
      var img = el.find('img').attr('src') || el.find('img').attr('data-src') || '';
      var loc = (el.find('.s-item__location, .s-item__itemLocation, .s-card__location').text() || '').trim();
      var opts = (el.find('.s-item__bids, .s-item__purchase-options-with-icon, .s-card__attribute-row').text() || '').trim();
      out.push({ url: link, title: title, price: price, image: img, location: loc, opts: opts });
    });
  }
  addFrom('li.s-item');
  if (out.length === 0) addFrom('.s-item');
  if (out.length === 0) addFrom('.s-card');
  if (out.length === 0) addFrom('li[data-viewport]');
  if (out.length === 0) addFrom('a[href*="/itm/"]');

  var seen = {}; var uniq = [];
  out.forEach(function (o) { if (!seen[o.url]) { seen[o.url] = 1; uniq.push(o); } });
  if (uniq.length > 0) return uniq;

  // Nothing matched — return a diagnostic snapshot of the page.
  var bodyText = ($('body').text() || '').replace(/\\s+/g, ' ').trim();
  return [{
    __diag: true,
    url: context.request ? context.request.url : '',
    pageTitle: ($('title').text() || '').trim(),
    h1: ($('h1').first().text() || '').trim(),
    sItem: $('.s-item').length,
    sCard: $('.s-card').length,
    itmLinks: $('a[href*="/itm/"]').length,
    bodyLen: bodyText.length,
    textHead: bodyText.slice(0, 220)
  }];
}`;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

/** eBay price text → integer dollars. Handles "$12,345.00" and ranges
 *  ("$10,000.00 to $20,000.00" → the low end). */
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

// Titles that are clearly not a whole car, in case a part slips into 6001.
const NOT_A_CAR = /\b(wheel|wheels|fuchs|seat|seats|engine|transmission|gearbox|hood|bumper|manual|brochure|poster|model|1:18|1\/18|toy|shift knob|steering wheel|mirror|door|fender|badge|emblem|sign|key|jacket|watch)\b/i;

export function ebayMap(item: Raw): CanonicalListing | null {
  const title = (str(item.title) ?? "").trim();
  const link = str(item.url) ?? "";
  if (!title || !link) return null;
  if (NOT_A_CAR.test(title)) return null;

  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || year < 1963 || year > 1998) return null; // air-cooled range only

  const family = classifyModelFamily(title, year);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const price = parsePrice(item.price);
  if (price == null || price < MIN_PLAUSIBLE_PRICE) return null;

  const url = link.startsWith("http") ? link : `https://www.ebay.com${link}`;
  const itemId = url.match(/\/itm\/(?:.*?\/)?(\d{6,})/)?.[1] ?? url;
  const opts = (str(item.opts) ?? "").toLowerCase();
  const listingType: ListingType = /bid|auction/.test(opts) ? "auction" : "bin";
  const image = str(item.image);
  const location = (str(item.location) ?? "").replace(/^from\s+/i, "").trim();
  const [city, state] = location.split(",").map((s) => s.trim());
  const clean = title.replace(/^\d{4}\s+/, "").replace(/^porsche\s+/i, "").trim() || title;
  const now = new Date().toISOString();

  return {
    id: `ebay-motors:${itemId}`,
    source: "eBay Motors",
    sourceId: itemId,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: clean,
    body: bodyFrom(title),
    transmission: /automatic|tiptronic|sportomatic/i.test(title)
      ? "Automatic"
      : /manual|5-spd|6-spd|4-spd|5 speed/i.test(title)
        ? "Manual"
        : "Unknown",
    listingType,
    sellerType: "dealer", // eBay Motors skews dealer
    price,
    currency: "USD",
    city: city || undefined,
    state: state || undefined,
    photos: image ? [image] : [],
    title: clean,
  };
}

export const ebayConnector: ListingConnector = {
  meta: {
    id: "ebay-motors",
    name: "eBay Motors",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes:
      "Scrapes public eBay Motors search results (official Browse API path unavailable — dev account denied). Runs on APIFY_TOKEN.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("ebay-motors");

    const input = {
      startUrls: START_URLS.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 20,
      maxConcurrency: 6,
    };

    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) throw new Error(`eBay start failed: ${start.status}`);
    const run = ((await start.json()) as {
      data: { id: string; defaultDatasetId: string; status: string };
    }).data;

    const deadline = Date.now() + 280_000;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("eBay run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`eBay poll failed: ${poll.status}`);
      status = ((await poll.json()) as { data: { status: string } }).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`eBay run ${status}`);

    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`eBay dataset failed: ${ds.status}`);
    const data = (await ds.json()) as unknown;
    const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];

    const diag = items.find((it) => it && it.__diag);
    const rawCards = items.filter((it) => it && !it.__diag);

    const byId = new Map<string, CanonicalListing>();
    for (const it of rawCards) {
      const mapped = ebayMap(it);
      if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    const cars = [...byId.values()];

    // Nothing came through — surface *why* in the ingest error so we can tell a
    // markup/bot-wall miss (no cards at all) from an over-strict filter.
    if (cars.length === 0) {
      if (diag) {
        throw new Error(
          `eBay found no item cards. url=${str(diag.url)} title="${str(diag.pageTitle)}" ` +
            `h1="${str(diag.h1)}" s-item=${str(diag.sItem)} s-card=${str(diag.sCard)} ` +
            `itm-links=${str(diag.itmLinks)} bodyLen=${str(diag.bodyLen)} :: ${str(diag.textHead)}`
        );
      }
      if (rawCards.length) {
        const s = rawCards[0];
        throw new Error(
          `eBay scraped ${rawCards.length} cards but 0 passed the air-cooled filter. ` +
            `sample: title="${str(s.title)}" price="${str(s.price)}"`
        );
      }
    }
    return cars;
  },
};
