// Normalization helpers shared by connectors: classify a raw title into a
// canonical model family, and dedupe records that appear on multiple sources.

import type { CanonicalListing, ModelFamily } from "./model";

/**
 * Best-effort model-family classifier from a listing title. Deliberately
 * conservative — returns null for anything that isn't clearly an air-cooled
 * 911/912/930 so noisy classified sources don't pollute the catalog. Refine per
 * source as real data comes in.
 */
export function classifyModelFamily(title: string): ModelFamily | null {
  const t = title.toLowerCase();
  const year = Number(t.match(/\b(19\d{2})\b/)?.[1]);

  if (/\b912e?\b/.test(t)) return "912";
  if (/\b930\b/.test(t) || (/\bturbo\b/.test(t) && year >= 1975 && year <= 1989)) return "930";
  if (/\b993\b/.test(t)) return "993";
  if (/\b964\b/.test(t)) return "964";
  if (/\b911\b|\bcarrera\b|\b\bsc\b\b|\brs\b|\bslant\s?nose\b/.test(t)) {
    // 911 family is air-cooled only through 1998; guard against 996+.
    if (year && year > 1998) return null;
    return "911";
  }
  return null;
}

/** VIN when present, else a fuzzy identity so re-listings across sources merge. */
export function dedupeKey(l: CanonicalListing): string {
  if (l.vin) return `vin:${l.vin.toUpperCase()}`;
  return [
    l.year,
    l.modelFamily,
    l.trim.toLowerCase().replace(/\s+/g, ""),
    l.exteriorColor?.toLowerCase().replace(/\s+/g, "") ?? "",
    l.mileage != null ? Math.round(l.mileage / 1000) : "",
    l.state ?? "",
  ].join("|");
}

/**
 * Collapse duplicate cars that appear on several sources. Keeps the record with
 * the most complete data (photos + VIN as a rough completeness proxy), recording
 * the freshest `lastSeen`.
 */
export function dedupeListings(listings: CanonicalListing[]): CanonicalListing[] {
  const byKey = new Map<string, CanonicalListing>();
  for (const l of listings) {
    const key = dedupeKey(l);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, l);
      continue;
    }
    const score = (x: CanonicalListing) => (x.vin ? 2 : 0) + Math.min(x.photos.length, 8);
    const winner = score(l) >= score(existing) ? l : existing;
    winner.lastSeen =
      l.lastSeen > existing.lastSeen ? l.lastSeen : existing.lastSeen;
    byKey.set(key, winner);
  }
  return [...byKey.values()];
}
