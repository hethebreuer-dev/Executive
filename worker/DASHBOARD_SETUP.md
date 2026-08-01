# LUFT — Cloudflare setup (dashboard, no terminal)

This is the complete setup for the data backend, done entirely in the Cloudflare
and Vercel dashboards (copy-paste only). It has two halves:

- **Part A — Marketplace data** (D1 + the ingest Worker + Apify). Pulls real cars
  from scrapers into the marketplace. **You've already done this.**
- **Part B — "List your car"** (R2 photos + two secrets + app env). Lets sellers
  submit their own cars, which you approve. **This is the new part to set up.**

The single Worker file to paste lives at
[`worker/dist/worker.js`](./dist/worker.js) — a self-contained bundle (scrapers +
ingest + photo upload + submissions + moderation). If you ever edit `worker/src/`,
regenerate it with `npm run bundle` in `worker/`.

> **You do NOT create a second database.** Seller listings live in the **same
> `luft` D1 table** as the scraped cars — that's how an approved car shows up in
> the marketplace next to the rest. The extra columns it needs are added
> automatically the first time someone submits, so there's no SQL to run.

---

# Part A — Marketplace data (already set up)

Recap of what should already be in place. Skip to Part B if the marketplace is
already showing cars. If you're starting fresh, do these first.

### A1. D1 database
- Cloudflare → **Storage & Databases → D1** → database named **`luft`**.
- Its **Console** tab was seeded with [`worker/schema.sql`](./schema.sql).
- Note the **Database ID** (used by the app in Part A4).

### A2. The Worker
- **Workers & Pages** → Worker named **`luft-ingest`**, code = the contents of
  [`worker/dist/worker.js`](./dist/worker.js).

### A3. Worker bindings + secrets (Worker → Settings)
- **Bindings → D1**: variable **`DB`** → database **`luft`**.
- **Variables and Secrets**:
  - `INGEST_SECRET` — random string (guards the manual `POST /ingest`).
  - `APIFY_TOKEN` — your Apify token (the scrapers run through Apify).
  - Cron trigger `*/30 * * * *` under **Settings → Triggers**.

### A4. Point the app at D1 (Vercel → Settings → Environment Variables)
- `CF_ACCOUNT_ID` — your Cloudflare account id.
- `CF_D1_DATABASE_ID` — the `luft` Database ID from A1.
- `CF_D1_API_TOKEN` — an API token with **D1 read** access.

> ✅ These same three are all the app needs to *read* the marketplace. Writes
> (Part B) go through the Worker, not this token — so you don't change it.

---

# Part B — Turn on "List your car" (NEW)

Sellers upload photos and submit a car → it's saved as **Pending** → you approve
it at `/admin` → it goes live on the public marketplace. Five steps.

### B1. Create an R2 bucket for photos
D1 stores data, not files, so photos need R2 (Cloudflare's file storage).
1. Cloudflare → **R2** → **Create bucket**.
2. Name it exactly **`luft-photos`** → **Create**. (Nothing else to configure.)

### B2. Bind R2 to the Worker
1. Open the **`luft-ingest`** Worker → **Settings → Bindings → Add**.
2. Choose **R2 bucket**. Variable name **`PHOTOS`**, bucket **`luft-photos`** → **Save**.

### B3. Add two Worker secrets
Worker → **Settings → Variables and Secrets → Add**, twice:

| Type | Name | Value |
|---|---|---|
| Secret | **`SUBMIT_SECRET`** | any random string (guards listing submissions) |
| Secret | **`ADMIN_SECRET`** | a **different** random string (guards moderation) |

Keep both values somewhere — you'll reuse them in B5.

### B4. Re-paste the Worker code
The upload/submit/admin features live in the bundle, so the Worker needs the
current file:
1. Worker → **Edit code**.
2. Select all → delete → paste the contents of [`worker/dist/worker.js`](./dist/worker.js).
3. **Deploy**.

> No database migration needed — the seller columns are added automatically on the
> first submission.

### B5. Set four app env vars (Vercel → Settings → Environment Variables)

| Name | Value |
|---|---|
| **`NEXT_PUBLIC_WORKER_URL`** | your Worker URL, e.g. `https://luft-ingest.<your-subdomain>.workers.dev` |
| **`WORKER_SUBMIT_SECRET`** | the **same** value as the Worker's `SUBMIT_SECRET` (B3) |
| **`WORKER_ADMIN_SECRET`** | the **same** value as the Worker's `ADMIN_SECRET` (B3) |
| **`ADMIN_KEY`** | a **new** password you pick — this is what you'll put in the admin URL. Make it **different** from `WORKER_ADMIN_SECRET`. |

Then **Redeploy** the app (Vercel → Deployments → Redeploy) so
`NEXT_PUBLIC_WORKER_URL` gets baked into the site.

> **Why the two admin values?** `WORKER_ADMIN_SECRET` stays on the server and is
> never exposed. `ADMIN_KEY` is the one you type into the browser URL. Keeping
> them separate means the real worker secret never travels to the browser.

---

## How to use it once B is done

- **Sellers**: go to **Sell**, fill out the car, upload photos, Publish. They see
  it as **In review** under **Listings** in their account immediately.
- **You (approve/reject)**: open **`https://<your-site>/admin?key=<ADMIN_KEY>`**
  (using the `ADMIN_KEY` you set in B5). Each pending car shows with its photos and
  the seller's contact. **Approve** publishes it to the marketplace; **Reject**
  withdraws it.

## Quick checks

- Worker is alive: visit `https://luft-ingest.<your-subdomain>.workers.dev/health`
  → `{ ok: true, listings: N }`.
- Photos configured: after B1–B4, a submitted car's photos should load on the
  `/admin` page. If they don't, re-check the `PHOTOS` binding (B2).
- Admin shows nothing / "Invalid admin key": the `?key=` in the URL must match the
  app's `ADMIN_KEY` (B5), and the app must have been redeployed after setting it.

## Good to know

- Photo uploads are capped at **10 MB** and must be images.
- Submissions are **secret-guarded** (only the site can write to D1), so the public
  can't inject listings — they can only upload image files, which sit unused until a
  real submission references them.
- Not built yet (future): buyer↔seller messaging, comp-price positioning for
  seller cars, and rate-limiting on submissions.

---

## Appendix — turning scrape sources on/off (Apify)

Real marketplace cars come from **managed Apify actors** (one per site). Add each
site's actor id as a Worker secret — no code change:

- `APIFY_ACTOR_BAT` — Bring a Trailer (pre-wired to `silentflow/bringatrailer-scraper`)
- `APIFY_ACTOR_CARS_AND_BIDS`, `APIFY_ACTOR_PCARMARKET`, `APIFY_ACTOR_HEMMINGS`,
  `APIFY_ACTOR_CLASSICCARS`, `APIFY_ACTOR_AUTOTRADER`

Value format is `username/actor-name`. After changing these, redeploy the Worker
and trigger `POST /ingest` with header `x-ingest-secret: <INGEST_SECRET>` (or wait
for the cron). A source with no actor id / token is skipped, so a broken one never
blocks the others. The 12 seed/mock cars are off by default; set var
`LUFT_ENABLE_MOCK = 1` only to bootstrap an empty D1.
