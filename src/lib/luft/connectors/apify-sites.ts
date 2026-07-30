// Top MVP scrape sources, each driven by a managed Apify actor.
//
// Two ways to wire a source's actor:
//   1. Set its `actorId` here in code (BaT is pre-wired), or
//   2. Set its `actorEnv` secret on the Worker (e.g. APIFY_ACTOR_CARS_AND_BIDS
//      = "someuser/carsandbids-scraper") — no code change or re-paste needed.
//
// A source stays dormant until BOTH an actor is resolved (config or secret) AND
// APIFY_TOKEN exists, so half-configured sites never break ingestion.

import { makeApifyConnector, type ApifySiteConfig } from "./apify";
import { classicComSite } from "./classic-com";

export const APIFY_SITES: ApifySiteConfig[] = [
  // Classic.com — the working MVP source (aggregates 1M+ auction + dealer
  // listings). Runs on APIFY_TOKEN alone; exact output mapper in classic-com.ts.
  classicComSite,
  {
    id: "bring-a-trailer",
    name: "Bring a Trailer",
    actorId: "silentflow/bringatrailer-scraper",
    actorEnv: "APIFY_ACTOR_BAT",
    // DISABLED: BaT hard-blocks scrapers (403 on every request via the free
    // proxy). Needs residential proxies or a partnership — not an MVP path.
    // Re-enable only with a proxy solution that actually gets through.
    enabled: false,
    // silentflow/bringatrailer-scraper takes startUrls (BaT model-category
    // pages) + maxItems + includeDetails. Curated air-cooled set; classifier
    // drops anything that isn't a 911/912/930/964/993.
    input: {
      includeDetails: true,
      maxItems: 120,
      startUrls: [
        "https://bringatrailer.com/porsche/911-carrera-1974-1977/",
        "https://bringatrailer.com/porsche/911-carrera-3-2/",
        "https://bringatrailer.com/porsche/911-carrera-rs-1973/",
        "https://bringatrailer.com/porsche/911sc/",
        "https://bringatrailer.com/porsche/912/",
        "https://bringatrailer.com/porsche/912e/",
        "https://bringatrailer.com/porsche/930-turbo/",
        "https://bringatrailer.com/porsche/964/",
        "https://bringatrailer.com/porsche/964-turbo/",
        "https://bringatrailer.com/porsche/964-carrera-rs/",
        "https://bringatrailer.com/porsche/993/",
        "https://bringatrailer.com/porsche/993-911-carrera-s/",
        "https://bringatrailer.com/porsche/993-911-carrera-4/",
        "https://bringatrailer.com/porsche/993-911-carrera-4s/",
        "https://bringatrailer.com/porsche/993-turbo/",
      ].map((url) => ({ url })),
    },
    listingType: "auction",
    sellerType: "auction",
  },
  {
    id: "cars-and-bids",
    name: "Cars & Bids",
    actorId: "",
    actorEnv: "APIFY_ACTOR_CARS_AND_BIDS",
    input: { search: "Porsche 911", maxItems: 200 },
    listingType: "auction",
    sellerType: "private",
  },
  {
    id: "pcarmarket",
    name: "PCARMARKET",
    actorId: "",
    actorEnv: "APIFY_ACTOR_PCARMARKET",
    input: { search: "air-cooled Porsche" },
    listingType: "auction",
  },
  {
    id: "hemmings",
    name: "Hemmings",
    actorId: "",
    actorEnv: "APIFY_ACTOR_HEMMINGS",
    input: { search: "Porsche 911", maxItems: 200 },
    listingType: "classified",
    sellerType: "dealer",
  },
  {
    id: "classiccars-com",
    name: "ClassicCars.com",
    actorId: "",
    actorEnv: "APIFY_ACTOR_CLASSICCARS",
    input: { search: "Porsche 911", maxItems: 200 },
    listingType: "classified",
    sellerType: "dealer",
  },
  {
    id: "autotrader-classics",
    name: "Autotrader Classics",
    actorId: "",
    actorEnv: "APIFY_ACTOR_AUTOTRADER",
    input: { make: "Porsche", model: "911" },
    listingType: "dealer",
    sellerType: "dealer",
  },
];

export const apifyConnectors = APIFY_SITES.map(makeApifyConnector);
