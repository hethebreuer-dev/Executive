// Connector contract. Every data source — an official API, a managed scraping
// actor (e.g. Apify), a partnership feed, our own scraper, or the mock — is a
// connector that normalizes its source into CanonicalListing / SoldComp.

import type { CanonicalListing, SoldComp } from "../model";
import type { ConnectorContext } from "./context";

/**
 * How a source is reached, roughly in order of preference/robustness:
 * - "api"         official/sanctioned API or structured feed (e.g. eBay).
 * - "apify"       managed third-party scraping actor (e.g. BaT via Apify).
 * - "partnership" licensed/negotiated data feed (auction houses, comps vendors).
 * - "scrape"      first-party scraper we build + maintain.
 * - "mock"        seeded placeholder data (connector #0).
 */
export type ConnectorTier = "api" | "apify" | "partnership" | "scrape" | "mock";

/** Which pipeline(s) a source can feed. */
export type Pipeline = "listings" | "comps";

export interface ConnectorMeta {
  /** Slug, e.g. "bring-a-trailer". */
  id: string;
  /** Display source name, e.g. "Bring a Trailer". */
  name: string;
  tier: ConnectorTier;
  provides: Pipeline[];
  /** Turned on in the registry (implemented + intended). Separate from whether
   * it's *configured* — see isConfigured(). */
  enabled: boolean;
  /** Optional pointer: Apify actor id, API docs, partnership contact, etc. */
  ref?: string;
  notes?: string;
}

interface ConnectorBase {
  meta: ConnectorMeta;
  /** Whether this connector has what it needs to run in this context (creds,
   * flags). Defaults to true. The repository runs a connector only when
   * `meta.enabled && isConfigured(ctx)`. */
  isConfigured?(ctx: ConnectorContext): boolean;
}

export interface ListingConnector extends ConnectorBase {
  fetchListings(ctx: ConnectorContext): Promise<CanonicalListing[]>;
}

export interface CompConnector extends ConnectorBase {
  fetchComps(ctx: ConnectorContext): Promise<SoldComp[]>;
}

export type AnyConnector = Partial<ListingConnector & CompConnector> & {
  meta: ConnectorMeta;
};

export function providesListings(c: AnyConnector): c is ListingConnector & AnyConnector {
  return typeof c.fetchListings === "function" && c.meta.provides.includes("listings");
}

export function providesComps(c: AnyConnector): c is CompConnector & AnyConnector {
  return typeof c.fetchComps === "function" && c.meta.provides.includes("comps");
}

export function isConfigured(c: AnyConnector, ctx: ConnectorContext): boolean {
  return c.isConfigured ? c.isConfigured(ctx) : true;
}

/** Thrown by scaffolded connectors that are catalogued but not yet implemented. */
export class ConnectorNotImplemented extends Error {
  constructor(public readonly connectorId: string) {
    super(`Connector "${connectorId}" is catalogued but not implemented yet.`);
    this.name = "ConnectorNotImplemented";
  }
}
