// Elferspot via the managed apify/cheerio-scraper actor.
//
// Elferspot blocks datacenter fetches (403), and there's no dedicated actor, so
// we drive the generic cheerio scraper: crawl the 6 North-America generation
// search pages, enqueue each car's detail link, and extract the price + spec
// table from the detail page (the search cards carry no price). One actor run
// per ingest; output mapped to the canonical model like every other source.

import type { BodyStyle, CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "apify~cheerio-scraper";

// North-America, newest-first, one per air-cooled generation.
const START_URLS = [
  "https://www.elferspot.com/en/search/?series%5B%5D=911-f-model&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=912&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=911-g-model&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=930&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=964&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=993&country%5B%5D=C_NA&sorting=newest",
];

// Runs inside the actor. On a detail page (/en/car/…) it returns the price and
// the whole fahrzeugdaten spec table as a {label: value} map; search pages
// return null (their car links are enqueued via linkSelector + globs).
const PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;
  var url = context.request.url;
  if (url.indexOf('/en/car/') === -1) return null;
  var price = $('.price .p').first().text().replace(/\\s+/g, ' ').trim();
  var specs = {};
  $('table.fahrzeugdaten tr').each(function () {
    var label = $(this).find('td.label').text().replace(/\\s+/g, ' ').replace(/:\\s*$/, '').trim();
    var value = $(this).find('td.content').text().replace(/\\s+/g, ' ').trim();
    if (label) specs[label] = value;
  });
  var image = $('meta[property="og:image"]').attr('content') || '';
  return { url: url, price: price, image: image, specs: specs };
}`;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

/** "USD 239,995" → {price:239995, currency:"USD"} · "Price on request" → {} */
function parsePrice(s: string): { price?: number; currency: string } {
  const currency = /eur|€/i.test(s) ? "EUR" : "USD";
  const digits = s.replace(/[^0-9]/g, "");
  const n = digits ? parseInt(digits, 10) : NaN;
  return { price: Number.isNaN(n) ? undefined : n, currency };
}

/** "12,672 mi" → 12672 · "45.000 km" → 27962 (km normalized to miles) */
function parseMileage(s?: string): number | undefined {
  if (!s) return undefined;
  const m = s.replace(/[,.](?=\d{3}\b)/g, "").match(/([\d]+)/);
  if (!m) return undefined;
  let n = parseInt(m[1], 10);
  if (/\bkm\b/i.test(s)) n = Math.round(n * 0.621371);
  return Number.isNaN(n) ? undefined : n;
}

function bodyFrom(body?: string): BodyStyle {
  const b = (body ?? "").toLowerCase();
  if (/targa/.test(b)) return "Targa";
  if (/cabrio|convertible|spyder|speedster/.test(b)) return "Cabriolet";
  return "Coupe";
}

export function elferspotMap(item: Raw): CanonicalListing | null {
  const specs = (item.specs ?? {}) as Record<string, string>;
  const model = (specs["Model"] ?? "").trim();
  const year = Number((specs["Year of construction"] ?? "").match(/\b(19|20)\d{2}\b/)?.[0]);
  const title = model || (str(item.title) ?? "").replace(/^porsche\s+/i, "").trim();
  if (!title || !year) return null;

  const family = classifyModelFamily(`${year} Porsche ${title}`);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const { price, currency } = parsePrice(str(item.price) ?? "");
  if (price == null || currency !== "USD") return null; // drop POA + non-USD (protect USD medians)

  const url = str(item.url) ?? "#";
  const vin = (specs["VIN"] ?? "").match(/\b[A-HJ-NPR-Z0-9]{11,17}\b/i)?.[0];
  const image = str(item.image);
  const now = new Date().toISOString();

  return {
    id: `elferspot:${url}`,
    source: "Elferspot",
    sourceId: specs["Elferspot ID"] || url,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title,
    body: bodyFrom(specs["Body"]),
    transmission: specs["Transmission"] || "Unknown",
    vin,
    mileage: parseMileage(specs["Mileage"]),
    exteriorColor: specs["Exterior color"] || undefined,
    interiorColor: specs["Interior color"] || undefined,
    listingType: "dealer",
    sellerType: "dealer",
    price,
    currency,
    // Elferspot exposes only the country for location.
    city: /united states|usa/i.test(specs["Car location"] ?? "") ? "United States" : undefined,
    state: undefined,
    photos: image ? [image] : [],
    title,
  };
}

export const elferspotConnector: ListingConnector = {
  meta: {
    id: "elferspot",
    name: "Elferspot",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Two-stage cheerio crawl of the 6 NA generation pages. Runs on APIFY_TOKEN.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("elferspot");

    const input = {
      startUrls: START_URLS.map((url) => ({ url })),
      linkSelector: "a.content-teaser",
      globs: [{ glob: "https://www.elferspot.com/en/car/*" }],
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true },
      maxRequestsPerCrawl: 400,
      maxConcurrency: 20,
    };

    // The crawl loads one page per car and takes minutes — past run-sync's ~100s
    // gateway limit (a 524). So start the run async, poll it, then read the
    // dataset; every request here stays short.
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) throw new Error(`Elferspot start failed: ${start.status}`);
    const run = ((await start.json()) as {
      data: { id: string; defaultDatasetId: string; status: string };
    }).data;

    const deadline = Date.now() + 280_000; // ~4.7 min ceiling
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("Elferspot run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`Elferspot poll failed: ${poll.status}`);
      status = ((await poll.json()) as { data: { status: string } }).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`Elferspot run ${status}`);

    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`Elferspot dataset failed: ${ds.status}`);

    const data = (await ds.json()) as unknown;
    const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];
    const out: CanonicalListing[] = [];
    for (const it of items) {
      const mapped = elferspotMap(it);
      if (mapped) out.push(mapped);
    }
    return out;
  },
};
