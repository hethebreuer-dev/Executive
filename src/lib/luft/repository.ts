// Repository — the single seam the app reads through. The in-memory impl
// aggregates connectors live; the D1 impl (repository-d1.ts) reads pre-ingested
// rows. `getRepository()` picks one from the environment. Swapping never touches
// a page or API route.

import {
  providesComps,
  providesListings,
} from "./connectors/connector";
import type { ConnectorContext } from "./connectors/context";
import { nodeContext } from "./connectors/context-node";
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

// --- shared query helpers (used by both in-memory and D1 impls) --------------
export function sortListings(
  items: CanonicalListing[],
  sort: ListingQuery["sort"]
): CanonicalListing[] {
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

export function applyQuery(all: CanonicalListing[], query: ListingQuery = {}) {
  let items = all.filter((l) => l.status === (query.status ?? "active"));
  if (query.modelFamily && query.modelFamily !== "all") {
    items = items.filter((l) => l.modelFamily === query.modelFamily);
  }
  if (query.body?.length) items = items.filter((l) => query.body!.includes(l.body));
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

export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// --- in-memory: aggregate connectors live ------------------------------------
export class InMemoryRepository implements ListingRepository {
  constructor(private readonly ctx: ConnectorContext = nodeContext()) {}

  private async allListings(): Promise<CanonicalListing[]> {
    const results = await Promise.all(
      activeConnectors(this.ctx)
        .filter(providesListings)
        .map(async (c) => {
          try {
            return await c.fetchListings(this.ctx);
          } catch {
            // A broken/unconfigured connector must never take the catalog down.
            return [];
          }
        })
    );
    return dedupeListings(results.flat());
  }

  async listListings(query: ListingQuery = {}) {
    return applyQuery(await this.allListings(), query);
  }

  async getListing(id: string) {
    return (await this.allListings()).find((l) => l.id === id) ?? null;
  }

  async listComps(family: ModelFamily | "all" = "all") {
    const results = await Promise.all(
      activeConnectors(this.ctx)
        .filter(providesComps)
        .map(async (c) => {
          try {
            return await c.fetchComps(this.ctx);
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
