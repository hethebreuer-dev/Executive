// LUFT shared data + helpers (the legacy UI-facing shape).
//
// `LISTINGS` is now DERIVED from the mock connector (connector #0) — see
// src/lib/luft/. Real data flows through the same canonical model + repository
// seam; the mock is just the first connector. Figures (214 listings, $95k
// median, 12,400 comps, "↑ 4.8% / 90d") remain placeholders until the ingestion
// pipelines are live. See docs/DATA_ARCHITECTURE.md.

import { MOCK_LISTINGS } from "@/lib/luft/connectors/mock-connector";
import type { CanonicalListing } from "@/lib/luft/model";

export const TAGLINE = "Buy. Sell. Breathe air-cooled.";
export const DISCLAIMER = "Not affiliated with Dr. Ing. h.c. F. Porsche AG";
export const SOURCES_LINE = "Aggregated from 40+ US sources";

export type ModelKey = "all" | "911" | "912" | "930" | "964" | "993";

export const MODEL_DEFS: { key: ModelKey; label: string }[] = [
  { key: "all", label: "All air-cooled" },
  { key: "911", label: "911 / SC / Carrera" },
  { key: "912", label: "912" },
  { key: "930", label: "930 Turbo" },
  { key: "964", label: "964" },
  { key: "993", label: "993" },
];

export type Listing = {
  id: number;
  canonicalId: string;
  year: number;
  title: string;
  key: Exclude<ModelKey, "all">;
  price: number;
  miles: number;
  trans: string;
  body: string;
  city: string;
  state: string;
  source: string;
  delta: number; // % vs comps
  caption: string;
  blurb: string;
  url: string; // source listing URL ("#" for mock)
  photos: string[];
  listedAt: string; // ISO — when the car first appeared in our inventory (firstSeen)
};

/** Map a canonical listing down to the legacy UI shape. */
export function toLegacyListing(c: CanonicalListing, i: number): Listing {
  return {
    id: i + 1,
    canonicalId: c.id,
    year: c.year,
    title: c.title,
    key: c.modelFamily,
    price: c.price,
    miles: c.mileage ?? 0,
    trans: c.transmission,
    body: c.body,
    city: c.city ?? "",
    state: c.state ?? "",
    source: c.source,
    delta: c.compDeltaPct ?? 0,
    caption: c.caption ?? "",
    blurb: c.blurb ?? "",
    url: c.url,
    photos: c.photos ?? [],
    listedAt: c.firstSeen,
  };
}

/** Where a listing card should link: out to the source when it's a real URL,
 * otherwise the internal detail page (used by the mock seed). */
export function listingHref(l: Pick<Listing, "url" | "id" | "canonicalId">): {
  href: string;
  external: boolean;
} {
  if (l.url && /^https?:\/\//i.test(l.url)) return { href: l.url, external: true };
  // Internal detail page keyed by the stable canonical id (e.g. "user:abc123"),
  // not the per-render numeric id.
  return { href: `/listing/${encodeURIComponent(l.canonicalId)}`, external: false };
}

export const LISTINGS: Listing[] = MOCK_LISTINGS.map(toLegacyListing);

export const GENERATIONS = [
  { key: "912", label: "912", years: "1965–1976", from: "from $38k", img: "/luft/gen-912.jpg" },
  { key: "911", label: "911 · SC · Carrera", years: "1965–1989", from: "from $48k", img: "/luft/gen-911.jpg" },
  { key: "930", label: "930 Turbo", years: "1975–1989", from: "from $120k", img: "/luft/gen-930.jpg" },
  { key: "964", label: "964", years: "1989–1994", from: "from $70k", img: "/luft/gen-964.jpg" },
  { key: "993", label: "993", years: "1994–1998", from: "from $95k", img: "/luft/gen-993.jpg" },
];

export const usd = (n: number) => "$" + n.toLocaleString("en-US");
// Compact price: millions roll up to "$X.XM" (trailing .0 dropped), thousands to
// "$Xk". Without the millions case a $2,400,000 car rendered as "$2400k".
export const usdk = (n: number) => {
  if (n < 1000) return "$" + n;
  const k = Math.round(n / 1000);
  if (k >= 1000) {
    const m = Math.round(n / 100_000) / 10; // one decimal
    return "$" + (Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)) + "M";
  }
  return "$" + k + "k";
};
export const miles = (n: number) => n.toLocaleString("en-US") + " mi";

export function deltaText(d: number) {
  return d > 0 ? "+" + d + "% vs market" : d < 0 ? d + "% vs market" : "At market";
}
export function deltaColor(d: number) {
  return d > 0 ? "#0d0d0d" : d < 0 ? "#7a7a76" : "#9a9a95";
}
