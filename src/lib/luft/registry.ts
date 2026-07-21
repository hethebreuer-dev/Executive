// Live connector registry. Add a connector here once it's implemented; the
// repository only ever runs those whose meta.enabled is true. The catalog
// (connectors/catalog.ts) is the full roadmap; this is what actually executes.

import { bringATrailerApify } from "./connectors/bringatrailer-apify";
import type { AnyConnector } from "./connectors/connector";
import { mockConnector } from "./connectors/mock-connector";

export const CONNECTORS: AnyConnector[] = [
  mockConnector, // connector #0 — enabled
  bringATrailerApify, // scaffold — enabled once APIFY_TOKEN + mapping verified
];

export const activeConnectors = (): AnyConnector[] =>
  CONNECTORS.filter((c) => c.meta.enabled);
