// Autotrader Classics via the managed apify/cheerio-scraper actor.
//
// Unlike Elferspot, Autotrader's search cards carry everything (price, mileage,
// title, image, dealer, detail URL), so this is a SINGLE-STAGE scrape — read the
// result cards straight off the search pages, no detail-page hop. Fast enough to
// use run-sync. Air-cooled range is pinned via the year filter in the URLs.

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
// its own model.
const START_URLS = [
  "https://classics.autotrader.com/classic-cars-for-sale/porsche-911-for-sale?year_max=1998&year_min=1963",
  "https://classics.autotrader.com/classic-cars-for-sale/porsche-912-for-sale?year_max=1998&year_min=1963",
];

// Runs inside the actor. Class names on Autotrader's cards drift, so instead of
// matching fixed classes we key off the stable detail-page links
// (a[href^="/classic-cars/"]) and pull title/price/mileage/image from the
// nearest ancestor that contains a price. JSON-LD is a fallback. If nothing
// matches, we emit one diagnostic object describing the page so the selectors
// can be pinned from a real run (mapper drops anything without a year).
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;
  var out = [];
  var seen = {};
  $('a[href^="/classic-cars/"]').each(function () {
    var a = $(this);
    var href = a.attr('href') || '';
    if (!href || seen[href]) return;
    // Climb to the largest ancestor that still wraps only THIS card's detail
    // link — stop before an ancestor that holds another listing's link, so a
    // no-price ("Make An Offer") card can't inherit a neighbour's data.
    var box = a;
    for (var k = 0; k < 8; k++) {
      var parent = box.parent();
      if (!parent.length) break;
      if (parent.find('a[href^="/classic-cars/"]').length > 1) break;
      box = parent;
    }
    var text = box.text().replace(/\\s+/g, ' ').trim();
    var title = (box.find('h1,h2,h3,h4').first().text() || a.text()).replace(/\\s+/g, ' ').trim();
    var priceM = text.match(/\\$\\s*[\\d,]{3,}/);
    var mileM = text.match(/[\\d,]+\\s*mi\\b/i);
    var img = box.find('img').first().attr('src') || box.find('img').first().attr('data-src') || '';
    if (title) { seen[href] = 1; out.push({ link: href, title: title, price: priceM ? priceM[0] : '', mileage: mileM ? mileM[0] : '', image: img }); }
  });
  if (out.length) return out;

  try {
    $('script[type="application/ld+json"]').each(function () {
      var node = JSON.parse($(this).contents().text() || '{}');
      var list = node.itemListElement || node['@graph'] || [];
      (Array.isArray(list) ? list : []).forEach(function (el) {
        var it = el.item || el;
        if (it && it.name && (it['@type'] === 'Car' || it['@type'] === 'Product' || it['@type'] === 'Vehicle' || it.offers)) {
          var off = it.offers || {};
          var im = typeof it.image === 'string' ? it.image : (it.image && it.image[0]) || '';
          out.push({ link: it.url || '', title: String(it.name), price: off.price ? ('$' + off.price) : '', mileage: '', image: im });
        }
      });
    });
  } catch (e) {}
  if (out.length) return out;

  var cc = {};
  $('[class]').slice(0, 500).each(function () {
    ($(this).attr('class') || '').split(/\\s+/).forEach(function (c) {
      if (/list|vehicle|result|card|inventory|srp|tile/i.test(c)) cc[c] = (cc[c] || 0) + 1;
    });
  });
  return [{
    __diagnostic: true,
    url: context.request.url,
    pageTitle: ($('title').first().text() || '').slice(0, 140),
    htmlLength: ($.html() || '').length,
    anchorsClassicCars: $('a[href^="/classic-cars/"]').length,
    anchorsAll: $('a').length,
    jsonLd: $('script[type="application/ld+json"]').length,
    hasNextData: $('#__NEXT_DATA__').length,
    candidateClasses: cc
  }];
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

  const family = classifyModelFamily(rawTitle);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const price = parsePrice(str(item.price));
  if (price == null) return null; // drop "Make An Offer" / no price

  const link = str(item.link) ?? "";
  const url = link.startsWith("http")
    ? link
    : `https://classics.autotrader.com${link}`;
  const title = rawTitle.replace(/^\d{4}\s+porsche\s+/i, "").trim();
  const image = str(item.image);
  const now = new Date().toISOString();

  return {
    id: `autotrader:${url}`,
    source: str(item.seller) || "Autotrader Classics",
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
    notes: "Single-stage cheerio crawl of the porsche-911/912 search pages. Runs on APIFY_TOKEN.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("autotrader");

    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          startUrls: START_URLS.map((url) => ({ url })),
          pageFunction: PAGE_FUNCTION,
          // Datacenter proxy reaches the search pages fine (they return 200);
          // the earlier miss was the extractor, not a block. Keep the session
          // pool for cookie continuity.
          proxyConfiguration: { useApifyProxy: true },
          useSessionPool: true,
          persistCookiesPerSession: true,
          maxRequestRetries: 3,
          maxRequestsPerCrawl: 12,
        }),
      }
    );
    if (!res.ok) throw new Error(`Autotrader actor failed: ${res.status}`);

    const data = (await res.json()) as unknown;
    const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];
    const out: CanonicalListing[] = [];
    for (const it of items) {
      const mapped = autotraderMap(it);
      if (mapped) out.push(mapped);
    }
    return out;
  },
};
