// Parts marketplace — server-side data access. Stored in the same Cloudflare D1
// database as the car listings, in a self-healing `parts` table, read and
// written directly over D1's HTTP query API (the app already uses it for the car
// marketplace, so no Worker round-trip or re-deploy is needed). No moderation:
// a posted part is 'active' immediately. Falls back to an in-memory store when
// Cloudflare creds aren't present (local dev).

import type { Part } from "./parts-model";

interface D1Cfg {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

function cfg(): D1Cfg | null {
  const accountId = process.env.CF_ACCOUNT_ID;
  const databaseId = process.env.CF_D1_DATABASE_ID;
  const apiToken = process.env.CF_D1_API_TOKEN;
  return accountId && databaseId && apiToken ? { accountId, databaseId, apiToken } : null;
}

async function d1<T = unknown>(c: D1Cfg, sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${c.accountId}/d1/database/${c.databaseId}/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${c.apiToken}`, "content-type": "application/json" },
      body: JSON.stringify({ sql, params }),
    }
  );
  if (!res.ok) throw new Error(`D1 ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { success: boolean; result?: { results?: T[] }[]; errors?: unknown[] };
  if (!json.success) throw new Error(`D1 error: ${JSON.stringify(json.errors)}`);
  return json.result?.[0]?.results ?? [];
}

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'all',
  part_number TEXT,
  price INTEGER,
  photos TEXT,
  seller_name TEXT,
  seller_email TEXT NOT NULL,
  seller_phone TEXT,
  seller_contact TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
)`;

interface Row {
  id: string;
  title: string;
  description: string;
  model: string;
  part_number: string | null;
  price: number | null;
  photos: string | null;
  seller_name: string | null;
  seller_email: string;
  seller_phone: string | null;
  seller_contact: string | null;
  created_at: string;
}

function toPart(r: Row): Part {
  let photos: string[] = [];
  try {
    const arr = JSON.parse(r.photos || "[]");
    if (Array.isArray(arr)) photos = arr.filter((x): x is string => typeof x === "string");
  } catch {
    /* ignore */
  }
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    model: r.model,
    partNumber: r.part_number,
    price: r.price,
    photos,
    sellerName: r.seller_name,
    sellerEmail: r.seller_email,
    sellerPhone: r.seller_phone,
    sellerContact: r.seller_contact,
    createdAt: r.created_at,
  };
}

// Local-dev store (no Cloudflare creds). Seeded so the browse page isn't empty.
// Kept on globalThis so the API route and the page share one array across
// Next's separate dev module instances. Unused in production (D1 is the store).
const now = () => new Date().toISOString();
const seeds: Part[] = [
  {
    id: "part:seed-1", title: "Fuchs 15\" 6J wheel set (4)", description: "Restored deep-six Fuchs, polished lips and freshly anodized centers. No cracks, straight, ready to mount.",
    model: "all", partNumber: "911.361.011.40", price: 4200, photos: [], sellerName: "Klaus", sellerEmail: "klaus@example.com", sellerPhone: null, sellerContact: "Email", createdAt: now(),
  },
  {
    id: "part:seed-2", title: "964 RS-style bucket seats (pair)", description: "Reupholstered in black leatherette, rails included. Fits 964 / 993 with correct mounts.",
    model: "964", partNumber: null, price: 2650, photos: [], sellerName: "Marco", sellerEmail: "marco@example.com", sellerPhone: null, sellerContact: "Email", createdAt: now(),
  },
  {
    id: "part:seed-3", title: "CIS fuel distributor — rebuilt", description: "Bosch K-Jetronic fuel distributor, professionally rebuilt and flow-tested for 3.0/3.2 applications.",
    model: "911", partNumber: "0438100xxx", price: null, photos: [], sellerName: "AirCooled Spares", sellerEmail: "sales@example.com", sellerPhone: null, sellerContact: "Email", createdAt: now(),
  },
];
const g = globalThis as unknown as { __luftParts?: Part[] };
g.__luftParts ??= seeds;
const mem = g.__luftParts;

export async function listParts(): Promise<Part[]> {
  const c = cfg();
  if (!c) return [...mem].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  try {
    const rows = await d1<Row>(
      c,
      "SELECT * FROM parts WHERE status = 'active' ORDER BY created_at DESC LIMIT 2000"
    );
    return rows.map(toPart);
  } catch {
    // Table may not exist until the first part is posted — treat as empty.
    return [];
  }
}

export async function getPart(id: string): Promise<Part | null> {
  const c = cfg();
  if (!c) return mem.find((p) => p.id === id) ?? null;
  try {
    const rows = await d1<Row>(
      c,
      "SELECT * FROM parts WHERE id = ? AND status = 'active' LIMIT 1",
      [id]
    );
    return rows.length ? toPart(rows[0]) : null;
  } catch {
    // Table may not exist until the first part is posted — treat as not found.
    return null;
  }
}

export async function createPart(input: Omit<Part, "id" | "createdAt">): Promise<Part> {
  const created = now();
  const id = `part:${created}-${Math.random().toString(36).slice(2, 10)}`;
  const part: Part = { ...input, id, createdAt: created };
  const c = cfg();
  if (!c) {
    mem.unshift(part);
    return part;
  }
  await d1(c, CREATE_TABLE);
  await d1(
    c,
    `INSERT INTO parts (id, title, description, model, part_number, price, photos,
       seller_name, seller_email, seller_phone, seller_contact, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?, 'active', ?)`,
    [
      part.id, part.title, part.description, part.model, part.partNumber,
      part.price, JSON.stringify(part.photos), part.sellerName, part.sellerEmail,
      part.sellerPhone, part.sellerContact, created,
    ]
  );
  return part;
}
