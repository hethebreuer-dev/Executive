// The source catalog — every planned LUFT source, tiered by how we reach it and
// tagged with the pipeline(s) it feeds. This is the roadmap in code: each entry
// becomes a connector. `enabled` here is intent; the registry decides what
// actually runs (a source flips on once its connector is implemented + has
// credentials). Keep this in sync with docs/DATA_ARCHITECTURE.md.

import type { ConnectorMeta } from "./connector";

export const SOURCE_CATALOG: ConnectorMeta[] = [
  // --- Auction houses -------------------------------------------------------
  { id: "bring-a-trailer", name: "Bring a Trailer", tier: "apify", provides: ["listings", "comps"], enabled: false, ref: "apify:silentflow/bringatrailer-scraper", notes: "Biggest air-cooled source. No public API — reach via managed Apify actor; BaT sold results also feed comps." },
  { id: "cars-and-bids", name: "Cars & Bids", tier: "scrape", provides: ["listings", "comps"], enabled: false },
  { id: "pcarmarket", name: "PCARMARKET", tier: "scrape", provides: ["listings", "comps"], enabled: false },
  { id: "collecting-cars", name: "Collecting Cars", tier: "scrape", provides: ["listings", "comps"], enabled: false },
  { id: "hemmings-auctions", name: "Hemmings Auctions", tier: "scrape", provides: ["listings", "comps"], enabled: false },
  { id: "ebay-motors", name: "eBay Motors", tier: "api", provides: ["listings"], enabled: false, ref: "ebay:browse-api", notes: "Official Browse API (OAuth). Cleanest first live source." },
  { id: "bonhams", name: "Bonhams", tier: "partnership", provides: ["listings", "comps"], enabled: false, notes: "Incl. The Amelia / Quail sales." },
  { id: "rm-sothebys", name: "RM Sotheby’s", tier: "partnership", provides: ["listings", "comps"], enabled: false },
  { id: "gooding", name: "Gooding & Company", tier: "partnership", provides: ["listings", "comps"], enabled: false },
  { id: "broad-arrow", name: "Broad Arrow Auctions", tier: "partnership", provides: ["listings", "comps"], enabled: false },
  { id: "mecum", name: "Mecum Auctions", tier: "scrape", provides: ["listings", "comps"], enabled: false },
  { id: "barrett-jackson", name: "Barrett-Jackson", tier: "scrape", provides: ["listings", "comps"], enabled: false },

  // --- Classified marketplaces / aggregators --------------------------------
  { id: "hemmings-classifieds", name: "Hemmings (classifieds)", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "dupont-registry", name: "duPont Registry", tier: "api", provides: ["listings"], enabled: false, notes: "Often exposes schema.org Vehicle JSON-LD." },
  { id: "classic-com", name: "Classic.com", tier: "partnership", provides: ["comps"], enabled: false, notes: "Aggregator with sold data — licensable comps feed." },
  { id: "classiccars-com", name: "ClassicCars.com", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "autotrader", name: "Autotrader / Classics", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "cars-com", name: "Cars.com", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "cargurus", name: "CarGurus", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "exotic-car-trader", name: "Exotic Car Trader", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "james-edition", name: "JamesEdition", tier: "api", provides: ["listings"], enabled: false },
  { id: "rennlist", name: "Rennlist Marketplace", tier: "scrape", provides: ["listings"], enabled: false, notes: "Forum classifieds — high noise, needs strong normalization." },
  { id: "pelican-parts", name: "Pelican Parts classifieds", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "craigslist", name: "Craigslist", tier: "scrape", provides: ["listings"], enabled: false, notes: "High noise, hard to normalize." },
  { id: "facebook-marketplace", name: "Facebook Marketplace", tier: "scrape", provides: ["listings"], enabled: false, notes: "High noise, anti-bot." },

  // --- Specialist / marque dealers (air-cooled focus) -----------------------
  { id: "sloan-cars", name: "Sloan Cars", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "cpr-classic", name: "CPR Classic", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "canford-classics", name: "Canford Classics", tier: "scrape", provides: ["listings"], enabled: false, notes: "UK, ships US." },
  { id: "european-collectibles", name: "European Collectibles", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "autosport-designs", name: "Autosport Designs", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "copley-motorcars", name: "Copley Motorcars", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "cars-dawydiak", name: "Cars Dawydiak", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "willhoit", name: "Willhoit Auto Restoration", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "cultivated-collector", name: "The Cultivated Collector", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "driversource", name: "DriverSource", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "road-scholars", name: "RMD / Road Scholars", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "fantasy-junction", name: "Fantasy Junction", tier: "scrape", provides: ["listings"], enabled: false },
  { id: "porsche-classic-cpo", name: "Porsche Classic (CPO)", tier: "scrape", provides: ["listings"], enabled: false, notes: "Authorized Porsche Classic dealers — CPO air-cooled." },

  // --- Data / comps ---------------------------------------------------------
  { id: "hagerty", name: "Hagerty Valuation", tier: "partnership", provides: ["comps"], enabled: false, notes: "Price guide / valuation API — licensable." },
  { id: "sports-car-market", name: "Sports Car Market", tier: "partnership", provides: ["comps"], enabled: false, notes: "Pocket Price Guide + dealer network." },

  // --- Connector #0 ---------------------------------------------------------
  { id: "mock", name: "LUFT Mock", tier: "mock", provides: ["listings", "comps"], enabled: true },
];

export function catalogByTier() {
  const groups: Record<string, ConnectorMeta[]> = {};
  for (const s of SOURCE_CATALOG) (groups[s.tier] ??= []).push(s);
  return groups;
}
