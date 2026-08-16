// eBay Motors via the official Browse API — the cleanest first live source
// (sanctioned OAuth API, no scraping). Self-enables when credentials are present
// in the context:
//
//   EBAY_APP_ID       eBay developer App ID   (OAuth client_id)
//   EBAY_CERT_ID      eBay developer Cert ID  (OAuth client_secret)
//   EBAY_ENV          "production" (default) | "sandbox"
//   EBAY_MARKETPLACE  marketplace id, default "EBAY_US"
//
// Get credentials at https://developer.ebay.com → create a keyset. Browse API
// returns ACTIVE listings only (auction + Buy-It-Now); sold results for the
// comps pipeline come from a separate source (Classic.com / Hagerty / BaT sold).

import { MIN_PLAUSIBLE_PRICE, type CanonicalListing, type ListingType } from "../model";
import { classifyModelFamily } from "../normalize";
import type { ConnectorContext } from "./context";
import { type ConnectorMeta, type ListingConnector } from "./connector";

const CARS_CATEGORY = "6001"; // eBay Motors → Cars & Trucks

function host(ctx: ConnectorContext) {
  return ctx.env("EBAY_ENV") === "sandbox"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";
}

// --- OAuth application token (client-credentials), cached until expiry --------
let tokenCache: { token: string; expiresAt: number } | null = null;

async function appToken(ctx: ConnectorContext): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const basic = ctx.base64(`${ctx.env("EBAY_APP_ID")}:${ctx.env("EBAY_CERT_ID")}`);
  const res = await fetch(`${host(ctx)}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body:
      "grant_type=client_credentials&scope=" +
      encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error(`eBay OAuth failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

// --- Browse API item shape (only what we use) --------------------------------
interface EbayItemSummary {
  itemId: string;
  title?: string;
  price?: { value?: string; currency?: string };
  itemWebUrl?: string;
  image?: { imageUrl?: string };
  additionalImages?: { imageUrl?: string }[];
  itemLocation?: { city?: string; stateOrProvince?: string; country?: string };
  buyingOptions?: string[];
  itemEndDate?: string;
}

export const ebayConnector: ListingConnector = {
  meta: {
    id: "ebay-motors",
    name: "eBay Motors",
    tier: "api",
    provides: ["listings"],
    enabled: true,
    ref: "ebay:browse-api",
    notes: "Live via Browse API. Set EBAY_APP_ID + EBAY_CERT_ID to configure.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("EBAY_APP_ID") && ctx.env("EBAY_CERT_ID"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = await appToken(ctx);
    const marketplace = ctx.env("EBAY_MARKETPLACE") || "EBAY_US";

    const params = new URLSearchParams({
      q: "Porsche 911 912 930 air-cooled",
      category_ids: CARS_CATEGORY,
      filter: "conditions:{USED},itemLocationCountry:US",
      sort: "newlyListed",
      limit: "200",
    });

    const res = await fetch(
      `${host(ctx)}/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": marketplace,
        },
      }
    );
    if (!res.ok) throw new Error(`eBay Browse search failed: ${res.status}`);

    const json = (await res.json()) as { itemSummaries?: EbayItemSummary[] };
    return (json.itemSummaries ?? [])
      .map(mapItem)
      .filter((x): x is CanonicalListing => x !== null);
  },
};

function mapItem(item: EbayItemSummary): CanonicalListing | null {
  const title = (item.title ?? "").trim();
  const price = item.price?.value ? parseFloat(item.price.value) : NaN;
  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  // Floor drops parts/wheel/model-car listings priced far below any real car.
  if (!title || !year || Number.isNaN(price) || price < MIN_PLAUSIBLE_PRICE) return null;

  const family = classifyModelFamily(title, year ?? undefined);
  if (!family) return null; // filter out non-air-cooled results

  const buyingOptions = item.buyingOptions ?? [];
  const listingType: ListingType = buyingOptions.includes("AUCTION") ? "auction" : "bin";
  const now = new Date().toISOString();
  const photos = [
    item.image?.imageUrl,
    ...(item.additionalImages ?? []).map((i) => i.imageUrl),
  ].filter((u): u is string => Boolean(u));

  return {
    id: `ebay-motors:${item.itemId}`,
    source: "eBay Motors",
    sourceId: item.itemId,
    url: item.itemWebUrl ?? "#",
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title.replace(/^\d{4}\s+(porsche\s+)?/i, ""),
    body: /targa/i.test(title)
      ? "Targa"
      : /cabriolet|cab\b|convertible/i.test(title)
        ? "Cabriolet"
        : "Coupe",
    transmission: /automatic|tiptronic|sportomatic/i.test(title)
      ? "Automatic"
      : /manual|5-spd|6-spd|4-spd/i.test(title)
        ? "Manual"
        : "Unknown",
    listingType,
    sellerType: "dealer", // eBay Motors skews dealer; refined once seller data is pulled
    price,
    currency: item.price?.currency ?? "USD",
    endsAt: item.itemEndDate,
    city: item.itemLocation?.city,
    state: item.itemLocation?.stateOrProvince,
    photos,
    title: title.replace(/^\d{4}\s+/, `${year} `),
  };
}
