// PCARMARKET via the managed apify/web-scraper actor.
//
// PCARMARKET's marketplace grid is rendered client-side (JavaScript), so a
// cheerio (no-JS) scraper only caught a stray link or two. web-scraper runs a
// real Chromium browser, executes the page's JS, waits for the listing grid to
// render, then extracts the cards. Scrapes the Porsche marketplace pre-filtered
// server-side to the air-cooled years (startYear=1964&endYear=1998).
// Runs on APIFY_TOKEN. Emits a diagnostic when it finds nothing.

import { MIN_PLAUSIBLE_PRICE, type BodyStyle, type CanonicalListing } from "../model";
import { classifyModelFamily } from "../normalize";
import {
  ConnectorNotImplemented,
  type ConnectorMeta,
  type ListingConnector,
} from "./connector";

type Raw = Record<string, unknown>;

const ACTOR = "apify~web-scraper";

// Air-cooled Porsche cars, year-filtered server-side. Paginated with ?page=N.
function browseUrls(pages: number): string[] {
  const base =
    "https://www.pcarmarket.com/marketplace?itemType=cars&make=porsche&startYear=1964&endYear=1998&porscheOnly=true";
  const urls: string[] = [];
  for (let p = 1; p <= pages; p++) urls.push(`${base}&page=${p}`);
  return urls;
}
const START_URLS = browseUrls(3);

// Runs IN the browser (web-scraper) after the page loads. Waits for the client-
// rendered /auction/ links, then extracts one record per listing card with
// vanilla DOM. Returns a diagnostic object when nothing renders.
const PAGE_FUNCTION = `async function pageFunction(context) {
  function waitFor(sel, ms) {
    return new Promise(function (res) {
      var t = Date.now();
      (function chk() {
        if (document.querySelector(sel)) return res(true);
        if (Date.now() - t > ms) return res(false);
        setTimeout(chk, 300);
      })();
    });
  }
  await waitFor('a[href*="/auction/"]', 20000);
  await new Promise(function (r) { setTimeout(r, 1500); }); // let lazy cards settle

  function priceIn(text) { var m = (text || '').match(/\\$[0-9][0-9,]{2,}/); return m ? m[0] : ''; }
  var out = [], seen = {};
  Array.prototype.slice.call(document.querySelectorAll('a[href*="/auction/"]')).forEach(function (a) {
    var href = a.href || a.getAttribute('href') || '';
    if (href.indexOf('/auction/') === -1) return;
    href = href.split('?')[0];
    if (seen[href]) return;
    var card = a.closest('[class*="listing"],[class*="card"],[class*="item"],li,article,div') || a;
    var title = (a.getAttribute('title') || a.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!title || title.length < 4) {
      var h = card.querySelector('h2,h3,[class*="title"]');
      title = h ? h.textContent.replace(/\\s+/g, ' ').trim() : title;
    }
    if (!title || title.length < 4) return;
    seen[href] = true;
    var imgEl = card.querySelector('img');
    var img = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : '';
    out.push({ url: href, title: title, price: priceIn(card.textContent), image: img });
  });
  if (out.length) return out;

  var bodyText = (document.body.innerText || '').replace(/\\s+/g, ' ').trim();
  return {
    __diag: true,
    url: (context.request && context.request.url) || location.href,
    pageTitle: document.title,
    auctionLinks: document.querySelectorAll('a[href*="/auction/"]').length,
    bodyLen: bodyText.length,
    textHead: bodyText.slice(0, 220)
  };
}`;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);

function parsePrice(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const first = s.split(/\bto\b|–|-/i)[0];
  const cleaned = first.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function bodyFrom(title: string): BodyStyle {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}

export function pcarmarketMap(item: Raw): CanonicalListing | null {
  const rawTitle = (str(item.title) ?? "").trim();
  const link = str(item.url) ?? "";
  if (!rawTitle || !link) return null;
  const url = link.startsWith("http") ? link : `https://www.pcarmarket.com${link}`;

  const year = Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || year < 1963 || year > 1998) return null; // air-cooled range only

  const family = classifyModelFamily(rawTitle, year);
  if (!family) return null; // air-cooled 911/912/930/964/993 only

  const price = parsePrice(item.price);
  if (price == null || price < MIN_PLAUSIBLE_PRICE) return null;

  const image = str(item.image);
  const title = rawTitle.replace(/^\d{4}\s+/, "").replace(/^porsche\s+/i, "").trim() || rawTitle;
  const now = new Date().toISOString();

  return {
    id: `pcarmarket:${url}`,
    source: "PCARMARKET",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title,
    body: bodyFrom(rawTitle),
    transmission: "Unknown",
    listingType: "auction",
    sellerType: "private",
    price,
    currency: "USD",
    photos: image ? [image] : [],
    title,
  };
}

export const pcarmarketConnector: ListingConnector = {
  meta: {
    id: "pcarmarket",
    name: "PCARMARKET",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Air-cooled Porsche listings from PCARMARKET's year-filtered marketplace. Runs on APIFY_TOKEN.",
  } satisfies ConnectorMeta,

  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },

  async fetchListings(ctx): Promise<CanonicalListing[]> {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("pcarmarket");

    const input = {
      startUrls: START_URLS.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true },
      injectJQuery: false, // page-function uses vanilla DOM
      maxRequestRetries: 2,
      maxRequestsPerCrawl: 8,
      maxConcurrency: 2,
      pageLoadTimeoutSecs: 60,
    };

    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) throw new Error(`PCARMARKET start failed: ${start.status}`);
    const run = ((await start.json()) as {
      data: { id: string; defaultDatasetId: string; status: string };
    }).data;

    const deadline = Date.now() + 280_000;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("PCARMARKET run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`PCARMARKET poll failed: ${poll.status}`);
      status = ((await poll.json()) as { data: { status: string } }).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`PCARMARKET run ${status}`);

    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`PCARMARKET dataset failed: ${ds.status}`);
    const data = (await ds.json()) as unknown;
    const items: Raw[] = Array.isArray(data) ? (data as Raw[]) : [];

    if (items.length === 0) {
      throw new Error("PCARMARKET returned an empty dataset — requests likely blocked (no pages fetched).");
    }

    const diag = items.find((it) => it && it.__diag);
    const rawCards = items.filter((it) => it && !it.__diag);

    const byId = new Map<string, CanonicalListing>();
    for (const it of rawCards) {
      const mapped = pcarmarketMap(it);
      if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    const cars = [...byId.values()];

    if (cars.length === 0) {
      if (diag) {
        throw new Error(
          `PCARMARKET found no listing cards. url=${str(diag.url)} title="${str(diag.pageTitle)}" ` +
            `h1="${str(diag.h1)}" auction-links=${str(diag.auctionLinks)} bodyLen=${str(diag.bodyLen)} :: ${str(diag.textHead)}`
        );
      }
      if (rawCards.length) {
        const s = rawCards[0];
        throw new Error(
          `PCARMARKET scraped ${rawCards.length} cards but 0 passed the air-cooled filter. ` +
            `sample: title="${str(s.title)}" price="${str(s.price)}"`
        );
      }
    }
    return cars;
  },
};
