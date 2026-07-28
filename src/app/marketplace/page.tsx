// Server component: reads live inventory through the repository seam and hands
// it to the interactive client. With only the mock connector enabled this is the
// seed data; once eBay (or any connector) is configured, real cars flow in here
// with no change to the client UI below.

import { repository } from "@/lib/luft/factory";
import { toLegacyListing, type Listing } from "@/lib/luft";
import { MarketplaceClient } from "./MarketplaceClient";

// Re-read per request so newly-ingested listings show without a redeploy.
export const revalidate = 0;

export default async function MarketplacePage() {
  const { items } = await repository.listListings({ limit: 500 });
  const listings: Listing[] = items.map(toLegacyListing);
  return <MarketplaceClient listings={listings} />;
}
