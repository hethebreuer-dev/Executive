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

// Runs inside the actor. Returns one object per result card on a search page;
// cheerio-scraper saves each array element as its own dataset item.
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;
  var out = [];
  $('.listing-box-v2').each(function () {
    var card = $(this);
    var link = card.find('a[href^="/classic-cars/"]').first().attr('href') || '';
    var title = card.find('.listing-name').first().text().replace(/\\s+/g, ' ').trim();
    var price = card.find('.listing-price--standard').first().text().replace(/\\s+/g, ' ').trim();
    var mileage = '';
    card.find('.listing-spec').each(function () {
      var t = $(this).text().replace(/\\s+/g, ' ').trim();
      if (!mileage && /mi\\b/i.test(t)) mileage = t;
    });
    var seller = card.find('.listing-seller-info-item.font-bold').first().text().replace(/\\s+/g, ' ').trim();
    var image = card.find('img').first().attr('src') || '';
    if (link && title) out.push({ link: link, title: title, price: price, mileage: mileage, seller: seller, image: image });
  });
  return out;
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
          proxyConfiguration: { useApifyProxy: true },
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
