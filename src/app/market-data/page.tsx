// Server component: reads live inventory through the repository seam and hands
// the asking-price stats to the interactive client. All figures are computed
// from the current listings — no synthetic data.

import { repository } from "@/lib/luft/factory";
import { toLegacyListing, type Listing } from "@/lib/luft";
import { withMarketDelta } from "@/lib/luft/market";
import { MarketDataClient } from "./MarketDataClient";

// Re-read per request so newly-ingested listings show without a redeploy.
export const revalidate = 0;

export default async function MarketDataPage() {
  const { items } = await repository.listListings({ limit: 1000 });
  const listings: Listing[] = withMarketDelta(items.map(toLegacyListing));
  return <MarketDataClient listings={listings} />;
}
