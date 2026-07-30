// Classic.com via the shahidirfan/classic-com-cars-scraper Apify actor.
//
// Classic.com is an aggregator (1M+ listings across auctions + dealers), and
// this actor scrapes it cleanly (unlike BaT, which hard-blocks scrapers). This
// is the MVP data source. Output mapper is pinned to the actor's real fields
// (see a sample item below); US listings only, priced ones only.

import type { CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import type { ApifySiteConfig } from "./apify";

type Raw = Record<string, unknown>;

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

export function classicComMap(item: Raw, cfg: ApifySiteConfig): CanonicalListing | null {
  const title = str(item.title)?.trim();
  if (!title) return null;

  // US-focused marketplace: keep USA listings so prices stay USD.
  const location = str(item.location) ?? "";
  if (location && !/usa|united states/i.test(location)) return null;

  const price = parsePrice(str(item.price));
  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || price == null) return null; // drop "Ask For Price" / undated

  const family = classifyModelFamily(title);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const url = str(item.url) ?? "#";
  const [city, state] = location.split(",").map((s) => s.trim());
  const status = /sold/i.test(str(item.listing_status) ?? "") ? "sold" : "active";
  const primary = str(item.image_url);
  const photos = Array.isArray(item.image_urls)
    ? (item.image_urls.filter((u): u is string => typeof u === "string"))
    : primary
      ? [primary]
      : [];
  const now = new Date().toISOString();

  return {
    id: `classic-com:${url}`,
    // Classic.com aggregates dealers/auctions; surface the seller as the source.
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
    listingType: cfg.listingType ?? "dealer",
    sellerType: cfg.sellerType ?? "dealer",
    price,
    currency: str(item.price)?.includes("€") ? "EUR" : "USD",
    city: city || undefined,
    state: state || undefined,
    photos,
    title,
  };
}

export const classicComSite: ApifySiteConfig = {
  id: "classic-com",
  name: "Classic.com",
  actorId: "shahidirfan/classic-com-cars-scraper",
  actorEnv: "APIFY_ACTOR_CLASSIC_COM",
  // Best-effort input — the actor's log confirms `requestedResults` + `maxPages`;
  // the search key is sent under several likely names (actors ignore unknowns).
  input: {
    search: "Porsche 911",
    query: "Porsche 911",
    keyword: "Porsche 911",
    keywords: "Porsche 911",
    searchTerm: "Porsche 911",
    requestedResults: 120,
    maxResults: 120,
    maxItems: 120,
    maxPages: 6,
  },
  listingType: "dealer",
  sellerType: "dealer",
  map: classicComMap,
};
