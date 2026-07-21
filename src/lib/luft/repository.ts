// Repository — the single seam the app reads through. Today it aggregates
// in-memory connectors; swap InMemoryRepository for a Postgres-backed one (fed
// by the ingestion workers) without touching a single page or API route.

import {
  providesComps,
  providesListings,
} from "./connectors/connector";
import type {
  CanonicalListing,
  ListingQuery,
  MarketStats,
  ModelFamily,
  SoldComp,
} from "./model";
import { dedupeListings } from "./normalize";
import { activeConnectors } from "./registry";

export interface ListingRepository {
  listListings(query?: ListingQuery): Promise<{ items: CanonicalListing[]; total: number }>;
  getListing(id: string): Promise<CanonicalListing | null>;
  listComps(family?: ModelFamily | "all"): Promise<SoldComp[]>;
  marketStats(family?: ModelFamily | "all"): Promise<MarketStats>;
}

function sortListings(items: CanonicalListing[], sort: ListingQuery["sort"]): CanonicalListing[] {
  const out = [...items];
  const delta = (l: CanonicalListing) => l.compDeltaPct ?? 0;
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "year-desc":
      return out.sort((a, b) => b.year - a.year);
    case "year-asc":
      return out.sort((a, b) => a.year - b.year);
    case "value":
      return out.sort((a, b) => delta(a) - delta(b));
    default: // relevance
      return out.sort((a, b) => delta(b) - delta(a));
  }
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

class InMemoryRepository implements ListingRepository {
  private async allListings(): Promise<CanonicalListing[]> {
    const results = await Promise.all(
      activeConnectors()
        .filter(providesListings)
        .map(async (c) => {
          try {
            return await c.fetchListings();
          } catch {
            // A broken/unconfigured connector must never take the catalog down.
            return [];
          }
        })
    );
    return dedupeListings(results.flat());
  }

  async listListings(query: ListingQuery = {}) {
    let items = await this.allListings();
    const status = query.status ?? "active";
    items = items.filter((l) => l.status === status);

    if (query.modelFamily && query.modelFamily !== "all") {
      items = items.filter((l) => l.modelFamily === query.modelFamily);
    }
    if (query.body?.length) {
      items = items.filter((l) => query.body!.includes(l.body));
    }
    if (query.transmission?.length) {
      items = items.filter((l) => query.transmission!.includes(l.transmission));
    }
    if (query.minPrice != null) items = items.filter((l) => l.price >= query.minPrice!);
    if (query.maxPrice != null) items = items.filter((l) => l.price <= query.maxPrice!);

    items = sortListings(items, query.sort);
    const total = items.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? total;
    return { items: items.slice(offset, offset + limit), total };
  }

  async getListing(id: string) {
    const items = await this.allListings();
    return items.find((l) => l.id === id) ?? null;
  }

  async listComps(family: ModelFamily | "all" = "all") {
    const results = await Promise.all(
      activeConnectors()
        .filter(providesComps)
        .map(async (c) => {
          try {
            return await c.fetchComps();
          } catch {
            return [];
          }
        })
    );
    const comps = results.flat();
    return family === "all" ? comps : comps.filter((c) => c.modelFamily === family);
  }

  async marketStats(family: ModelFamily | "all" = "all"): Promise<MarketStats> {
    const { items, total } = await this.listListings({ modelFamily: family });
    return {
      count: total,
      median: median(items.map((l) => l.price)),
      // Placeholder until the comps pipeline computes real trailing-90d trend.
      trendLabel: "↑ 4.8% / 90d",
    };
  }
}

/** App-wide repository singleton. Point this at a DB-backed impl in Phase 1+. */
export const repository: ListingRepository = new InMemoryRepository();
