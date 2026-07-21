// GET /api/listings — the server read path through the repository seam.
// Phase 1 wires the Marketplace to fetch this instead of importing mock arrays.

import { NextResponse } from "next/server";
import type { ListingQuery, ListingSort, ModelFamily } from "@/lib/luft/model";
import { repository } from "@/lib/luft/repository";

const FAMILIES: (ModelFamily | "all")[] = ["all", "911", "912", "930", "964", "993"];
const SORTS: ListingSort[] = [
  "relevance",
  "value",
  "price-asc",
  "price-desc",
  "year-desc",
  "year-asc",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const modelParam = searchParams.get("model");
  const sortParam = searchParams.get("sort");
  const limit = Number(searchParams.get("limit"));
  const offset = Number(searchParams.get("offset"));

  const query: ListingQuery = {
    modelFamily: FAMILIES.includes(modelParam as ModelFamily) ? (modelParam as ModelFamily) : "all",
    sort: SORTS.includes(sortParam as ListingSort) ? (sortParam as ListingSort) : "relevance",
    ...(Number.isFinite(limit) && limit > 0 ? { limit } : {}),
    ...(Number.isFinite(offset) && offset > 0 ? { offset } : {}),
  };

  const result = await repository.listListings(query);
  return NextResponse.json(result);
}
