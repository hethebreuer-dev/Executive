// Live connector registry. Add a connector here once it's implemented; the
// repository only ever runs those whose meta.enabled is true. The catalog
// (connectors/catalog.ts) is the full roadmap; this is what actually executes.
//
// Connectors self-enable on their own credentials (see each connector), so the
// same build runs mock-only locally and live in production just by setting env.
// Set LUFT_DISABLE_MOCK=1 to drop the seed data once real sources cover it.

import { bringATrailerApify } from "./connectors/bringatrailer-apify";
import type { AnyConnector } from "./connectors/connector";
import { ebayConnector } from "./connectors/ebay";
import { mockConnector } from "./connectors/mock-connector";

const mockDisabled = process.env.LUFT_DISABLE_MOCK === "1";

export const CONNECTORS: AnyConnector[] = [
  { ...mockConnector, meta: { ...mockConnector.meta, enabled: !mockDisabled } },
  ebayConnector, // enabled when EBAY_APP_ID + EBAY_CERT_ID are set
  bringATrailerApify, // enabled once APIFY_TOKEN + mapping verified
];

export const activeConnectors = (): AnyConnector[] =>
  CONNECTORS.filter((c) => c.meta.enabled);
