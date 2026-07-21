// Connector #0 — seeded placeholder data. This is the current app's data,
// re-expressed in the canonical model so it flows through the same seam every
// real connector will. Swap it out (or run it alongside) as real sources land.

import type { CanonicalListing, SoldComp } from "../model";
import type {
  CompConnector,
  ConnectorMeta,
  ListingConnector,
} from "./connector";

const NOW = "2026-07-21T00:00:00.000Z";

function seed(
  n: number,
  data: Omit<CanonicalListing, "id" | "sourceId" | "url" | "firstSeen" | "lastSeen" | "status" | "currency" | "photos">
): CanonicalListing {
  const slug = data.source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: `${slug}:${n}`,
    sourceId: String(n),
    url: "#",
    firstSeen: NOW,
    lastSeen: NOW,
    status: "active",
    currency: "USD",
    photos: [],
    ...data,
  };
}

export const MOCK_LISTINGS: CanonicalListing[] = [
  seed(1, { source: "Broad Arrow", year: 1973, title: "911 Carrera RS 2.7", trim: "Carrera RS 2.7", modelFamily: "911", body: "Coupe", transmission: "5-spd manual", mileage: 42100, city: "Emory", state: "CA", listingType: "auction", sellerType: "auction", price: 875000, matchingNumbers: true, compDeltaPct: 6, caption: "Carrera RS — front 3/4", blurb: "Matching-numbers Lightweight in Grand Prix White with the signature Carrera script. Documented Emory refresh, ducktail intact." }),
  seed(2, { source: "RM Sotheby’s", year: 1997, title: "993 Carrera S", trim: "Carrera S", modelFamily: "993", body: "Coupe", transmission: "6-spd manual", mileage: 28500, city: "Denver", state: "CO", listingType: "auction", sellerType: "auction", price: 189000, compDeltaPct: 11, caption: "993 C2S — profile" }),
  seed(3, { source: "Bring a Trailer", year: 1989, title: "911 Carrera 3.2 (G50)", trim: "Carrera 3.2", modelFamily: "911", body: "Coupe", transmission: "5-spd G50", mileage: 61000, city: "Chicago", state: "IL", listingType: "auction", sellerType: "private", price: 89500, compDeltaPct: -3, caption: "Carrera 3.2 — rear 3/4" }),
  seed(4, { source: "Elferspot", year: 1987, title: "930 Turbo", trim: "Turbo", modelFamily: "930", body: "Coupe", transmission: "4-spd manual", mileage: 33900, city: "Miami", state: "FL", listingType: "dealer", sellerType: "dealer", price: 142000, compDeltaPct: 2, caption: "930 Turbo — whale tail" }),
  seed(5, { source: "PCARMARKET", year: 1994, title: "964 Carrera 2", trim: "Carrera 2", modelFamily: "964", body: "Coupe", transmission: "5-spd manual", mileage: 74200, city: "Portland", state: "OR", listingType: "auction", sellerType: "private", price: 78900, compDeltaPct: -1, caption: "964 C2 — front" }),
  seed(6, { source: "Cars & Bids", year: 1979, title: "911 SC", trim: "SC", modelFamily: "911", body: "Coupe", transmission: "5-spd 915", mileage: 88400, city: "Austin", state: "TX", listingType: "auction", sellerType: "private", price: 52000, compDeltaPct: 0, caption: "911 SC — profile" }),
  seed(7, { source: "Gooding & Co", year: 1991, title: "964 Turbo 3.3", trim: "Turbo 3.3", modelFamily: "964", body: "Coupe", transmission: "5-spd manual", mileage: 41600, city: "New York", state: "NY", listingType: "auction", sellerType: "auction", price: 265000, compDeltaPct: 8, caption: "964 Turbo — rear" }),
  seed(8, { source: "Hemmings", year: 1969, title: "912", trim: "912", modelFamily: "912", body: "Coupe", transmission: "5-spd manual", mileage: 102000, city: "Nashville", state: "TN", listingType: "classified", sellerType: "private", price: 46500, compDeltaPct: 4, caption: "912 — front 3/4" }),
  seed(9, { source: "Bring a Trailer", year: 1985, title: "911 Carrera Targa", trim: "Carrera", modelFamily: "911", body: "Targa", transmission: "5-spd 915", mileage: 79300, city: "Seattle", state: "WA", listingType: "auction", sellerType: "private", price: 58750, compDeltaPct: -2, caption: "Carrera Targa" }),
  seed(10, { source: "Broad Arrow", year: 1972, title: "911 T", trim: "T", modelFamily: "911", body: "Coupe", transmission: "5-spd 915", mileage: 65000, city: "Los Angeles", state: "CA", listingType: "auction", sellerType: "auction", price: 118000, compDeltaPct: 3, caption: "911 T — oil-flap" }),
  seed(11, { source: "Barrett-Jackson", year: 1998, title: "993 Turbo S", trim: "Turbo S", modelFamily: "993", body: "Coupe", transmission: "6-spd manual", mileage: 19800, city: "Scottsdale", state: "AZ", listingType: "auction", sellerType: "auction", price: 525000, compDeltaPct: 14, caption: "993 Turbo S" }),
  seed(12, { source: "Cars & Bids", year: 1976, title: "912E", trim: "912E", modelFamily: "912", body: "Coupe", transmission: "5-spd manual", mileage: 91200, city: "Boston", state: "MA", listingType: "auction", sellerType: "private", price: 39900, compDeltaPct: -4, caption: "912E — profile" }),
];

export const MOCK_COMPS: SoldComp[] = [
  { id: "bat:rs27-1", source: "Bring a Trailer", modelFamily: "911", trim: "Carrera RS 2.7", year: 1973, soldPrice: 868000, soldAt: "2026-01-15", mileage: 38000 },
  { id: "gooding:rs27-1", source: "Gooding & Co", modelFamily: "911", trim: "Carrera RS 2.7", year: 1973, soldPrice: 842000, soldAt: "2026-05-02", mileage: 51000 },
  { id: "classic:993cs-1", source: "Classic.com", modelFamily: "993", trim: "Carrera S", year: 1997, soldPrice: 182500, soldAt: "2026-07-18", mileage: 31200 },
  { id: "bat:g50-1", source: "Bring a Trailer", modelFamily: "911", trim: "Carrera 3.2", year: 1989, soldPrice: 94000, soldAt: "2026-07-16", mileage: 58900 },
  { id: "pcar:930-1", source: "PCARMARKET", modelFamily: "930", trim: "Turbo", year: 1987, soldPrice: 149750, soldAt: "2026-07-15", mileage: 44100 },
  { id: "bat:964c2-1", source: "Bring a Trailer", modelFamily: "964", trim: "Carrera 2", year: 1994, soldPrice: 76250, soldAt: "2026-07-11", mileage: 71800 },
];

export const mockConnector: ListingConnector & CompConnector = {
  meta: {
    id: "mock",
    name: "LUFT Mock",
    tier: "mock",
    provides: ["listings", "comps"],
    enabled: true,
    notes: "Seeded placeholder data — connector #0. Remove once real sources cover the catalog.",
  } satisfies ConnectorMeta,
  async fetchListings() {
    return MOCK_LISTINGS;
  },
  async fetchComps() {
    return MOCK_COMPS;
  },
};
