# Deploy the ingestion Worker from the Cloudflare dashboard (no terminal)

Everything you need is copy-paste. The single file to paste lives at
[`worker/dist/worker.js`](./dist/worker.js) — a self-contained bundle of the
Worker (mock + eBay connectors, normalize/dedupe, cron + `/ingest` + `/health`).
If you edit `worker/src/`, regenerate it with `npm run bundle` (in `worker/`).

## 1. Create the D1 database
1. Cloudflare dashboard → **Storage & Databases → D1 SQL Database → Create**.
2. Name it **`luft`** → Create.
3. Open it → **Console** tab → paste the contents of
   [`worker/schema.sql`](./schema.sql) → **Run**. (Creates the tables + indexes.)
4. Note the **Database ID** shown on the database page — you'll need it for the app.

## 2. Create the Worker
1. **Workers & Pages → Create → Workers** → start from Hello World → name it
   **`luft-ingest`** → Deploy.
2. **Edit code** → select all, delete, and paste the contents of
   [`worker/dist/worker.js`](./dist/worker.js) → **Deploy**.

## 3. Bind D1 + set variables
On the Worker → **Settings**:
- **Bindings → Add → D1 database**: Variable name **`DB`**, database **`luft`** → Save.
- **Variables and Secrets**:
  - Secret **`INGEST_SECRET`** = any random string (guards `POST /ingest`).
  - Secret **`EBAY_APP_ID`**, **`EBAY_CERT_ID`** (once your eBay keyset is approved).
  - Optional: **`EBAY_ENV`** = `sandbox` to test, **`EBAY_MARKETPLACE`**, **`APIFY_TOKEN`**.
  - The 12 seed/mock cars are OFF by default. Only set var **`LUFT_ENABLE_MOCK`** = `1` if you want them back (e.g. bootstrapping an empty D1).

## 4. Schedule it
**Settings → Triggers → Cron Triggers → Add** → `*/30 * * * *` → Save.

## 5. Test it
- Visit `https://luft-ingest.<your-subdomain>.workers.dev/health` → `{ ok: true, listings: N }`.
- Kick a run without waiting for cron: **`POST /ingest`** with header
  `x-ingest-secret: <your secret>`. Even before eBay, the mock connector writes
  12 seed cars into D1 — proof the loop works end-to-end.

## 5b. Turn on scrape sources (Apify) — the MVP data path

eBay's API was denied, so real cars come from **managed Apify actors** (one per
site; they handle the scraping, we normalize the output).

1. Create an account at [apify.com](https://apify.com) → **Settings → Integrations
   → API token**. Add it to the Worker as secret **`APIFY_TOKEN`**.
2. For each site, find its actor in the **Apify Store** (search the site name) and
   add its id as a Worker secret. The Worker reads these — no code change:
   - **`APIFY_ACTOR_BAT`** — Bring a Trailer (pre-wired in code to
     `silentflow/bringatrailer-scraper`; the secret overrides it if you prefer another)
   - **`APIFY_ACTOR_CARS_AND_BIDS`** — Cars & Bids
   - **`APIFY_ACTOR_PCARMARKET`** — PCARMARKET
   - **`APIFY_ACTOR_HEMMINGS`** — Hemmings
   - **`APIFY_ACTOR_CLASSICCARS`** — ClassicCars.com
   - **`APIFY_ACTOR_AUTOTRADER`** — Autotrader Classics

   Value format is `username/actor-name` (e.g. `silentflow/bringatrailer-scraper`).
3. Redeploy, then trigger `POST /ingest` (or wait for cron). Each configured
   source runs; a source with no actor id / no token is silently skipped, so a
   broken one never blocks the others. The 12 seed cars are off by default; set
   **`LUFT_ENABLE_MOCK`** = `1` only if you want to seed an empty D1.

> Field mapping is intentionally tolerant (it probes common field names), so most
> actors map without custom code. Once real data lands we may tighten one or two
> mappings per actor — send me a sample item from a run and I'll pin it.

## 6. Point the app at D1
In the app's environment (your host's settings), set:
- **`CF_ACCOUNT_ID`** — your Cloudflare account id.
- **`CF_D1_DATABASE_ID`** — the D1 database id from step 1.
- **`CF_D1_API_TOKEN`** — an API token with **D1 read** (My Profile → API Tokens → Create).

The Marketplace then serves the Worker-ingested rows. Until these are set, the app
keeps aggregating connectors live in-memory, so nothing breaks in the meantime.

## 7. Turn on "List your car" (seller submissions + photos)

Sellers upload photos to the Worker (stored in **R2**) and submit a listing, which
lands as **pending** until you approve it from `/admin`. Approved cars appear on the
public marketplace alongside scraped ones.

**a. Create an R2 bucket + bind it**
1. Cloudflare dashboard → **R2 → Create bucket** → name it **`luft-photos`** → Create.
2. Worker → **Settings → Bindings → Add → R2 bucket**: Variable name **`PHOTOS`**,
   bucket **`luft-photos`** → Save.

**b. Add the two secrets (Worker → Settings → Variables and Secrets)**
- Secret **`SUBMIT_SECRET`** = any random string (guards `POST /submit`).
- Secret **`ADMIN_SECRET`** = a different random string (guards `/admin/*`).

**c. Re-paste the Worker bundle**
The upload/submit/admin routes are in [`worker/dist/worker.js`](./dist/worker.js).
Worker → **Edit code** → select all → paste the file → **Deploy**. (The seller
columns are added to D1 automatically on the first submission — no manual SQL. A
brand-new D1 created from `schema.sql` already has them.)

**d. Point the app at it (host env / Vercel → Settings → Environment Variables)**
- **`NEXT_PUBLIC_WORKER_URL`** = your Worker origin, e.g.
  `https://luft-ingest.<your-subdomain>.workers.dev` (browser photo upload + submit).
- **`WORKER_SUBMIT_SECRET`** = the same value as the Worker's `SUBMIT_SECRET`.
- **`WORKER_ADMIN_SECRET`** = the same value as the Worker's `ADMIN_SECRET` (server-only; never reaches the browser).
- **`ADMIN_KEY`** = the key you'll put in the moderation URL (keep it **different** from `WORKER_ADMIN_SECRET`).

Redeploy the app so `NEXT_PUBLIC_WORKER_URL` is baked in.

**e. Moderate**
Open **`/admin?key=<ADMIN_KEY>`**. Pending submissions show with photos + seller
contact; **Approve** publishes to the marketplace, **Reject** withdraws. Sellers see
their car as *In review* under **Listings** in their account the moment they submit.

> Notes: photo uploads are capped at 10 MB and must be images. `/submit` is
> secret-guarded (only the app can write), so the public can't inject listings —
> only upload image blobs, which sit unreferenced until a real submission uses them.
> Real buyer↔seller messaging and comp-delta for user cars are follow-ups.
