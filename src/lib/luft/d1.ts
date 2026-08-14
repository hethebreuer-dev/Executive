// Small shared client for Cloudflare D1's HTTP query API — used by the app for
// the direct-to-D1 writes (parts, seller-listing removal) that don't need to go
// through the ingestion Worker. Reads still flow through the repository seam.

export interface D1Cfg {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

export function d1ConfigFromEnv(): D1Cfg | null {
  const accountId = process.env.CF_ACCOUNT_ID;
  const databaseId = process.env.CF_D1_DATABASE_ID;
  const apiToken = process.env.CF_D1_API_TOKEN;
  return accountId && databaseId && apiToken ? { accountId, databaseId, apiToken } : null;
}

export async function d1Query<T = unknown>(
  c: D1Cfg,
  sql: string,
  params: unknown[] = []
): Promise<{ results: T[]; changes: number }> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${c.accountId}/d1/database/${c.databaseId}/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${c.apiToken}`, "content-type": "application/json" },
      body: JSON.stringify({ sql, params }),
    }
  );
  if (!res.ok) throw new Error(`D1 ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    success: boolean;
    result?: { results?: T[]; meta?: { changes?: number } }[];
    errors?: unknown[];
  };
  if (!json.success) throw new Error(`D1 error: ${JSON.stringify(json.errors)}`);
  return {
    results: json.result?.[0]?.results ?? [],
    changes: json.result?.[0]?.meta?.changes ?? 0,
  };
}
