// Repository factory — the app imports `repository` from here. It reads from D1
// when the Cloudflare credentials are present (Worker-ingested data), otherwise
// aggregates connectors live in-memory. Same interface either way, so pages and
// API routes never change.

import { nodeContext } from "./connectors/context-node";
import { D1Repository } from "./repository-d1";
import { InMemoryRepository, type ListingRepository } from "./repository";

export function getRepository(): ListingRepository {
  const ctx = nodeContext();
  const accountId = ctx.env("CF_ACCOUNT_ID");
  const databaseId = ctx.env("CF_D1_DATABASE_ID");
  const apiToken = ctx.env("CF_D1_API_TOKEN");

  if (accountId && databaseId && apiToken) {
    return new D1Repository({ accountId, databaseId, apiToken });
  }
  return new InMemoryRepository(ctx);
}

/** App-wide repository singleton. */
export const repository: ListingRepository = getRepository();
