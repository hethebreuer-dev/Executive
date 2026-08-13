// ../src/lib/luft/connectors/connector.ts
function providesListings(c) {
  return typeof c.fetchListings === "function" && c.meta.provides.includes("listings");
}
function providesComps(c) {
  return typeof c.fetchComps === "function" && c.meta.provides.includes("comps");
}
function isConfigured(c, ctx) {
  return c.isConfigured ? c.isConfigured(ctx) : true;
}
var ConnectorNotImplemented = class extends Error {
  constructor(connectorId) {
    super(`Connector "${connectorId}" is catalogued but not implemented yet.`);
    this.connectorId = connectorId;
    this.name = "ConnectorNotImplemented";
  }
};

// ../src/lib/luft/connectors/context.ts
function workerContext(env) {
  return {
    env: (key) => {
      const v = env[key];
      return typeof v === "string" ? v : void 0;
    },
    base64: (input) => btoa(input)
  };
}

// ../src/lib/luft/normalize.ts
function classifyModelFamily(title) {
  const t = title.toLowerCase();
  const year = Number(t.match(/\b(19\d{2})\b/)?.[1]);
  if (/\b912e?\b/.test(t)) return "912";
  if (/\b930\b/.test(t) || /\bturbo\b/.test(t) && year >= 1975 && year <= 1989) return "930";
  if (/\b993\b/.test(t)) return "993";
  if (/\b964\b/.test(t)) return "964";
  if (/\b911\b|\bcarrera\b|\b\bsc\b\b|\brs\b|\bslant\s?nose\b/.test(t)) {
    if (year && year > 1998) return null;
    return "911";
  }
  return null;
}
function dedupeKey(l) {
  if (l.vin) return `vin:${l.vin.toUpperCase()}`;
  return [
    l.year,
    l.modelFamily,
    l.trim.toLowerCase().replace(/\s+/g, ""),
    l.exteriorColor?.toLowerCase().replace(/\s+/g, "") ?? "",
    l.mileage != null ? Math.round(l.mileage / 1e3) : "",
    l.state ?? ""
  ].join("|");
}
function dedupeListings(listings) {
  const byKey = /* @__PURE__ */ new Map();
  for (const l of listings) {
    const key = dedupeKey(l);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, l);
      continue;
    }
    const score = (x) => (x.vin ? 2 : 0) + Math.min(x.photos.length, 8);
    const winner = score(l) >= score(existing) ? l : existing;
    winner.lastSeen = l.lastSeen > existing.lastSeen ? l.lastSeen : existing.lastSeen;
    byKey.set(key, winner);
  }
  return [...byKey.values()];
}

// ../src/lib/luft/connectors/apify.ts
function resolveActor(ctx, cfg) {
  return (cfg.actorEnv ? ctx.env(cfg.actorEnv) : void 0) || cfg.actorId || "";
}
function makeApifyConnector(cfg) {
  return {
    meta: {
      id: cfg.id,
      name: cfg.name,
      tier: "apify",
      provides: ["listings"],
      // Turned on in the registry; isConfigured gates on token + a resolved actor.
      enabled: cfg.enabled ?? true,
      ref: cfg.actorId ? `apify:${cfg.actorId}` : `apify:(set ${cfg.actorEnv ?? "actorId"})`,
      notes: "Managed Apify actor. Needs APIFY_TOKEN + an actor id (config or the actorEnv secret)."
    },
    isConfigured(ctx) {
      return Boolean(ctx.env("APIFY_TOKEN") && resolveActor(ctx, cfg));
    },
    async fetchListings(ctx) {
      const token = ctx.env("APIFY_TOKEN");
      const actorId = resolveActor(ctx, cfg);
      if (!token || !actorId) throw new ConnectorNotImplemented(cfg.id);
      const actor = actorId.replace("/", "~");
      const res = await fetch(
        `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(cfg.input ?? {})
        }
      );
      if (!res.ok) throw new Error(`Apify actor ${actorId} failed: ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      const map = cfg.map ?? guessCanonical;
      return items.map((it) => map(it, cfg)).filter((x) => x !== null);
    }
  };
}
function pick(item, keys) {
  for (const k of keys) {
    if (item[k] != null && item[k] !== "") return item[k];
    const hit = Object.keys(item).find((ik) => ik.toLowerCase() === k.toLowerCase());
    if (hit && item[hit] != null && item[hit] !== "") return item[hit];
  }
  return void 0;
}
function str(v) {
  return typeof v === "string" ? v : v == null ? void 0 : String(v);
}
function num(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isNaN(n) ? void 0 : n;
  }
  return void 0;
}
function toPhotos(v) {
  if (!Array.isArray(v)) return typeof v === "string" ? [v] : [];
  return v.map((x) => typeof x === "string" ? x : str(x?.url ?? x?.src ?? x?.imageUrl)).filter((u) => Boolean(u));
}
function bodyFrom(title) {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}
function guessCanonical(item, cfg) {
  const title = (str(pick(item, ["title", "name", "listingTitle", "heading", "headline", "vehicleTitle"])) ?? "").trim();
  const priceRaw = pick(item, ["price", "soldPrice", "sold_price", "sellingPrice", "soldFor", "salePrice", "currentBid", "current_bid", "finalBid", "winningBid", "highBid", "bidAmount", "askingPrice", "buyItNowPrice", "priceUsd", "amount", "bid"]);
  const price = num(priceRaw);
  const year = num(pick(item, ["year", "modelYear", "model_year"])) ?? num(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!title || !year || price == null) return null;
  const family = classifyModelFamily(title);
  if (!family) return null;
  const url = str(pick(item, ["url", "link", "listingUrl", "listing_url", "detailUrl", "sourceUrl", "auctionUrl", "permalink", "href"])) ?? "#";
  const sourceId = str(pick(item, ["id", "listingId", "lotId", "slug", "vin"])) ?? url;
  const location = str(pick(item, ["location", "city", "region", "sellerLocation"])) ?? "";
  const [city, state] = location.split(",").map((s) => s.trim());
  const soldAt = str(pick(item, ["soldAt", "sold_at", "soldDate"]));
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: `${cfg.id}:${sourceId}`,
    source: cfg.name,
    sourceId,
    url,
    firstSeen: now,
    lastSeen: now,
    status: soldAt ? "sold" : "active",
    year,
    modelFamily: family,
    trim: title.replace(/^\d{4}\s+(porsche\s+)?/i, ""),
    body: bodyFrom(title),
    transmission: str(pick(item, ["transmission", "gearbox"])) ?? (/automatic|tiptronic|sportomatic/i.test(title) ? "Automatic" : /manual|\d-spd|\d-speed/i.test(title) ? "Manual" : "Unknown"),
    vin: str(pick(item, ["vin", "chassis"])),
    mileage: num(pick(item, ["mileage", "miles", "odometer"])),
    exteriorColor: str(pick(item, ["exteriorColor", "color", "paint"])),
    listingType: cfg.listingType ?? (priceRaw != null && String(pick(item, ["currentBid", "bid"]) ?? "") !== "" ? "auction" : "classified"),
    sellerType: cfg.sellerType ?? "dealer",
    price,
    currency: str(pick(item, ["currency"])) ?? "USD",
    endsAt: str(pick(item, ["endsAt", "endDate", "auctionEnd"])),
    city: city || void 0,
    state: state || void 0,
    photos: toPhotos(pick(item, ["images", "photos", "imageUrls", "image_urls", "photoUrls", "imageLinks", "gallery", "media", "mainImage", "image", "thumbnail"])),
    title: title.replace(/^\d{4}\s+/, `${year} `)
  };
}

// ../src/lib/luft/connectors/apify-sites.ts
var APIFY_SITES = [
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
        "https://bringatrailer.com/porsche/993-turbo/"
      ].map((url) => ({ url }))
    },
    listingType: "auction",
    sellerType: "auction"
  },
  {
    id: "cars-and-bids",
    name: "Cars & Bids",
    actorId: "",
    actorEnv: "APIFY_ACTOR_CARS_AND_BIDS",
    input: { search: "Porsche 911", maxItems: 200 },
    listingType: "auction",
    sellerType: "private"
  },
  {
    id: "pcarmarket",
    name: "PCARMARKET",
    actorId: "",
    actorEnv: "APIFY_ACTOR_PCARMARKET",
    input: { search: "air-cooled Porsche" },
    listingType: "auction"
  },
  {
    id: "hemmings",
    name: "Hemmings",
    actorId: "",
    actorEnv: "APIFY_ACTOR_HEMMINGS",
    input: { search: "Porsche 911", maxItems: 200 },
    listingType: "classified",
    sellerType: "dealer"
  },
  {
    id: "classiccars-com",
    name: "ClassicCars.com",
    actorId: "",
    actorEnv: "APIFY_ACTOR_CLASSICCARS",
    input: { search: "Porsche 911", maxItems: 200 },
    listingType: "classified",
    sellerType: "dealer"
  },
  {
    id: "autotrader-classics",
    name: "Autotrader Classics",
    actorId: "",
    actorEnv: "APIFY_ACTOR_AUTOTRADER",
    input: { make: "Porsche", model: "911" },
    listingType: "dealer",
    sellerType: "dealer"
  }
];
var apifyConnectors = APIFY_SITES.map(makeApifyConnector);

// ../src/lib/luft/model.ts
var MIN_PLAUSIBLE_PRICE = 1e3;

// ../src/lib/luft/connectors/autotrader.ts
var ACTOR = "apify~cheerio-scraper";
function pagedSearchUrls(model, pages) {
  const urls = [];
  for (let p = 1; p <= pages; p++) {
    urls.push(
      `https://classics.autotrader.com/classic-cars-for-sale/porsche-${model}-for-sale?page=${p}&year_max=1998&year_min=1963`
    );
  }
  return urls;
}
var START_URLS = [...pagedSearchUrls("911", 11), ...pagedSearchUrls("912", 4)];
var PAGE_FUNCTION = `async function pageFunction(context) {
  var $ = context.$;

  // The state lives in a plain inline <script>. Scan script contents for the
  // assignment; context.body is the raw HTML as a fallback source.
  var blob = '';
  $('script').each(function () { var t = $(this).html() || ''; if (t.indexOf('__PRELOADED_STATE__') !== -1) blob = t; });
  if (!blob && typeof context.body === 'string') blob = context.body;

  var marker = blob.indexOf('__PRELOADED_STATE__');
  if (marker === -1) return null;
  var start = blob.indexOf('{', marker);
  if (start === -1) return null;

  // Brace-match from the first { to its partner, respecting strings/escapes.
  var depth = 0, inStr = false, esc = false, end = -1;
  for (var i = start; i < blob.length; i++) {
    var ch = blob[i];
    if (inStr) {
      if (esc) { esc = false; }
      else if (ch === '\\\\') { esc = true; }
      else if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') { depth++; }
    else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) return null;

  var state;
  try { state = JSON.parse(blob.slice(start, end)); } catch (e) { return null; }

  var L = (state && state.listings) || {};
  var bag = [];
  var vehicles = L.vehicles;
  if (vehicles && typeof vehicles === 'object') {
    Object.keys(vehicles).forEach(function (k) { bag.push(vehicles[k]); });
  }
  ['featured', 'prime'].forEach(function (key) {
    if (Array.isArray(L[key])) L[key].forEach(function (v) { if (v) bag.push(v); });
  });

  var out = [];
  bag.forEach(function (v) {
    if (!v || typeof v !== 'object') return;
    var photos = Array.isArray(v.photos) ? v.photos : [];
    out.push({
      url: v.vdp_url || '',
      title: v.title || '',
      price: typeof v.price === 'number' ? v.price : (v.price || null),
      year: typeof v.year === 'number' ? v.year : (v.year || null),
      mileage: typeof v.mileage === 'number' ? v.mileage : (v.mileage || null),
      image: photos[0] || '',
      trim: v.trim || '',
      color: v.exterior_color || '',
    });
  });
  return out;
}`;
var str2 = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
var num2 = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : void 0;
  if (typeof v === "string") {
    const digits = v.replace(/[^0-9]/g, "");
    if (!digits) return void 0;
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? void 0 : n;
  }
  return void 0;
};
function bodyFrom2(title) {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster/i.test(title)) return "Cabriolet";
  return "Coupe";
}
function autotraderMap(item) {
  const rawTitle = (str2(item.title) ?? "").trim();
  const year = num2(item.year) ?? Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!rawTitle || !year) return null;
  if (year < 1963 || year > 1998) return null;
  const family = classifyModelFamily(rawTitle);
  if (!family) return null;
  const price = num2(item.price);
  if (price == null || price < MIN_PLAUSIBLE_PRICE) return null;
  const link = str2(item.url) ?? "";
  if (!link) return null;
  const url = link.startsWith("http") ? link : `https://classics.autotrader.com${link}`;
  const trim = (str2(item.trim) ?? "").trim();
  const base = rawTitle.replace(/^\d{4}\s+porsche\s+/i, "").trim();
  const title = trim && !new RegExp(`\\b${trim}\\b`, "i").test(base) ? `${base} ${trim}` : base;
  const image = str2(item.image);
  const color = (str2(item.color) ?? "").trim() || void 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: `autotrader:${url}`,
    source: "Autotrader Classics",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title,
    body: bodyFrom2(`${title} ${rawTitle}`),
    transmission: "Unknown",
    mileage: num2(item.mileage),
    exteriorColor: color,
    listingType: "dealer",
    sellerType: "dealer",
    price,
    currency: "USD",
    photos: image ? [image] : [],
    title
  };
}
var autotraderConnector = {
  meta: {
    id: "autotrader",
    name: "Autotrader Classics",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Single-stage: parse window.__PRELOADED_STATE__ (listings.vehicles) off each enumerated ?page=N search page. Runs on APIFY_TOKEN."
  },
  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },
  async fetchListings(ctx) {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("autotrader");
    const input = {
      // Single-stage: each enumerated search page carries the full listings
      // state inline, so we scrape it directly — no link-following, no detail
      // hop (hence no linkSelector/globs).
      startUrls: START_URLS.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION,
      proxyConfiguration: { useApifyProxy: true },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 40,
      // ~15 enumerated search pages + headroom
      maxConcurrency: 8
    };
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!start.ok) throw new Error(`Autotrader start failed: ${start.status}`);
    const run = (await start.json()).data;
    const deadline = Date.now() + 28e4;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("Autotrader run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5e3));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`Autotrader poll failed: ${poll.status}`);
      status = (await poll.json()).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`Autotrader run ${status}`);
    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`Autotrader dataset failed: ${ds.status}`);
    const data = await ds.json();
    const items = Array.isArray(data) ? data : [];
    const out = [];
    for (const it of items) {
      const mapped = autotraderMap(it);
      if (mapped) out.push(mapped);
    }
    return out;
  }
};

// ../src/lib/luft/connectors/classic-com.ts
var ACTOR2 = "shahidirfan~classic-com-cars-scraper";
var START_URLS2 = [
  "https://www.classic.com/m/porsche/911/f-body/",
  // 1963–1973 (proven)
  "https://www.classic.com/m/porsche/911/g-body/",
  // 1974–1989 SC / Carrera 3.2
  "https://www.classic.com/m/porsche/911/964/",
  // 1989–1994
  "https://www.classic.com/m/porsche/911/993/",
  // 1994–1998
  // Classic.com nests the 912 under the 911 f-body taxonomy (swb/lwb + body),
  // not at /m/porsche/912/ (that path 404s and crashed the run).
  "https://www.classic.com/m/porsche/911/f-body/swb/912/coupe/",
  "https://www.classic.com/m/porsche/911/f-body/lwb/912/coupe/",
  "https://www.classic.com/m/porsche/911/f-body/swb/912/targa/"
];
var str3 = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
function parsePrice(s) {
  if (!s) return void 0;
  const digits = s.replace(/[^0-9.]/g, "");
  if (!digits) return void 0;
  const n = parseFloat(digits);
  return Number.isNaN(n) ? void 0 : Math.round(n);
}
function parseMileage(s) {
  if (!s) return void 0;
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*(k)?/i);
  if (!m) return void 0;
  const n = parseFloat(m[1]) * (m[2] ? 1e3 : 1);
  return Number.isNaN(n) ? void 0 : Math.round(n);
}
function bodyFrom3(title) {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}
function classicComMap(item) {
  const title = str3(item.title)?.trim();
  if (!title) return null;
  const location = str3(item.location) ?? "";
  if (location && !/usa|united states/i.test(location)) return null;
  const rawPrice = str3(item.price) ?? "";
  if (/€|eur|£|gbp/i.test(rawPrice)) return null;
  const price = parsePrice(rawPrice);
  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || price == null || price < MIN_PLAUSIBLE_PRICE) return null;
  const family = classifyModelFamily(title);
  if (!family) return null;
  const url = str3(item.url) ?? "#";
  const [city, state] = location.split(",").map((s) => s.trim());
  const status = /sold/i.test(str3(item.listing_status) ?? "") ? "sold" : "active";
  const primary = str3(item.image_url);
  const photos = Array.isArray(item.image_urls) ? item.image_urls.filter((u) => typeof u === "string") : primary ? [primary] : [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: `classic-com:${url}`,
    source: str3(item.seller) || "Classic.com",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status,
    year,
    modelFamily: family,
    trim: title.replace(/^\d{4}\s+porsche\s+/i, ""),
    body: bodyFrom3(title),
    transmission: str3(item.transmission) ?? "Unknown",
    mileage: parseMileage(str3(item.mileage)),
    listingType: "dealer",
    sellerType: "dealer",
    price,
    currency: str3(item.price)?.includes("\u20AC") ? "EUR" : "USD",
    city: city || void 0,
    state: state || void 0,
    photos,
    title
  };
}
var classicComConnector = {
  meta: {
    id: "classic-com",
    name: "Classic.com",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:shahidirfan/classic-com-cars-scraper",
    notes: "Aggregator (1M+ listings). Runs on APIFY_TOKEN; one actor run per generation page."
  },
  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },
  async fetchListings(ctx) {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("classic-com");
    const out = [];
    for (const startUrl of START_URLS2) {
      try {
        const res = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR2}/run-sync-get-dataset-items?token=${token}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              startUrl,
              result_type: "listings",
              results_wanted: 100,
              max_pages: 4,
              proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: [] }
            })
          }
        );
        if (!res.ok) {
          console.error(`classic.com ${startUrl}: HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        for (const it of items) {
          const mapped = classicComMap(it);
          if (mapped) out.push(mapped);
        }
      } catch (e) {
        console.error(`classic.com ${startUrl} failed:`, e);
      }
    }
    return out;
  }
};

// ../src/lib/luft/connectors/ebay.ts
var CARS_CATEGORY = "6001";
function host(ctx) {
  return ctx.env("EBAY_ENV") === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
}
var tokenCache = null;
async function appToken(ctx) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 6e4) {
    return tokenCache.token;
  }
  const basic = ctx.base64(`${ctx.env("EBAY_APP_ID")}:${ctx.env("EBAY_CERT_ID")}`);
  const res = await fetch(`${host(ctx)}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope")
  });
  if (!res.ok) throw new Error(`eBay OAuth failed: ${res.status}`);
  const json = await res.json();
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1e3
  };
  return json.access_token;
}
var ebayConnector = {
  meta: {
    id: "ebay-motors",
    name: "eBay Motors",
    tier: "api",
    provides: ["listings"],
    enabled: true,
    ref: "ebay:browse-api",
    notes: "Live via Browse API. Set EBAY_APP_ID + EBAY_CERT_ID to configure."
  },
  isConfigured(ctx) {
    return Boolean(ctx.env("EBAY_APP_ID") && ctx.env("EBAY_CERT_ID"));
  },
  async fetchListings(ctx) {
    const token = await appToken(ctx);
    const marketplace = ctx.env("EBAY_MARKETPLACE") || "EBAY_US";
    const params = new URLSearchParams({
      q: "Porsche 911 912 930 air-cooled",
      category_ids: CARS_CATEGORY,
      filter: "conditions:{USED},itemLocationCountry:US",
      sort: "newlyListed",
      limit: "200"
    });
    const res = await fetch(
      `${host(ctx)}/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": marketplace
        }
      }
    );
    if (!res.ok) throw new Error(`eBay Browse search failed: ${res.status}`);
    const json = await res.json();
    return (json.itemSummaries ?? []).map(mapItem).filter((x) => x !== null);
  }
};
function mapItem(item) {
  const title = (item.title ?? "").trim();
  const price = item.price?.value ? parseFloat(item.price.value) : NaN;
  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!title || !year || Number.isNaN(price) || price < MIN_PLAUSIBLE_PRICE) return null;
  const family = classifyModelFamily(title);
  if (!family) return null;
  const buyingOptions = item.buyingOptions ?? [];
  const listingType = buyingOptions.includes("AUCTION") ? "auction" : "bin";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const photos = [
    item.image?.imageUrl,
    ...(item.additionalImages ?? []).map((i) => i.imageUrl)
  ].filter((u) => Boolean(u));
  return {
    id: `ebay-motors:${item.itemId}`,
    source: "eBay Motors",
    sourceId: item.itemId,
    url: item.itemWebUrl ?? "#",
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title.replace(/^\d{4}\s+(porsche\s+)?/i, ""),
    body: /targa/i.test(title) ? "Targa" : /cabriolet|cab\b|convertible/i.test(title) ? "Cabriolet" : "Coupe",
    transmission: /automatic|tiptronic|sportomatic/i.test(title) ? "Automatic" : /manual|5-spd|6-spd|4-spd/i.test(title) ? "Manual" : "Unknown",
    listingType,
    sellerType: "dealer",
    // eBay Motors skews dealer; refined once seller data is pulled
    price,
    currency: item.price?.currency ?? "USD",
    endsAt: item.itemEndDate,
    city: item.itemLocation?.city,
    state: item.itemLocation?.stateOrProvince,
    photos,
    title: title.replace(/^\d{4}\s+/, `${year} `)
  };
}

// ../src/lib/luft/connectors/elferspot.ts
var ACTOR3 = "apify~cheerio-scraper";
var START_URLS3 = [
  "https://www.elferspot.com/en/search/?series%5B%5D=911-f-model&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=912&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=911-g-model&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=930&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=964&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=993&country%5B%5D=C_NA&sorting=newest"
];
var PAGE_FUNCTION2 = `async function pageFunction(context) {
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
var str4 = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
function parsePrice2(s) {
  const currency = /eur|€/i.test(s) ? "EUR" : "USD";
  const first = s.replace(/,/g, "").match(/\d+/);
  const n = first ? parseInt(first[0], 10) : NaN;
  return { price: Number.isNaN(n) ? void 0 : n, currency };
}
function parseMileage2(s) {
  if (!s) return void 0;
  const m = s.replace(/[,.](?=\d{3}\b)/g, "").match(/([\d]+)/);
  if (!m) return void 0;
  let n = parseInt(m[1], 10);
  if (/\bkm\b/i.test(s)) n = Math.round(n * 0.621371);
  return Number.isNaN(n) ? void 0 : n;
}
function bodyFrom4(body) {
  const b = (body ?? "").toLowerCase();
  if (/targa/.test(b)) return "Targa";
  if (/cabrio|convertible|spyder|speedster/.test(b)) return "Cabriolet";
  return "Coupe";
}
function elferspotMap(item) {
  const specs = item.specs ?? {};
  const model = (specs["Model"] ?? "").trim();
  const year = Number((specs["Year of construction"] ?? "").match(/\b(19|20)\d{2}\b/)?.[0]);
  const title = model || (str4(item.title) ?? "").replace(/^porsche\s+/i, "").trim();
  if (!title || !year) return null;
  const family = classifyModelFamily(`${year} Porsche ${title}`);
  if (!family) return null;
  const { price, currency } = parsePrice2(str4(item.price) ?? "");
  if (price == null || currency !== "USD" || price < MIN_PLAUSIBLE_PRICE) return null;
  const url = str4(item.url) ?? "#";
  const vin = (specs["VIN"] ?? "").match(/\b[A-HJ-NPR-Z0-9]{11,17}\b/i)?.[0];
  const image = str4(item.image);
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
    body: bodyFrom4(specs["Body"]),
    transmission: specs["Transmission"] || "Unknown",
    vin,
    mileage: parseMileage2(specs["Mileage"]),
    exteriorColor: specs["Exterior color"] || void 0,
    interiorColor: specs["Interior color"] || void 0,
    listingType: "dealer",
    sellerType: "dealer",
    price,
    currency,
    // Elferspot exposes only the country for location.
    city: /united states|usa/i.test(specs["Car location"] ?? "") ? "United States" : void 0,
    state: void 0,
    photos: image ? [image] : [],
    title
  };
}
var elferspotConnector = {
  meta: {
    id: "elferspot",
    name: "Elferspot",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Two-stage cheerio crawl of the 6 NA generation pages. Runs on APIFY_TOKEN."
  },
  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },
  async fetchListings(ctx) {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("elferspot");
    const input = {
      startUrls: START_URLS3.map((url) => ({ url })),
      linkSelector: "a.content-teaser",
      globs: [{ glob: "https://www.elferspot.com/en/car/*" }],
      pageFunction: PAGE_FUNCTION2,
      proxyConfiguration: { useApifyProxy: true },
      maxRequestsPerCrawl: 400,
      maxConcurrency: 20
    };
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR3}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!start.ok) throw new Error(`Elferspot start failed: ${start.status}`);
    const run = (await start.json()).data;
    const deadline = Date.now() + 28e4;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("Elferspot run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5e3));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`Elferspot poll failed: ${poll.status}`);
      status = (await poll.json()).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`Elferspot run ${status}`);
    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`Elferspot dataset failed: ${ds.status}`);
    const data = await ds.json();
    const items = Array.isArray(data) ? data : [];
    const out = [];
    for (const it of items) {
      const mapped = elferspotMap(it);
      if (mapped) out.push(mapped);
    }
    return out;
  }
};

// ../src/lib/luft/connectors/mock-connector.ts
var NOW = "2026-07-21T00:00:00.000Z";
function seed(n, data) {
  const slug = data.source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: `${slug}:${n}`,
    sourceId: String(n),
    url: "#",
    firstSeen: NOW,
    lastSeen: NOW,
    status: "active",
    currency: "USD",
    photos: [],
    ...data
  };
}
var MOCK_LISTINGS = [
  seed(1, { source: "Broad Arrow", year: 1973, title: "911 Carrera RS 2.7", trim: "Carrera RS 2.7", modelFamily: "911", body: "Coupe", transmission: "5-spd manual", mileage: 42100, city: "Emory", state: "CA", listingType: "auction", sellerType: "auction", price: 875e3, matchingNumbers: true, compDeltaPct: 6, caption: "Carrera RS \u2014 front 3/4", blurb: "Matching-numbers Lightweight in Grand Prix White with the signature Carrera script. Documented Emory refresh, ducktail intact." }),
  seed(2, { source: "RM Sotheby\u2019s", year: 1997, title: "993 Carrera S", trim: "Carrera S", modelFamily: "993", body: "Coupe", transmission: "6-spd manual", mileage: 28500, city: "Denver", state: "CO", listingType: "auction", sellerType: "auction", price: 189e3, compDeltaPct: 11, caption: "993 C2S \u2014 profile" }),
  seed(3, { source: "Bring a Trailer", year: 1989, title: "911 Carrera 3.2 (G50)", trim: "Carrera 3.2", modelFamily: "911", body: "Coupe", transmission: "5-spd G50", mileage: 61e3, city: "Chicago", state: "IL", listingType: "auction", sellerType: "private", price: 89500, compDeltaPct: -3, caption: "Carrera 3.2 \u2014 rear 3/4" }),
  seed(4, { source: "Elferspot", year: 1987, title: "930 Turbo", trim: "Turbo", modelFamily: "930", body: "Coupe", transmission: "4-spd manual", mileage: 33900, city: "Miami", state: "FL", listingType: "dealer", sellerType: "dealer", price: 142e3, compDeltaPct: 2, caption: "930 Turbo \u2014 whale tail" }),
  seed(5, { source: "PCARMARKET", year: 1994, title: "964 Carrera 2", trim: "Carrera 2", modelFamily: "964", body: "Coupe", transmission: "5-spd manual", mileage: 74200, city: "Portland", state: "OR", listingType: "auction", sellerType: "private", price: 78900, compDeltaPct: -1, caption: "964 C2 \u2014 front" }),
  seed(6, { source: "Cars & Bids", year: 1979, title: "911 SC", trim: "SC", modelFamily: "911", body: "Coupe", transmission: "5-spd 915", mileage: 88400, city: "Austin", state: "TX", listingType: "auction", sellerType: "private", price: 52e3, compDeltaPct: 0, caption: "911 SC \u2014 profile" }),
  seed(7, { source: "Gooding & Co", year: 1991, title: "964 Turbo 3.3", trim: "Turbo 3.3", modelFamily: "964", body: "Coupe", transmission: "5-spd manual", mileage: 41600, city: "New York", state: "NY", listingType: "auction", sellerType: "auction", price: 265e3, compDeltaPct: 8, caption: "964 Turbo \u2014 rear" }),
  seed(8, { source: "Hemmings", year: 1969, title: "912", trim: "912", modelFamily: "912", body: "Coupe", transmission: "5-spd manual", mileage: 102e3, city: "Nashville", state: "TN", listingType: "classified", sellerType: "private", price: 46500, compDeltaPct: 4, caption: "912 \u2014 front 3/4" }),
  seed(9, { source: "Bring a Trailer", year: 1985, title: "911 Carrera Targa", trim: "Carrera", modelFamily: "911", body: "Targa", transmission: "5-spd 915", mileage: 79300, city: "Seattle", state: "WA", listingType: "auction", sellerType: "private", price: 58750, compDeltaPct: -2, caption: "Carrera Targa" }),
  seed(10, { source: "Broad Arrow", year: 1972, title: "911 T", trim: "T", modelFamily: "911", body: "Coupe", transmission: "5-spd 915", mileage: 65e3, city: "Los Angeles", state: "CA", listingType: "auction", sellerType: "auction", price: 118e3, compDeltaPct: 3, caption: "911 T \u2014 oil-flap" }),
  seed(11, { source: "Barrett-Jackson", year: 1998, title: "993 Turbo S", trim: "Turbo S", modelFamily: "993", body: "Coupe", transmission: "6-spd manual", mileage: 19800, city: "Scottsdale", state: "AZ", listingType: "auction", sellerType: "auction", price: 525e3, compDeltaPct: 14, caption: "993 Turbo S" }),
  seed(12, { source: "Cars & Bids", year: 1976, title: "912E", trim: "912E", modelFamily: "912", body: "Coupe", transmission: "5-spd manual", mileage: 91200, city: "Boston", state: "MA", listingType: "auction", sellerType: "private", price: 39900, compDeltaPct: -4, caption: "912E \u2014 profile" })
];
var MOCK_COMPS = [
  { id: "bat:rs27-1", source: "Bring a Trailer", modelFamily: "911", trim: "Carrera RS 2.7", year: 1973, soldPrice: 868e3, soldAt: "2026-01-15", mileage: 38e3 },
  { id: "gooding:rs27-1", source: "Gooding & Co", modelFamily: "911", trim: "Carrera RS 2.7", year: 1973, soldPrice: 842e3, soldAt: "2026-05-02", mileage: 51e3 },
  { id: "classic:993cs-1", source: "Classic.com", modelFamily: "993", trim: "Carrera S", year: 1997, soldPrice: 182500, soldAt: "2026-07-18", mileage: 31200 },
  { id: "bat:g50-1", source: "Bring a Trailer", modelFamily: "911", trim: "Carrera 3.2", year: 1989, soldPrice: 94e3, soldAt: "2026-07-16", mileage: 58900 },
  { id: "pcar:930-1", source: "PCARMARKET", modelFamily: "930", trim: "Turbo", year: 1987, soldPrice: 149750, soldAt: "2026-07-15", mileage: 44100 },
  { id: "bat:964c2-1", source: "Bring a Trailer", modelFamily: "964", trim: "Carrera 2", year: 1994, soldPrice: 76250, soldAt: "2026-07-11", mileage: 71800 }
];
var mockConnector = {
  meta: {
    id: "mock",
    name: "LUFT Mock",
    tier: "mock",
    provides: ["listings", "comps"],
    enabled: true,
    notes: "Seeded placeholder data \u2014 connector #0. Remove once real sources cover the catalog."
  },
  // Off by default now that real sources cover the catalog — opt in with
  // LUFT_ENABLE_MOCK=1 (e.g. local dev against an empty D1). This is a code
  // default, so production never ingests mock rows without a dashboard variable.
  isConfigured(ctx) {
    return ctx.env("LUFT_ENABLE_MOCK") === "1";
  },
  async fetchListings() {
    return MOCK_LISTINGS;
  },
  async fetchComps() {
    return MOCK_COMPS;
  }
};

// ../src/lib/luft/registry.ts
var CONNECTORS = [
  mockConnector,
  // connector #0 — off by default; opt in with LUFT_ENABLE_MOCK=1
  ebayConnector,
  // configured when EBAY_APP_ID + EBAY_CERT_ID are set
  classicComConnector,
  // working MVP source — runs on APIFY_TOKEN alone
  elferspotConnector,
  // two-stage cheerio crawl — runs on APIFY_TOKEN alone
  autotraderConnector,
  // single-stage cheerio crawl — runs on APIFY_TOKEN alone
  ...apifyConnectors
  // other Apify-actor sources (need actorId/actorEnv)
];
var activeConnectors = (ctx) => CONNECTORS.filter((c) => c.meta.enabled && isConfigured(c, ctx));

// src/index.ts
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-submit-secret,x-admin-secret"
};
var IMAGE_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};
var MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
async function ensureUserColumns(db) {
  const cols = [
    "seller_name TEXT",
    "seller_email TEXT",
    "seller_phone TEXT",
    "seller_contact TEXT",
    "submitted_at TEXT"
  ];
  for (const c of cols) {
    try {
      await db.prepare(`ALTER TABLE listings ADD COLUMN ${c}`).run();
    } catch {
    }
  }
}
async function insertUserListing(db, p) {
  const id = `user:${crypto.randomUUID()}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const photos = Array.isArray(p.photos) ? p.photos.slice(0, 24) : [];
  const dedupe = (p.vin || `${p.year}-${p.modelFamily}-${p.sellerEmail}`).toLowerCase();
  await db.prepare(
    `INSERT INTO listings (
         id, source, source_id, url, first_seen, last_seen, status, year,
         model_family, trim, body, transmission, vin, matching_numbers, mileage,
         exterior_color, interior_color, listing_type, seller_type, price, currency,
         ends_at, city, state, comp_delta_pct, photos, title, caption, blurb, dedupe_key,
         seller_name, seller_email, seller_phone, seller_contact, submitted_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    id,
    "LUFT Seller",
    id,
    "",
    now,
    now,
    "pending",
    p.year ?? 0,
    p.modelFamily ?? "911",
    p.trim ?? "",
    p.body ?? "Coupe",
    p.transmission ?? "Manual",
    p.vin ?? null,
    p.matchingNumbers == null ? null : p.matchingNumbers ? 1 : 0,
    p.mileage ?? null,
    p.exteriorColor ?? null,
    p.interiorColor ?? null,
    "classified",
    p.sellerType === "dealer" ? "dealer" : "private",
    Math.round(p.price ?? 0),
    p.currency ?? "USD",
    null,
    p.city ?? null,
    p.state ?? null,
    null,
    JSON.stringify(photos),
    p.title ?? "",
    p.caption ?? null,
    p.blurb ?? null,
    dedupe,
    p.sellerName ?? null,
    p.sellerEmail ?? null,
    p.sellerPhone ?? null,
    p.sellerContact ?? null,
    now
  ).run();
  return id;
}
async function ingest(env) {
  const ctx = workerContext(env);
  const connectors = activeConnectors(ctx);
  await migrateDedupeIndex(env.DB);
  const perConnector = await Promise.all(
    connectors.filter(providesListings).map(async (c) => {
      try {
        return { id: c.meta.id, items: await c.fetchListings(ctx), error: void 0 };
      } catch (e) {
        console.error(`[${c.meta.id}] listings failed:`, e);
        return {
          id: c.meta.id,
          items: [],
          error: e instanceof Error ? e.message : String(e)
        };
      }
    })
  );
  const merged = dedupeListings(perConnector.flatMap((r) => r.items));
  const byId = /* @__PURE__ */ new Map();
  for (const l of merged) byId.set(l.id, l);
  const listings = [...byId.values()];
  await upsertListings(env.DB, listings);
  const staleCutoff = new Date(Date.now() - 6 * 60 * 60 * 1e3).toISOString();
  let swept = 0;
  for (const r of perConnector) {
    if (!r.items.length) continue;
    try {
      const res = await env.DB.prepare(
        "DELETE FROM listings WHERE status = 'active' AND last_seen < ? AND id LIKE ?"
      ).bind(staleCutoff, `${r.id}:%`).run();
      swept += res.meta?.changes ?? 0;
    } catch (e) {
      console.error(`[${r.id}] sweep failed:`, e);
    }
  }
  const compResults = await Promise.all(
    connectors.filter(providesComps).map(
      (c) => c.fetchComps(ctx).catch((e) => {
        console.error(`[${c.meta.id}] comps failed:`, e);
        return [];
      })
    )
  );
  const comps = compResults.flat();
  await upsertComps(env.DB, comps);
  const sources = perConnector.map((r) => ({
    id: r.id,
    count: r.items.length,
    ...r.error ? { error: r.error } : {}
  }));
  return { listings: listings.length, comps: comps.length, swept, sources };
}
async function migrateDedupeIndex(db) {
  try {
    await db.batch([
      db.prepare("DROP INDEX IF EXISTS idx_listings_dedupe"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_listings_dedupe ON listings(dedupe_key)")
    ]);
  } catch (e) {
    console.error("dedupe index migration skipped:", e);
  }
}
async function upsertListings(db, listings) {
  if (!listings.length) return;
  const stmt = db.prepare(
    `INSERT INTO listings (
       id, source, source_id, url, first_seen, last_seen, status, year,
       model_family, trim, body, transmission, vin, matching_numbers, mileage,
       exterior_color, interior_color, listing_type, seller_type, price, currency,
       ends_at, city, state, comp_delta_pct, photos, title, caption, blurb, dedupe_key
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       last_seen=excluded.last_seen, status=excluded.status, price=excluded.price,
       comp_delta_pct=excluded.comp_delta_pct, photos=excluded.photos,
       url=excluded.url, title=excluded.title, mileage=excluded.mileage,
       dedupe_key=excluded.dedupe_key`
  );
  const bound = listings.map(
    (l) => stmt.bind(
      l.id,
      l.source,
      l.sourceId,
      l.url,
      l.firstSeen,
      l.lastSeen,
      l.status,
      l.year,
      l.modelFamily,
      l.trim,
      l.body,
      l.transmission,
      l.vin ?? null,
      l.matchingNumbers == null ? null : l.matchingNumbers ? 1 : 0,
      l.mileage ?? null,
      l.exteriorColor ?? null,
      l.interiorColor ?? null,
      l.listingType,
      l.sellerType,
      Math.round(l.price),
      l.currency,
      l.endsAt ?? null,
      l.city ?? null,
      l.state ?? null,
      l.compDeltaPct ?? null,
      JSON.stringify(l.photos ?? []),
      l.title,
      l.caption ?? null,
      l.blurb ?? null,
      dedupeKey(l)
    )
  );
  const CHUNK = 25;
  for (let i = 0; i < bound.length; i += CHUNK) {
    await db.batch(bound.slice(i, i + CHUNK));
  }
}
async function upsertComps(db, comps) {
  if (!comps.length) return;
  const stmt = db.prepare(
    `INSERT INTO sold_comps (id, source, model_family, trim, year, sold_price, sold_at, mileage, url)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET sold_price=excluded.sold_price, sold_at=excluded.sold_at`
  );
  await db.batch(
    comps.map(
      (c) => stmt.bind(
        c.id,
        c.source,
        c.modelFamily,
        c.trim,
        c.year,
        Math.round(c.soldPrice),
        c.soldAt,
        c.mileage ?? null,
        c.url ?? null
      )
    )
  );
}
var handler = {
  // Scheduled ingestion (cron in wrangler.toml).
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      ingest(env).then((r) => console.log("ingest ok:", r)).catch((e) => console.error("ingest failed:", e))
    );
  },
  // Manual trigger + health check.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (url.pathname === "/health") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM listings").first();
      return Response.json({ ok: true, listings: row?.n ?? 0 });
    }
    if (url.pathname === "/upload" && request.method === "POST") {
      if (!env.PHOTOS) return Response.json({ error: "Uploads not configured" }, { status: 503, headers: CORS });
      const ct = request.headers.get("content-type") || "";
      const ext = IMAGE_EXT[ct];
      if (!ext) return Response.json({ error: "Only JPEG/PNG/WebP/GIF/AVIF images" }, { status: 415, headers: CORS });
      const buf = await request.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_UPLOAD_BYTES) {
        return Response.json({ error: "Image must be 1 byte\u201310 MB" }, { status: 413, headers: CORS });
      }
      const key = `${crypto.randomUUID()}.${ext}`;
      await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: ct } });
      return Response.json({ url: `${url.origin}/photo/${key}` }, { headers: CORS });
    }
    if (url.pathname.startsWith("/photo/") && request.method === "GET") {
      if (!env.PHOTOS) return new Response("Not found", { status: 404 });
      const key = decodeURIComponent(url.pathname.slice("/photo/".length));
      const obj = await env.PHOTOS.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }
    if (url.pathname === "/submit" && request.method === "POST") {
      if (!env.SUBMIT_SECRET || request.headers.get("x-submit-secret") !== env.SUBMIT_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      let p;
      try {
        p = await request.json();
      } catch {
        return Response.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
      }
      if (!p.title || !p.year || !p.modelFamily || !p.price || !p.sellerEmail) {
        return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS });
      }
      try {
        await ensureUserColumns(env.DB);
        const id = await insertUserListing(env.DB, p);
        return Response.json({ ok: true, id }, { headers: CORS });
      } catch (e) {
        console.error("submit failed:", e);
        return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500, headers: CORS });
      }
    }
    if (url.pathname === "/admin/pending" && request.method === "GET") {
      if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      await ensureUserColumns(env.DB);
      const { results } = await env.DB.prepare(
        `SELECT id, title, year, model_family, price, seller_name, seller_email,
                seller_phone, seller_contact, city, state, submitted_at, photos
           FROM listings WHERE status = 'pending' ORDER BY submitted_at DESC`
      ).all();
      return Response.json({ ok: true, pending: results ?? [] }, { headers: CORS });
    }
    if (url.pathname === "/admin/moderate" && request.method === "POST") {
      if (!env.ADMIN_SECRET || request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
      }
      if (!body.id || body.action !== "approve" && body.action !== "reject") {
        return Response.json({ error: "id and action (approve|reject) required" }, { status: 400, headers: CORS });
      }
      const status = body.action === "approve" ? "active" : "withdrawn";
      const res = await env.DB.prepare(
        "UPDATE listings SET status = ? WHERE id = ? AND id LIKE 'user:%'"
      ).bind(status, body.id).run();
      return Response.json({ ok: true, changed: res.meta?.changes ?? 0, status }, { headers: CORS });
    }
    if (url.pathname === "/ingest" && request.method === "POST") {
      if (!env.INGEST_SECRET || request.headers.get("x-ingest-secret") !== env.INGEST_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }
      try {
        const result = await ingest(env);
        return Response.json({ ok: true, ...result });
      } catch (e) {
        console.error("ingest failed:", e);
        const message = e instanceof Error ? `${e.message}
${e.stack ?? ""}` : String(e);
        return Response.json({ ok: false, error: message }, { status: 500 });
      }
    }
    return new Response("LUFT ingest worker", { status: 200 });
  }
};
var src_default = handler;
export {
  src_default as default
};
