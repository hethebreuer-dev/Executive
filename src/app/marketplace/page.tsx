// Server component: reads live inventory through the repository seam and hands
// it to the interactive client. With only the mock connector enabled this is the
// seed data; once eBay (or any connector) is configured, real cars flow in here
// with no change to the client UI below.

import { repository } from "@/lib/luft/factory";
import { toLegacyListing, type Listing } from "@/lib/luft";
import { withMarketDelta } from "@/lib/luft/market";
import { MarketplaceClient } from "./MarketplaceClient";
import { SubscribeBar } from "@/components/luft/SubscribeBar";

// Re-read per request so newly-ingested listings show without a redeploy.
export const revalidate = 0;

export default async function MarketplacePage() {
  // High cap so the grid shows the full active inventory (and the "N cars
  // listed" count stays honest) instead of silently topping out at 500. The
  // repository already loads all active rows, so this doesn't add a DB read.
  const { items } = await repository.listListings({ limit: 5000 });
  // Real "vs market" delta = price vs the median asking of the same generation.
  const listings: Listing[] = withMarketDelta(items.map(toLegacyListing));
  return (
    <>
      <MarketplaceClient listings={listings} />
      <SubscribeBar />
    </>
  );
}
