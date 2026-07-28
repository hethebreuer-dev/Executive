// D1-backed read repository. The Cloudflare Worker ingests into D1; the app
// reads it here via D1's HTTP query API, so this works from any runtime (Node,
// Vercel, or Cloudflare). Filtering/sorting/pagination reuse the shared query
// helpers, so behavior matches the in-memory repository exactly.

import type {
  CanonicalListing,
  ListingQuery,
  MarketStats,
  ModelFamily,
  SoldComp,
} from "./model";
import {
  applyQuery,
  median,
  type ListingRepository,
} from "./repository";

export interface D1Config {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

interface D1Row {
  id: string;
  source: string;
  source_id: string;
  url: string;
  first_seen: string;
  last_seen: string;
  status: string;
  year: number;
  model_family: string;
  trim: string;
  body: string;
  transmission: string;
  vin: string | null;
  matching_numbers: number | null;
  mileage: number | null;
  exterior_color: string | null;
  interior_color: string | null;
  listing_type: string;
  seller_type: string;
  price: number;
  currency: string;
  ends_at: string | null;
  city: string | null;
  state: string | null;
  comp_delta_pct: number | null;
  photos: string | null;
  title: string;
  caption: string | null;
  blurb: string | null;
}

interface CompRow {
  id: string;
  source: string;
  model_family: string;
  trim: string;
  year: number;
  sold_price: number;
  sold_at: string;
  mileage: number | null;
  url: string | null;
}

export class D1Repository implements ListingRepository {
  constructor(private readonly cfg: D1Config) {}

  private async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.cfg.accountId}/d1/database/${this.cfg.databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.cfg.apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      }
    );
    if (!res.ok) throw new Error(`D1 query failed: ${res.status}`);
    const json = (await res.json()) as {
      success: boolean;
      result?: { results?: T[] }[];
      errors?: unknown[];
    };
    if (!json.success) throw new Error(`D1 query error: ${JSON.stringify(json.errors)}`);
    return json.result?.[0]?.results ?? [];
  }

  async listListings(query: ListingQuery = {}) {
    const rows = await this.query<D1Row>(
      "SELECT * FROM listings WHERE status = ?",
      [query.status ?? "active"]
    );
    return applyQuery(rows.map(rowToListing), query);
  }

  async getListing(id: string) {
    const rows = await this.query<D1Row>("SELECT * FROM listings WHERE id = ? LIMIT 1", [id]);
    return rows.length ? rowToListing(rows[0]) : null;
  }

  async listComps(family: ModelFamily | "all" = "all") {
    const rows =
      family === "all"
        ? await this.query<CompRow>("SELECT * FROM sold_comps")
        : await this.query<CompRow>("SELECT * FROM sold_comps WHERE model_family = ?", [family]);
    return rows.map(rowToComp);
  }

  async marketStats(family: ModelFamily | "all" = "all"): Promise<MarketStats> {
    const { items, total } = await this.listListings({ modelFamily: family });
    return {
      count: total,
      median: median(items.map((l) => l.price)),
      trendLabel: "↑ 4.8% / 90d",
    };
  }
}

function rowToListing(r: D1Row): CanonicalListing {
  return {
    id: r.id,
    source: r.source,
    sourceId: r.source_id,
    url: r.url,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen,
    status: r.status as CanonicalListing["status"],
    year: r.year,
    modelFamily: r.model_family as ModelFamily,
    trim: r.trim,
    body: r.body as CanonicalListing["body"],
    transmission: r.transmission,
    vin: r.vin ?? undefined,
    matchingNumbers: r.matching_numbers == null ? undefined : Boolean(r.matching_numbers),
    mileage: r.mileage ?? undefined,
    exteriorColor: r.exterior_color ?? undefined,
    interiorColor: r.interior_color ?? undefined,
    listingType: r.listing_type as CanonicalListing["listingType"],
    sellerType: r.seller_type as CanonicalListing["sellerType"],
    price: r.price,
    currency: r.currency,
    endsAt: r.ends_at ?? undefined,
    city: r.city ?? undefined,
    state: r.state ?? undefined,
    compDeltaPct: r.comp_delta_pct ?? undefined,
    photos: r.photos ? (JSON.parse(r.photos) as string[]) : [],
    title: r.title,
    caption: r.caption ?? undefined,
    blurb: r.blurb ?? undefined,
  };
}

function rowToComp(r: CompRow): SoldComp {
  return {
    id: r.id,
    source: r.source,
    modelFamily: r.model_family as ModelFamily,
    trim: r.trim,
    year: r.year,
    soldPrice: r.sold_price,
    soldAt: r.sold_at,
    mileage: r.mileage ?? undefined,
    url: r.url ?? undefined,
  };
}
