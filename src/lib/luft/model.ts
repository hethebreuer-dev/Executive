// Canonical LUFT data model — the shape every connector normalizes to and the
// only shape the app/repository speak. Source-specific quirks stay inside
// connectors; everything downstream reads these types.

export type ModelFamily = "912" | "911" | "930" | "964" | "993";
export type BodyStyle = "Coupe" | "Targa" | "Cabriolet";
export type ListingType = "auction" | "bin" | "classified" | "dealer";
export type SellerType = "private" | "dealer" | "auction";
export type ListingStatus = "active" | "sold" | "withdrawn";

/** A live/active-inventory record (the Listings pipeline). */
export interface CanonicalListing {
  // Identity ----------------------------------------------------------------
  /** Stable canonical id, e.g. "broad-arrow:lot-0473". */
  id: string;
  /** Human source name, e.g. "Broad Arrow". */
  source: string;
  /** Id within the source. */
  sourceId: string;
  /** Deep link back to the source listing. */
  url: string;
  firstSeen: string; // ISO 8601
  lastSeen: string; // ISO 8601
  status: ListingStatus;

  // Vehicle -----------------------------------------------------------------
  year: number;
  modelFamily: ModelFamily;
  /** Marketing trim, e.g. "Carrera RS 2.7", "SC", "Turbo 3.3". */
  trim: string;
  body: BodyStyle;
  transmission: string;

  // Provenance --------------------------------------------------------------
  vin?: string;
  matchingNumbers?: boolean;
  mileage?: number;
  exteriorColor?: string;
  interiorColor?: string;

  // Commerce ----------------------------------------------------------------
  listingType: ListingType;
  sellerType: SellerType;
  /** Ask price (or current bid) in `currency`. */
  price: number;
  currency: string; // "USD"
  endsAt?: string; // ISO — auctions
  city?: string;
  state?: string;

  /** % vs comp median; computed by the comps pipeline (positive = above). */
  compDeltaPct?: number;

  // Media / presentation ----------------------------------------------------
  photos: string[];
  title: string; // "911 Carrera RS 2.7"
  caption?: string;
  blurb?: string;
}

/** A verified sold result (the Comps pipeline — powers medians/trend/bands). */
export interface SoldComp {
  id: string;
  source: string;
  modelFamily: ModelFamily;
  trim: string;
  year: number;
  soldPrice: number;
  soldAt: string; // ISO 8601
  mileage?: number;
  url?: string;
}

export type ListingSort =
  | "relevance"
  | "value"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "year-asc";

export interface ListingQuery {
  modelFamily?: ModelFamily | "all";
  body?: BodyStyle[];
  minPrice?: number;
  maxPrice?: number;
  transmission?: string[];
  status?: ListingStatus;
  sort?: ListingSort;
  limit?: number;
  offset?: number;
}

/** A seller's own listing, as shown in their account (any moderation status). */
export interface SellerListing {
  id: string;
  title: string;
  year: number;
  modelFamily: ModelFamily;
  price: number;
  status: string; // active (live) | pending (in review) | withdrawn
  photos: string[];
  city?: string;
  state?: string;
  submittedAt?: string;
}

/** Aggregate market figures derived from listings + comps. */
export interface MarketStats {
  count: number;
  median: number;
  /** e.g. "↑ 4.8% / 90d" — placeholder until the comps pipeline is live. */
  trendLabel: string;
}
