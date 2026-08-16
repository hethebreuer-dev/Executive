// Live connector registry. Add a connector here once it's implemented; the
// repository only runs those whose meta.enabled is true AND that are configured
// for the current context (creds/flags). The catalog (connectors/catalog.ts) is
// the full roadmap; this is what actually executes.

import { apifyConnectors } from "./connectors/apify-sites";
import { autotraderConnector } from "./connectors/autotrader";
import { bringATrailerConnector } from "./connectors/bring-a-trailer";
import { classicComConnector } from "./connectors/classic-com";
import { isConfigured, type AnyConnector } from "./connectors/connector";
import type { ConnectorContext } from "./connectors/context";
import { ebayConnector } from "./connectors/ebay";
import { elferspotConnector } from "./connectors/elferspot";
import { mockConnector } from "./connectors/mock-connector";

export const CONNECTORS: AnyConnector[] = [
  mockConnector, // connector #0 — off by default; opt in with LUFT_ENABLE_MOCK=1
  ebayConnector, // configured when EBAY_APP_ID + EBAY_CERT_ID are set
  classicComConnector, // working MVP source — runs on APIFY_TOKEN alone
  elferspotConnector, // two-stage cheerio crawl — runs on APIFY_TOKEN alone
  autotraderConnector, // single-stage cheerio crawl — runs on APIFY_TOKEN alone
  bringATrailerConnector, // live BaT auctions — OPT-IN: needs APIFY_TOKEN + LUFT_ENABLE_BAT
  ...apifyConnectors, // other Apify-actor sources (need actorId/actorEnv)
];

export const activeConnectors = (ctx: ConnectorContext): AnyConnector[] =>
  CONNECTORS.filter((c) => c.meta.enabled && isConfigured(c, ctx));
