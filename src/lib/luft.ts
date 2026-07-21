// LUFT shared data + helpers.
// Figures here (214 listings, $95k median, 12,400 comps, "↑ 4.8% / 90d",
// per-car prices) are placeholders from the design spec — wire to a real
// catalog/comps API in production.

export const TAGLINE = "Buy. Sell. Breathe air-cooled.";
export const DISCLAIMER = "Not affiliated with Dr. Ing. h.c. F. Porsche AG";
export const SOURCES_LINE = "Aggregated from 40+ US sources";

export type ModelKey = "all" | "911" | "912" | "930" | "964" | "993";

export const MODEL_DEFS: { key: ModelKey; label: string }[] = [
  { key: "all", label: "All air-cooled" },
  { key: "911", label: "911 / SC / Carrera" },
  { key: "912", label: "912" },
  { key: "930", label: "930 Turbo" },
  { key: "964", label: "964" },
  { key: "993", label: "993" },
];

export type Listing = {
  id: number;
  year: number;
  title: string;
  key: Exclude<ModelKey, "all">;
  price: number;
  miles: number;
  trans: string;
  body: string;
  city: string;
  state: string;
  source: string;
  delta: number; // % vs comps
  caption: string;
  blurb: string;
};

export const LISTINGS: Listing[] = [
  { id: 1, year: 1973, title: "911 Carrera RS 2.7", key: "911", price: 875000, miles: 42100, trans: "5-spd manual", body: "Coupe", city: "Emory", state: "CA", source: "Broad Arrow", delta: 6, caption: "Carrera RS — front 3/4", blurb: "Matching-numbers Lightweight in Grand Prix White with the signature Carrera script. Documented Emory refresh, ducktail intact." },
  { id: 2, year: 1997, title: "993 Carrera S", key: "993", price: 189000, miles: 28500, trans: "6-spd manual", body: "Coupe", city: "Denver", state: "CO", source: "RM Sotheby’s", delta: 11, caption: "993 C2S — profile", blurb: "" },
  { id: 3, year: 1989, title: "911 Carrera 3.2 (G50)", key: "911", price: 89500, miles: 61000, trans: "5-spd G50", body: "Coupe", city: "Chicago", state: "IL", source: "Bring a Trailer", delta: -3, caption: "Carrera 3.2 — rear 3/4", blurb: "" },
  { id: 4, year: 1987, title: "930 Turbo", key: "930", price: 142000, miles: 33900, trans: "4-spd manual", body: "Coupe", city: "Miami", state: "FL", source: "Elferspot", delta: 2, caption: "930 Turbo — whale tail", blurb: "" },
  { id: 5, year: 1994, title: "964 Carrera 2", key: "964", price: 78900, miles: 74200, trans: "5-spd manual", body: "Coupe", city: "Portland", state: "OR", source: "PCARMARKET", delta: -1, caption: "964 C2 — front", blurb: "" },
  { id: 6, year: 1979, title: "911 SC", key: "911", price: 52000, miles: 88400, trans: "5-spd 915", body: "Coupe", city: "Austin", state: "TX", source: "Cars & Bids", delta: 0, caption: "911 SC — profile", blurb: "" },
  { id: 7, year: 1991, title: "964 Turbo 3.3", key: "964", price: 265000, miles: 41600, trans: "5-spd manual", body: "Coupe", city: "New York", state: "NY", source: "Gooding & Co", delta: 8, caption: "964 Turbo — rear", blurb: "" },
  { id: 8, year: 1969, title: "912", key: "912", price: 46500, miles: 102000, trans: "5-spd manual", body: "Coupe", city: "Nashville", state: "TN", source: "Hemmings", delta: 4, caption: "912 — front 3/4", blurb: "" },
  { id: 9, year: 1985, title: "911 Carrera Targa", key: "911", price: 58750, miles: 79300, trans: "5-spd 915", body: "Targa", city: "Seattle", state: "WA", source: "Bring a Trailer", delta: -2, caption: "Carrera Targa", blurb: "" },
  { id: 10, year: 1972, title: "911 T", key: "911", price: 118000, miles: 65000, trans: "5-spd 915", body: "Coupe", city: "Los Angeles", state: "CA", source: "Broad Arrow", delta: 3, caption: "911 T — oil-flap", blurb: "" },
  { id: 11, year: 1998, title: "993 Turbo S", key: "993", price: 525000, miles: 19800, trans: "6-spd manual", body: "Coupe", city: "Scottsdale", state: "AZ", source: "Barrett-Jackson", delta: 14, caption: "993 Turbo S", blurb: "" },
  { id: 12, year: 1976, title: "912E", key: "912", price: 39900, miles: 91200, trans: "5-spd manual", body: "Coupe", city: "Boston", state: "MA", source: "Cars & Bids", delta: -4, caption: "912E — profile", blurb: "" },
];

export const GENERATIONS = [
  { key: "912", label: "912", years: "1965–1976", from: "from $38k" },
  { key: "911", label: "911 · SC · Carrera", years: "1965–1989", from: "from $48k" },
  { key: "930", label: "930 Turbo", years: "1975–1989", from: "from $120k" },
  { key: "964", label: "964", years: "1989–1994", from: "from $70k" },
  { key: "993", label: "993", years: "1994–1998", from: "from $95k" },
];

export const usd = (n: number) => "$" + n.toLocaleString("en-US");
export const usdk = (n: number) =>
  n >= 1000 ? "$" + Math.round(n / 1000) + "k" : "$" + n;
export const miles = (n: number) => n.toLocaleString("en-US") + " mi";

export function deltaText(d: number) {
  return d > 0 ? "+" + d + "% vs comps" : d < 0 ? d + "% vs comps" : "At market";
}
export function deltaColor(d: number) {
  return d > 0 ? "#0d0d0d" : d < 0 ? "#7a7a76" : "#9a9a95";
}
