// Live connector registry. Add a connector here once it's implemented; the
// repository only runs those whose meta.enabled is true AND that are configured
// for the current context (creds/flags). The catalog (connectors/catalog.ts) is
// the full roadmap; this is what actually executes.

import { apifyConnectors } from "./connectors/apify-sites";
import { isConfigured, type AnyConnector } from "./connectors/connector";
import type { ConnectorContext } from "./connectors/context";
import { ebayConnector } from "./connectors/ebay";
import { mockConnector } from "./connectors/mock-connector";

export const CONNECTORS: AnyConnector[] = [
  mockConnector, // connector #0 — steps aside when LUFT_DISABLE_MOCK=1
  ebayConnector, // configured when EBAY_APP_ID + EBAY_CERT_ID are set
  ...apifyConnectors, // Apify-actor sources (BaT wired; others need actorId)
];

export const activeConnectors = (ctx: ConnectorContext): AnyConnector[] =>
  CONNECTORS.filter((c) => c.meta.enabled && isConfigured(c, ctx));
