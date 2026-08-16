// Normalization helpers shared by connectors: classify a raw title into a
// canonical model family, and dedupe records that appear on multiple sources.

import type { BodyStyle, CanonicalListing, ModelFamily } from "./model";

/**
 * Best-effort model-family classifier from a listing title (plus an optional
 * reliable year when the caller has one). Deliberately conservative — returns
 * null for anything that isn't clearly an air-cooled 911/912/930.
 *
 * An explicit chassis code always wins, but most real listings just say
 * "911 Carrera" with no code, so for the naturally-aspirated 911 lineage we
 * fall back to the YEAR to pick the generation (964 ≈ 1990–1994, 993 ≈
 * 1995–1998, everything earlier is the G-body / SC / Carrera "911" bucket).
 * Without this, 964s and 993s all collapsed into the "911" bucket.
 */
export function classifyModelFamily(title: string, yearHint?: number): ModelFamily | null {
  const t = title.toLowerCase();
  const year = yearHint || Number(t.match(/\b(19\d{2})\b/)?.[1]) || 0;

  // Explicit chassis codes win outright.
  if (/\b912e?\b/.test(t)) return "912";
  if (/\b964\b/.test(t)) return "964";
  if (/\b993\b/.test(t)) return "993";
  if (/\b930\b/.test(t)) return "930";
  // Air-cooled Turbo of the G-body era, when no chassis code is given → 930.
  if (/\bturbo\b/.test(t) && year >= 1975 && year <= 1989) return "930";

  const is911 =
    /\b911\b|\bcarrera\b|\bsc\b|\brs\b|\btarga\b|\bspeedster\b|\bslant\s?nose\b/.test(t);
  if (!is911) return null;
  if (year > 1998) return null; // 996+ is water-cooled
  if (year >= 1995) return "993";
  if (year >= 1990) return "964";
  return "911"; // 1965–1989 (long-hood + G-body / SC / Carrera 3.2), and unknown year
}

/**
 * Body style from a title. Returns null when the title doesn't state one, so the
 * caller can keep whatever it already had rather than wrongly defaulting an
 * unstated body to Coupe.
 */
export function classifyBody(title: string): BodyStyle | null {
  const t = title.toLowerCase();
  if (/\btarga\b/.test(t)) return "Targa";
  if (/cabriolet|convertible|\bcabrio\b|\bcab\b|speedster|spyder|\bcab\.?\b/.test(t))
    return "Cabriolet";
  if (/\bcoupe\b|\bcoupé\b/.test(t)) return "Coupe";
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
