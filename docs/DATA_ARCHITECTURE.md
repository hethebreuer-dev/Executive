# LUFT data architecture

How LUFT goes from a polished mock to a live aggregator of every air-cooled 911
for sale in the US, priced against real sold comps.

The guiding idea: **~40 sources are not one integration.** They split by _how we
can reach them_ (tiers) and _what they feed_ (two pipelines). Everything
downstream — pages, API routes, analytics — speaks a single **canonical model**
and reads through a single **repository seam**, so adding a source never touches
the app.

---

## Two pipelines

Listings and comps are different problems with different cadences and different
acquisition difficulty. Keep them separate.

### 1. Listings (active inventory)

```
connector → normalize → dedupe → listings store → repository → API → app
```

Feeds the Marketplace, Listing pages, Home, and the "live" counts. Refresh
cadence is per-source: auctions poll fast as they near close; dealer/classified
inventory hourly–daily.

### 2. Comps (verified sold results)

```
comp connector → sold_comps store → aggregation job → medians / trend / bands
```

Feeds every `+X% vs comps` badge, the medians, the low–median–high bands, and the
Market Data analytics series. **This is the harder acquisition problem** —
historical sold-price data is the valuable, proprietary asset (it's literally
what Classic.com and Hagerty sell). Treat it as licensed data first, scraped
second.

---

## Connector tiers

Every source is a **connector** that normalizes into the canonical model. Tiers,
best → most fragile:

| Tier | Meaning | Examples |
|---|---|---|
| `api` | Official/sanctioned API or structured feed (schema.org `Vehicle` JSON-LD) | eBay Motors (Browse API), duPont Registry, JamesEdition |
| `apify` | Managed third-party scraping actor — no scraper for us to maintain | **Bring a Trailer** via `silentflow/bringatrailer-scraper` |
| `partnership` | Licensed / negotiated feed | Auction houses (RM, Gooding, Broad Arrow, Bonhams); **comps: Classic.com, Hagerty, SCM** |
| `scrape` | First-party scraper we build + maintain | Most classifieds, forums, and dealer sites without markup |
| `mock` | Seeded placeholder (connector #0) | `LUFT Mock` |

BaT is the #1 air-cooled source but has no public API and can't be self-served
cleanly — a **managed actor (Apify)** is the pragmatic path: we get normalized
BaT data without running or maintaining a scraper ourselves. The same pattern
covers other auction sites that lack feeds.

The full, tiered source list lives in code at
[`src/lib/luft/connectors/catalog.ts`](../src/lib/luft/connectors/catalog.ts) —
that file is the roadmap; keep it in sync with this doc.

---

## Canonical model

Source quirks stay inside connectors; the rest of the system only sees these
([`src/lib/luft/model.ts`](../src/lib/luft/model.ts)):

- **CanonicalListing** — identity (`source`, `sourceId`, `url`, `firstSeen`,
  `lastSeen`, `status`), vehicle (`year`, `modelFamily`, `trim`, `body`,
  `transmission`), provenance (`vin`, `matchingNumbers`, `mileage`, colors),
  commerce (`listingType`, `sellerType`, `price`, `currency`, `endsAt`, location),
  a comps-derived `compDeltaPct`, and media/presentation.
- **SoldComp** — `modelFamily`, `trim`, `year`, `soldPrice`, `soldAt`,
  `mileage`, `source` — the atoms the aggregation job turns into medians/trends.

### Dedupe

Aggregators re-list the same car, so dedupe is mandatory
([`src/lib/luft/normalize.ts`](../src/lib/luft/normalize.ts)):

- **VIN** when present (`vin:<VIN>`).
- Else a **fuzzy key**: `year | modelFamily | trim | color | mileage÷1000 |
  state`.
- On collision, keep the most complete record (VIN + photo count) and carry the
  freshest `lastSeen`.

`classifyModelFamily()` is a conservative title classifier — it returns `null`
for anything that isn't clearly an air-cooled 911/912/930, so noisy classified
sources (Craigslist, FB) don't pollute the catalog.

---

## The seam (built — Phase 0)

```
Connectors ──▶ Registry ──▶ Repository ──▶ /api/listings ──▶ App
(catalog)     (enabled)     (ListingRepository)              (pages)
```

- **Connector** interface + registry:
  [`connectors/connector.ts`](../src/lib/luft/connectors/connector.ts),
  [`registry.ts`](../src/lib/luft/registry.ts).
- **Repository** (`ListingRepository`): the single interface the app reads
  through — filter, sort, dedupe, `marketStats`, `listComps`
  ([`repository.ts`](../src/lib/luft/repository.ts)). Today it's an in-memory
  aggregator; Phase 1+ swaps in a DB-backed implementation **without touching a
  page**.
- **API**: `GET /api/listings?model=&sort=&limit=&offset=`
  ([`app/api/listings/route.ts`](../src/app/api/listings/route.ts)).
- **Connector #0**: the mock
  ([`connectors/mock-connector.ts`](../src/lib/luft/connectors/mock-connector.ts)).
  The legacy `src/lib/luft.ts` `LISTINGS` array is now _derived_ from it, so the
  UI is unchanged while the data flows through the real seam.
- **BaT/Apify scaffold**:
  [`connectors/bringatrailer-apify.ts`](../src/lib/luft/connectors/bringatrailer-apify.ts)
  — real run logic, disabled until `APIFY_TOKEN` is set and its field mapping is
  verified against the actor's output.

---

## Infrastructure (Phase 1+)

Not in the repo yet; what live data needs:

- **Store** — Postgres (Neon/Supabase) for `listings` + `sold_comps`, plus a
  search index if/when free-text search grows up.
- **Ingestion workers** — a scheduler/queue running connectors on per-source
  cadences, writing normalized + deduped records. (Vercel Cron for simple polls;
  a dedicated worker/queue for heavier scrape/actor jobs.)
- **Images** — cache/proxy source photos to our own CDN (hotlinking breaks and
  leaks referrers).
- **Secrets** — per-source API keys / `APIFY_TOKEN` / partnership credentials.
- **App** — Next reads via route handlers with tag-based revalidation
  (`revalidateTag`) so ingestion can push fresh data without a redeploy.

---

## Roadmap

- **Phase 0 — the seam ✅** _(done)_ canonical model, connector interface, source
  catalog, mock connector #0, in-memory repository, `/api/listings`. UI unchanged.
- **Phase 1 — first live source** wire **eBay Motors Browse API** (or the BaT
  Apify actor) end-to-end; stand up Postgres + one ingestion worker; point the
  Marketplace at `/api/listings`.
- **Phase 2 — comps** license **Classic.com or Hagerty** (and/or ingest BaT sold
  results); build the aggregation job; make medians / trend / bands real.
- **Phase 3 — breadth** add sources tier-by-tier behind the connector interface;
  add dedupe hardening and connector-health alerting (a scraper that silently
  returns 0 rows must page someone).

---

## Operating scrapers as a good citizen

We're aggregating broadly, which sends qualified buyers back to the source
listings — but keep it sustainable and low-friction:

- Prefer `api` / `apify` / `partnership` tiers; hand-rolled scrapers are the last
  resort per source.
- Respect `robots.txt`, rate-limit, back off on 429/5xx, and cache aggressively —
  don't hammer a source you re-poll every few minutes.
- Send an identifiable User-Agent with a contact URL so a source can reach us
  before they reach for a block.
- Honor takedown/opt-out requests immediately.
- Store `source` + `url` on every record and link back prominently — attribution
  is both correct and the "free advertising" that keeps sources tolerant.
- Review each source's terms before enabling its connector; some (BaT,
  Classic.com, Hagerty) prohibit scraping and are partnership/licensed data —
  budget for that rather than scraping around it.
