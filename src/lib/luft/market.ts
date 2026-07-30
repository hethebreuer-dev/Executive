// Live-market helpers derived from current asking-price inventory.
//
// LUFT has no sold-price history (Classic.com gates that behind a paywall), so
// every figure here is computed from the live listings we actually hold: median
// asking price, count, and range per generation. Honest and recomputed each
// request. If a real sold-comp source lands later, these can be swapped for
// trailing-sold stats without touching the pages that consume them.

import { MODEL_DEFS, type Listing, type ModelKey } from "@/lib/luft";

export function medianOf(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/** Recompute each listing's delta as % vs the median asking price of its own
 *  generation — a real "vs market" signal (replaces the seed compDeltaPct). */
export function withMarketDelta(listings: Listing[]): Listing[] {
  const pricesByKey = new Map<string, number[]>();
  for (const l of listings) {
    const arr = pricesByKey.get(l.key) ?? [];
    arr.push(l.price);
    pricesByKey.set(l.key, arr);
  }
  const medianByKey = new Map<string, number>();
  for (const [k, arr] of pricesByKey) medianByKey.set(k, medianOf(arr));
  return listings.map((l) => {
    const med = medianByKey.get(l.key) ?? 0;
    const delta = med ? Math.round(((l.price - med) / med) * 100) : 0;
    return { ...l, delta };
  });
}

export interface GenSummary {
  key: ModelKey;
  label: string;
  count: number;
  median: number;
  min: number;
  max: number;
  avg: number;
}

/** Per-generation asking-price summary (plus an "all" row), in MODEL_DEFS order. */
export function marketSummary(listings: Listing[]): GenSummary[] {
  return MODEL_DEFS.map(({ key, label }) => {
    const subset =
      key === "all" ? listings : listings.filter((l) => l.key === key);
    const prices = subset.map((l) => l.price);
    return {
      key,
      label,
      count: subset.length,
      median: medianOf(prices),
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
      avg: prices.length
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0,
    };
  });
}
