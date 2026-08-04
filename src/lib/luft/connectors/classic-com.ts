// Classic.com via the shahidirfan/classic-com-cars-scraper Apify actor.
//
// Classic.com aggregates 1M+ auction + dealer listings and scrapes cleanly
// (unlike BaT, which hard-blocks). This is the MVP data source.
//
// The actor takes ONE startUrl per run (a Classic.com model page) plus
// result_type / results_wanted / max_pages / proxyConfiguration — confirmed from
// a real run. We loop over the air-cooled generation pages and concat; each run
// is isolated so an off slug never breaks the others. The `/f-body/` URL is
// proven; the rest follow Classic.com's confirmed `/m/porsche/911/<gen>/` shape.

import { MIN_PLAUSIBLE_PRICE, type CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "shahidirfan~classic-com-cars-scraper";

const START_URLS = [
  "https://www.classic.com/m/porsche/911/f-body/", // 1963–1973 (proven)
  "https://www.classic.com/m/porsche/911/g-body/", // 1974–1989 SC / Carrera 3.2
  "https://www.classic.com/m/porsche/911/964/", // 1989–1994
  "https://www.classic.com/m/porsche/911/993/", // 1994–1998
  // Classic.com nests the 912 under the 911 f-body taxonomy (swb/lwb + body),
  // not at /m/porsche/912/ (that path 404s and crashed the run).
  "https://www.classic.com/m/porsche/911/f-body/swb/912/coupe/",
  "https://www.classic.com/m/porsche/911/f-body/lwb/912/coupe/",
  "https://www.classic.com/m/porsche/911/f-body/swb/912/targa/",
];

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

/** "$99,500*" → 99500 · "€78,500*" → 78500 · "Ask For Price" → undefined */
function parsePrice(s?: string): number | undefined {
  if (!s) return undefined;
  const digits = s.replace(/[^0-9.]/g, "");
  if (!digits) return undefined;
  const n = parseFloat(digits);
  return Number.isNaN(n) ? undefined : Math.round(n);
}

/** "5k mi" → 5000 · "205 mi" → 205 · "111k mi" → 111000 */
function parseMileage(s?: string): number | undefined {
  if (!s) return undefined;
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*(k)?/i);
  if (!m) return undefined;
  const n = parseFloat(m[1]) * (m[2] ? 1000 : 1);
  return Number.isNaN(n) ? undefined : Math.round(n);
}

function bodyFrom(title: string): CanonicalListing["body"] {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}

export function classicComMap(item: Raw): CanonicalListing | null {
  const title = str(item.title)?.trim();
  if (!title) return null;

  // US-focused marketplace: keep USA listings so prices stay USD.
  const location = str(item.location) ?? "";
  if (location && !/usa|united states/i.test(location)) return null;

  // Drop non-USD (EUR) rows outright: their prices use European "78.500"
  // grouping that parsePrice mangles into ~78, which would poison the USD
  // median. (Empty-location EUR listings otherwise slip past the filter above.)
  const rawPrice = str(item.price) ?? "";
  if (/€|eur|£|gbp/i.test(rawPrice)) return null;

  const price = parsePrice(rawPrice);
  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  // Drop "Ask For Price" / undated / implausibly low (parse-artifact) prices.
  if (!year || price == null || price < MIN_PLAUSIBLE_PRICE) return null;

  const family = classifyModelFamily(title);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const url = str(item.url) ?? "#";
  const [city, state] = location.split(",").map((s) => s.trim());
  const status = /sold/i.test(str(item.listing_status) ?? "") ? "sold" : "active";
  const primary = str(item.image_url);
  const photos = Array.isArray(item.image_urls)
    ? item.image_urls.filter((u): u is string => typeof u === "string")
    : primary
      ? [primary]
      : [];
  const now = new Date().toISOString();

  return {
    id: `classic-com:${url}`,
    source: str(item.seller) || "Classic.com",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status,
    year,
    modelFamily: family,
    trim: title.replace(/^\d{4}\s+porsche\s+/i, ""),
    body: bodyFrom(title),
    transmission: str(item.transmission) ?? "Unknown",
    mileage: parseMileage(str(item.mileage)),
    listingType: "dealer",
    sellerType: "dealer",
    price,
    currency: str(item.price)?.includes("€") ? "EUR" : "USD",
    city: city || undefined,
    state: state || undefined,
    photos,
    title,
  };
}

export const classicComConnector: ListingConnector = {
  meta: {
    id: "classic-com",
    name: "Classic.com",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:shahidirfan/classic-com-cars-scraper",
    notes: "Aggregator (1M+ listings). Runs on APIFY_TOKEN; one actor run per generation page.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("classic-com");

    const out: CanonicalListing[] = [];
    for (const startUrl of START_URLS) {
      try {
        const res = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              startUrl,
              result_type: "listings",
              results_wanted: 100,
              max_pages: 4,
              proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: [] },
            }),
          }
        );
        if (!res.ok) {
          console.error(`classic.com ${startUrl}: HTTP ${res.status}`);
          continue;
        }
        const data = (await res.json()) as unknown;
        const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];
        for (const it of items) {
          const mapped = classicComMap(it);
          if (mapped) out.push(mapped);
        }
      } catch (e) {
        console.error(`classic.com ${startUrl} failed:`, e);
      }
    }
    return out;
  },
};
