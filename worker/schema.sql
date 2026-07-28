-- LUFT D1 schema. Apply with:
--   wrangler d1 execute luft --remote --file=./worker/schema.sql
-- (drop --remote to target the local dev D1).

CREATE TABLE IF NOT EXISTS listings (
  id              TEXT PRIMARY KEY,
  source          TEXT NOT NULL,
  source_id       TEXT NOT NULL,
  url             TEXT NOT NULL,
  first_seen      TEXT NOT NULL,
  last_seen       TEXT NOT NULL,
  status          TEXT NOT NULL,              -- active | sold | withdrawn
  year            INTEGER NOT NULL,
  model_family    TEXT NOT NULL,              -- 912 | 911 | 930 | 964 | 993
  trim            TEXT NOT NULL,
  body            TEXT NOT NULL,              -- Coupe | Targa | Cabriolet
  transmission    TEXT NOT NULL,
  vin             TEXT,
  matching_numbers INTEGER,                   -- 0 | 1 | NULL
  mileage         INTEGER,
  exterior_color  TEXT,
  interior_color  TEXT,
  listing_type    TEXT NOT NULL,              -- auction | bin | classified | dealer
  seller_type     TEXT NOT NULL,              -- private | dealer | auction
  price           INTEGER NOT NULL,
  currency        TEXT NOT NULL,
  ends_at         TEXT,
  city            TEXT,
  state           TEXT,
  comp_delta_pct  REAL,
  photos          TEXT,                       -- JSON array of URLs
  title           TEXT NOT NULL,
  caption         TEXT,
  blurb           TEXT,
  dedupe_key      TEXT NOT NULL               -- VIN or fuzzy identity (merge key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_dedupe  ON listings(dedupe_key);
CREATE INDEX        IF NOT EXISTS idx_listings_family  ON listings(model_family);
CREATE INDEX        IF NOT EXISTS idx_listings_status  ON listings(status);
CREATE INDEX        IF NOT EXISTS idx_listings_price   ON listings(price);

CREATE TABLE IF NOT EXISTS sold_comps (
  id           TEXT PRIMARY KEY,
  source       TEXT NOT NULL,
  model_family TEXT NOT NULL,
  trim         TEXT NOT NULL,
  year         INTEGER NOT NULL,
  sold_price   INTEGER NOT NULL,
  sold_at      TEXT NOT NULL,
  mileage      INTEGER,
  url          TEXT
);

CREATE INDEX IF NOT EXISTS idx_comps_family ON sold_comps(model_family);
