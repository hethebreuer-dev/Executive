// Bring a Trailer via a managed Apify scraping actor.
//
// BaT is the single biggest air-cooled source but has no public API. Rather than
// build + babysit our own scraper, we run a managed actor
// (apify.com/silentflow/bringatrailer-scraper) and normalize its output. This is
// the template for every "apify" / "scrape" tier source.
//
// Scaffold: the run logic is real, but field mapping needs to be pinned to the
// actor's actual output and BaT's model taxonomy before enabling. Flip
// `enabled` on once APIFY_TOKEN is set and `mapItem` is verified.

import type { CanonicalListing } from "../model";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";
import { classifyModelFamily } from "../normalize";

const ACTOR = "silentflow~bringatrailer-scraper";

// Shape is intentionally loose until pinned to the actor's real dataset schema.
interface ApifyItem {
  title?: string;
  url?: string;
  price?: number | string;
  year?: number | string;
  mileage?: number | string;
  location?: string;
  transmission?: string;
  vin?: string;
  images?: string[];
  soldAt?: string;
  [k: string]: unknown;
}

export const bringATrailerApify: ListingConnector = {
  meta: {
    id: "bring-a-trailer",
    name: "Bring a Trailer",
    tier: "apify",
    provides: ["listings", "comps"],
    enabled: false, // flip on once APIFY_TOKEN is set + mapItem verified
    ref: "apify:silentflow/bringatrailer-scraper",
    notes: "Managed Apify actor. Needs APIFY_TOKEN; sold results also feed comps.",
  } satisfies ConnectorMeta,

  async fetchListings(): Promise<CanonicalListing[]> {
    const token = process.env.APIFY_TOKEN;
    if (!token) throw new ConnectorNotImplemented("bring-a-trailer");

    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Actor-specific input — e.g. a search for air-cooled 911s.
        body: JSON.stringify({ search: "air-cooled 911", maxItems: 200 }),
      }
    );
    if (!res.ok) throw new Error(`BaT/Apify actor failed: ${res.status}`);
    const items = (await res.json()) as ApifyItem[];
    return items.map(mapItem).filter((x): x is CanonicalListing => x !== null);
  },
};

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function mapItem(item: ApifyItem): CanonicalListing | null {
  const title = (item.title ?? "").trim();
  const year = num(item.year);
  const price = num(item.price);
  if (!title || !year || price === undefined) return null;

  const family = classifyModelFamily(title);
  if (!family) return null; // not an air-cooled 911/912/930

  const [city, state] = (item.location ?? "").split(",").map((s) => s.trim());
  const now = new Date().toISOString();

  return {
    id: `bring-a-trailer:${item.url ?? title}`,
    source: "Bring a Trailer",
    sourceId: String(item.url ?? title),
    url: item.url ?? "#",
    firstSeen: now,
    lastSeen: now,
    status: item.soldAt ? "sold" : "active",
    year,
    modelFamily: family,
    trim: title.replace(/^\d{4}\s+/, ""),
    body: /targa/i.test(title) ? "Targa" : /cabriolet|cab\b/i.test(title) ? "Cabriolet" : "Coupe",
    transmission: item.transmission ?? "Unknown",
    vin: item.vin,
    mileage: num(item.mileage),
    listingType: "auction",
    sellerType: "auction",
    price,
    currency: "USD",
    city,
    state,
    photos: item.images ?? [],
    title,
  };
}
