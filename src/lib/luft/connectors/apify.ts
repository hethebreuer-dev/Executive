// Generic Apify-actor connector. One factory drives every "apify" source: point
// it at an actor id, and it runs the actor and maps its dataset to canonical
// listings. Actor outputs vary, so the mapper is deliberately tolerant — it
// probes many common field names. Once we see a given actor's real output we can
// tighten it via a per-site `map` override, but the defaults get us listings
// without bespoke code per site.

import type {
  BodyStyle,
  CanonicalListing,
  ListingType,
  SellerType,
} from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

export interface ApifySiteConfig {
  /** Connector slug, e.g. "cars-and-bids". */
  id: string;
  /** Display source name, e.g. "Cars & Bids". */
  name: string;
  /** Apify actor id, "user/actor" or "user~actor". Empty = not wired yet. */
  actorId: string;
  /** Env/secret name that overrides actorId at runtime, e.g.
   * "APIFY_ACTOR_CARS_AND_BIDS" — lets you wire a site from the dashboard
   * (Worker secret) without a code change. */
  actorEnv?: string;
  /** Actor input (search terms, limits…). Actor-specific. */
  input?: Raw;
  /** Default when the item doesn't say. */
  listingType?: ListingType;
  sellerType?: SellerType;
  /** Turn on in the registry. Defaults to whether an actorId is set. */
  enabled?: boolean;
  /** Optional per-actor override once its output schema is known. */
  map?: (item: Raw, cfg: ApifySiteConfig) => CanonicalListing | null;
}

function resolveActor(ctx: { env: (k: string) => string | undefined }, cfg: ApifySiteConfig): string {
  return (cfg.actorEnv ? ctx.env(cfg.actorEnv) : undefined) || cfg.actorId || "";
}

export function makeApifyConnector(cfg: ApifySiteConfig): ListingConnector {
  return {
    meta: {
      id: cfg.id,
      name: cfg.name,
      tier: "apify",
      provides: ["listings"],
      // Turned on in the registry; isConfigured gates on token + a resolved actor.
      enabled: cfg.enabled ?? true,
      ref: cfg.actorId ? `apify:${cfg.actorId}` : `apify:(set ${cfg.actorEnv ?? "actorId"})`,
      notes: "Managed Apify actor. Needs APIFY_TOKEN + an actor id (config or the actorEnv secret).",
    } satisfies ConnectorMeta,

    isConfigured(ctx) {
      return Boolean(ctx.env("APIFY_TOKEN") && resolveActor(ctx, cfg));
    },

    async fetchListings(ctx): Promise<CanonicalListing[]> {
      const token = ctx.env("APIFY_TOKEN");
      const actorId = resolveActor(ctx, cfg);
      if (!token || !actorId) throw new ConnectorNotImplemented(cfg.id);

      const actor = actorId.replace("/", "~");
      const res = await fetch(
        `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(cfg.input ?? {}),
        }
      );
      if (!res.ok) throw new Error(`Apify actor ${actorId} failed: ${res.status}`);

      const data = (await res.json()) as unknown;
      const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];
      const map = cfg.map ?? guessCanonical;
      return items
        .map((it) => map(it, cfg))
        .filter((x): x is CanonicalListing => x !== null);
    },
  };
}

// --- tolerant field extraction ----------------------------------------------
function pick(item: Raw, keys: string[]): unknown {
  for (const k of keys) {
    if (item[k] != null && item[k] !== "") return item[k];
    // case-insensitive fallback
    const hit = Object.keys(item).find((ik) => ik.toLowerCase() === k.toLowerCase());
    if (hit && item[hit] != null && item[hit] !== "") return item[hit];
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : v == null ? undefined : String(v);
}

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function toPhotos(v: unknown): string[] {
  if (!Array.isArray(v)) return typeof v === "string" ? [v] : [];
  return v
    .map((x) => (typeof x === "string" ? x : str((x as Raw)?.url ?? (x as Raw)?.src ?? (x as Raw)?.imageUrl)))
    .filter((u): u is string => Boolean(u));
}

function bodyFrom(title: string): BodyStyle {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}

/** Best-effort generic mapper across unknown Apify actor outputs. */
export function guessCanonical(item: Raw, cfg: ApifySiteConfig): CanonicalListing | null {
  const title = (str(pick(item, ["title", "name", "listingTitle", "heading", "headline", "vehicleTitle"])) ?? "").trim();
  const priceRaw = pick(item, ["price", "soldPrice", "sold_price", "sellingPrice", "soldFor", "salePrice", "currentBid", "current_bid", "finalBid", "winningBid", "highBid", "bidAmount", "askingPrice", "buyItNowPrice", "priceUsd", "amount", "bid"]);
  const price = num(priceRaw);
  const year = num(pick(item, ["year", "modelYear", "model_year"])) ?? num(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!title || !year || price == null) return null;

  const family = classifyModelFamily(title);
  if (!family) return null; // keep it air-cooled 911/912/930 only

  const url = str(pick(item, ["url", "link", "listingUrl", "listing_url", "detailUrl", "sourceUrl", "auctionUrl", "permalink", "href"])) ?? "#";
  const sourceId = str(pick(item, ["id", "listingId", "lotId", "slug", "vin"])) ?? url;
  const location = str(pick(item, ["location", "city", "region", "sellerLocation"])) ?? "";
  const [city, state] = location.split(",").map((s) => s.trim());
  // Conservative sold detection — default to active so live cars show; refine
  // once we've seen the actor's real output fields.
  const soldAt = str(pick(item, ["soldAt", "sold_at", "soldDate"]));
  const now = new Date().toISOString();

  return {
    id: `${cfg.id}:${sourceId}`,
    source: cfg.name,
    sourceId,
    url,
    firstSeen: now,
    lastSeen: now,
    status: soldAt ? "sold" : "active",
    year,
    modelFamily: family,
    trim: title.replace(/^\d{4}\s+(porsche\s+)?/i, ""),
    body: bodyFrom(title),
    transmission:
      str(pick(item, ["transmission", "gearbox"])) ??
      (/automatic|tiptronic|sportomatic/i.test(title) ? "Automatic" : /manual|\d-spd|\d-speed/i.test(title) ? "Manual" : "Unknown"),
    vin: str(pick(item, ["vin", "chassis"])),
    mileage: num(pick(item, ["mileage", "miles", "odometer"])),
    exteriorColor: str(pick(item, ["exteriorColor", "color", "paint"])),
    listingType: cfg.listingType ?? (priceRaw != null && String(pick(item, ["currentBid", "bid"]) ?? "") !== "" ? "auction" : "classified"),
    sellerType: cfg.sellerType ?? "dealer",
    price,
    currency: str(pick(item, ["currency"])) ?? "USD",
    endsAt: str(pick(item, ["endsAt", "endDate", "auctionEnd"])),
    city: city || undefined,
    state: state || undefined,
    photos: toPhotos(pick(item, ["images", "photos", "imageUrls", "image_urls", "photoUrls", "imageLinks", "gallery", "media", "mainImage", "image", "thumbnail"])),
    title: title.replace(/^\d{4}\s+/, `${year} `),
  };
}
