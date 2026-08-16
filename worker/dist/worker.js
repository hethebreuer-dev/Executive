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
function classifyModelFamily(title, yearHint) {
  const t = title.toLowerCase();
  const year = yearHint || Number(t.match(/\b(19\d{2})\b/)?.[1]) || 0;
  if (/\b912e?\b/.test(t)) return "912";
  if (/\b964\b/.test(t)) return "964";
  if (/\b993\b/.test(t)) return "993";
  if (/\b930\b/.test(t)) return "930";
  if (/\bturbo\b/.test(t) && year >= 1975 && year <= 1989) return "930";
  const is911 = /\b911\b|\bcarrera\b|\bsc\b|\brs\b|\btarga\b|\bspeedster\b|\bslant\s?nose\b/.test(t);
  if (!is911) return null;
  if (year > 1998) return null;
  if (year >= 1995) return "993";
  if (year >= 1990) return "964";
  return "911";
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
  const family = classifyModelFamily(title, year ?? void 0);
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
  const family = classifyModelFamily(rawTitle, year ?? void 0);
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

// ../src/lib/luft/connectors/bring-a-trailer.ts
var ACTOR2 = "apify~cheerio-scraper";
var START_URLS2 = [
  "https://bringatrailer.com/porsche/911/",
  "https://bringatrailer.com/porsche/912/"
];
var PAGE_FUNCTION2 = `async function pageFunction(context) {
  var $ = context.$;
  var results = [];
  var seen = {};

  function pushItem(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    var url = '';
    ['url','permalink','link','listing_url','href'].forEach(function (k) {
      if (!url && typeof o[k] === 'string' && o[k].indexOf('/listing/') !== -1) url = o[k];
    });
    if (!url) return;
    if (url.indexOf('http') !== 0) url = 'https://bringatrailer.com' + url;
    if (seen[url]) return;
    var title = o.title || o.name || o.headline || o.post_title || '';
    if (!title) return;
    seen[url] = true;

    var img = '';
    ['thumbnail_url','image','thumbnail','photo','image_url','featured_image'].forEach(function (k) {
      if (img) return;
      var v = o[k];
      if (typeof v === 'string') img = v;
      else if (v && typeof v === 'object' && typeof v.url === 'string') img = v.url;
    });

    var bid = null;
    ['current_bid','current_bid_formatted','high_bid','price','amount','bid'].forEach(function (k) {
      if (bid == null && o[k] != null) bid = o[k];
    });
    var end = o.timestamp_end || o.end_timestamp || o.ends_at || o.auction_end || o.timestamp || null;
    var sold = o.sold_for || o.sold_text || o.sold || null;
    var active = (o.active !== undefined) ? o.active : (o.is_active !== undefined ? o.is_active : null);

    results.push({
      url: url,
      title: String(title),
      year: o.year || null,
      bid: bid,
      image: img,
      end: end,
      sold: sold ? 1 : 0,
      active: active === null ? null : (active ? 1 : 0)
    });
  }

  function walk(node, depth) {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) walk(node[i], depth + 1); return; }
    if (typeof node === 'object') {
      pushItem(node);
      var keys = Object.keys(node);
      for (var j = 0; j < keys.length; j++) {
        var v = node[keys[j]];
        if (v && typeof v === 'object') walk(v, depth + 1);
      }
    }
  }

  // 1) Embedded JSON \u2014 application/json blocks and any inline script that
  //    mentions a listing URL. Try a straight parse; only walk what parses.
  $('script').each(function () {
    var t = $(this).html() || '';
    if (t.length < 40 || t.indexOf('/listing/') === -1) return;
    var parsed = null;
    try { parsed = JSON.parse(t); } catch (e) { parsed = null; }
    if (parsed) walk(parsed, 0);
  });

  // 2) React/props mount nodes carrying JSON in a data-* attribute.
  $('[data-listing],[data-listings],[data-props],[data-react-props],[data-item]').each(function () {
    var self = this;
    ['data-listing','data-listings','data-props','data-react-props','data-item'].forEach(function (attr) {
      var raw = $(self).attr(attr);
      if (!raw) return;
      try { walk(JSON.parse(raw), 0); } catch (e) {}
    });
  });

  // 3) Last-resort DOM fallback: anchor cards linking to an auction.
  if (results.length === 0) {
    $('a[href*="/listing/"]').each(function () {
      var href = $(this).attr('href') || '';
      if (href.indexOf('/listing/') === -1) return;
      if (href.indexOf('http') !== 0) href = 'https://bringatrailer.com' + href;
      if (seen[href]) return;
      var title = ($(this).attr('title') || $(this).text() || '').trim().replace(/\\s+/g, ' ');
      if (!title || title.length < 4) return;
      seen[href] = true;
      results.push({ url: href, title: title, year: null, bid: null, image: '', end: null, sold: 0, active: null });
    });
  }

  return results;
}`;
var str3 = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
var num3 = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : void 0;
  if (typeof v === "string") {
    const digits = v.replace(/[^0-9]/g, "");
    if (!digits) return void 0;
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? void 0 : n;
  }
  return void 0;
};
function toEndMs(v) {
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v > 1e12) return v;
    if (v > 1e9) return v * 1e3;
    return void 0;
  }
  if (typeof v === "string") {
    const asNum = Number(v);
    if (Number.isFinite(asNum) && asNum > 1e9) return toEndMs(asNum);
    const t = Date.parse(v);
    return Number.isNaN(t) ? void 0 : t;
  }
  return void 0;
}
function bodyFrom3(title) {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster/i.test(title)) return "Cabriolet";
  return "Coupe";
}
function bringATrailerMap(item) {
  const rawTitle = (str3(item.title) ?? "").trim();
  const link = str3(item.url) ?? "";
  if (!rawTitle || !link) return null;
  const url = link.startsWith("http") ? link : `https://bringatrailer.com${link}`;
  const year = num3(item.year) ?? Number(rawTitle.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || year < 1963 || year > 1998) return null;
  const family = classifyModelFamily(rawTitle, year);
  if (!family) return null;
  if (num3(item.sold)) return null;
  if (item.active === 0) return null;
  const endMs = toEndMs(item.end);
  if (endMs != null && endMs < Date.now()) return null;
  const price = num3(item.bid);
  if (price == null || price < MIN_PLAUSIBLE_PRICE) return null;
  const title = rawTitle.replace(/^\d{4}\s+/, "").replace(/^porsche\s+/i, "").trim() || rawTitle;
  const image = str3(item.image);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: `bringatrailer:${url}`,
    source: "Bring a Trailer",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: title,
    body: bodyFrom3(rawTitle),
    transmission: "Unknown",
    listingType: "auction",
    sellerType: "auction",
    price,
    currency: "USD",
    endsAt: endMs != null ? new Date(endMs).toISOString() : void 0,
    photos: image ? [image] : [],
    title
  };
}
var bringATrailerConnector = {
  meta: {
    id: "bring-a-trailer",
    name: "Bring a Trailer",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Live air-cooled auctions from BaT Porsche model pages. OPT-IN: needs APIFY_TOKEN and LUFT_ENABLE_BAT (BaT ToS restricts scraping; keep off unless intended)."
  },
  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN")) && Boolean(ctx.env("LUFT_ENABLE_BAT"));
  },
  async fetchListings(ctx) {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("bring-a-trailer");
    const input = {
      startUrls: START_URLS2.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION2,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 12,
      maxConcurrency: 4
    };
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR2}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!start.ok) throw new Error(`BaT start failed: ${start.status}`);
    const run = (await start.json()).data;
    const deadline = Date.now() + 28e4;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("BaT run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5e3));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`BaT poll failed: ${poll.status}`);
      status = (await poll.json()).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`BaT run ${status}`);
    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`BaT dataset failed: ${ds.status}`);
    const data = await ds.json();
    const items = Array.isArray(data) ? data : [];
    const byId = /* @__PURE__ */ new Map();
    for (const it of items) {
      const mapped = bringATrailerMap(it);
      if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    return [...byId.values()];
  }
};

// ../src/lib/luft/connectors/classic-com.ts
var ACTOR3 = "shahidirfan~classic-com-cars-scraper";
var START_URLS3 = [
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
var str4 = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
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
function bodyFrom4(title) {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}
function classicComMap(item) {
  const title = str4(item.title)?.trim();
  if (!title) return null;
  const location = str4(item.location) ?? "";
  if (location && !/usa|united states/i.test(location)) return null;
  const rawPrice = str4(item.price) ?? "";
  if (/€|eur|£|gbp/i.test(rawPrice)) return null;
  const price = parsePrice(rawPrice);
  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || price == null || price < MIN_PLAUSIBLE_PRICE) return null;
  const cleanTitle = title.replace(/^\d{4}\s+/, "").replace(/^porsche\s+/i, "").trim() || title;
  const family = classifyModelFamily(title, year ?? void 0);
  if (!family) return null;
  const url = str4(item.url) ?? "#";
  const [city, state] = location.split(",").map((s) => s.trim());
  const status = /sold/i.test(str4(item.listing_status) ?? "") ? "sold" : "active";
  const primary = str4(item.image_url);
  const photos = Array.isArray(item.image_urls) ? item.image_urls.filter((u) => typeof u === "string") : primary ? [primary] : [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: `classic-com:${url}`,
    source: str4(item.seller) || "Classic.com",
    sourceId: url,
    url,
    firstSeen: now,
    lastSeen: now,
    status,
    year,
    modelFamily: family,
    trim: cleanTitle,
    body: bodyFrom4(title),
    transmission: str4(item.transmission) ?? "Unknown",
    mileage: parseMileage(str4(item.mileage)),
    listingType: "dealer",
    sellerType: "dealer",
    price,
    currency: str4(item.price)?.includes("\u20AC") ? "EUR" : "USD",
    city: city || void 0,
    state: state || void 0,
    photos,
    title: cleanTitle
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
    for (const startUrl of START_URLS3) {
      try {
        const res = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR3}/run-sync-get-dataset-items?token=${token}`,
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
var ACTOR4 = "apify~cheerio-scraper";
function kw(query, pages) {
  const q = encodeURIComponent(query);
  const urls = [];
  for (let p = 1; p <= pages; p++) {
    urls.push(`https://www.ebay.com/sch/i.html?_nkw=${q}&_sacat=6001&_ipg=60&_pgn=${p}`);
  }
  return urls;
}
var START_URLS4 = [
  ...kw("porsche 911", 4),
  ...kw("porsche 911 SC", 1),
  ...kw("porsche 911 carrera 3.2", 1),
  ...kw("porsche 911 targa", 1),
  ...kw("porsche 912", 1),
  ...kw("porsche 930", 2),
  ...kw("porsche 964", 2),
  ...kw("porsche 993", 2)
];
var PAGE_FUNCTION3 = `async function pageFunction(context) {
  var $ = context.$;
  var out = [];
  function addFrom(sel) {
    $(sel).each(function () {
      var el = $(this);
      var a = el.is('a') ? el : el.find('a[href*="/itm/"]').first();
      var link = a.attr('href') || el.find('.s-item__link, .s-card__link').attr('href') || '';
      if (!link || link.indexOf('/itm/') === -1) return;
      link = link.split('?')[0];
      var title = (el.find('.s-item__title, .s-card__title, [role=heading]').first().text() || a.attr('title') || a.text() || '').replace(/^\\s*New Listing/i, '').trim();
      if (!title || title.toLowerCase() === 'shop on ebay') return;
      var price = (el.find('.s-item__price, .s-card__price').first().text() || '').trim();
      var img = el.find('img').attr('src') || el.find('img').attr('data-src') || '';
      var loc = (el.find('.s-item__location, .s-item__itemLocation, .s-card__location').text() || '').trim();
      var opts = (el.find('.s-item__bids, .s-item__purchase-options-with-icon, .s-card__attribute-row').text() || '').trim();
      out.push({ url: link, title: title, price: price, image: img, location: loc, opts: opts });
    });
  }
  addFrom('li.s-item');
  if (out.length === 0) addFrom('.s-item');
  if (out.length === 0) addFrom('.s-card');
  if (out.length === 0) addFrom('li[data-viewport]');
  if (out.length === 0) addFrom('a[href*="/itm/"]');

  var seen = {}; var uniq = [];
  out.forEach(function (o) { if (!seen[o.url]) { seen[o.url] = 1; uniq.push(o); } });
  if (uniq.length > 0) return uniq;

  // Nothing matched \u2014 return a diagnostic snapshot of the page.
  var bodyText = ($('body').text() || '').replace(/\\s+/g, ' ').trim();
  return [{
    __diag: true,
    url: context.request ? context.request.url : '',
    pageTitle: ($('title').text() || '').trim(),
    h1: ($('h1').first().text() || '').trim(),
    sItem: $('.s-item').length,
    sCard: $('.s-card').length,
    itmLinks: $('a[href*="/itm/"]').length,
    bodyLen: bodyText.length,
    textHead: bodyText.slice(0, 220)
  }];
}`;
var str5 = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
function parsePrice2(v) {
  const s = str5(v);
  if (!s) return null;
  const first = s.split(/\bto\b|–|-/i)[0];
  const cleaned = first.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}
function bodyFrom5(title) {
  if (/targa/i.test(title)) return "Targa";
  if (/cabriolet|convertible|cabrio|speedster|\bcab\b/i.test(title)) return "Cabriolet";
  return "Coupe";
}
var NOT_A_CAR = /\b(wheel|wheels|fuchs|seat|seats|engine|transmission|gearbox|hood|bumper|manual|brochure|poster|model|1:18|1\/18|toy|shift knob|steering wheel|mirror|door|fender|badge|emblem|sign|key|jacket|watch)\b/i;
function ebayMap(item) {
  const title = (str5(item.title) ?? "").trim();
  const link = str5(item.url) ?? "";
  if (!title || !link) return null;
  if (NOT_A_CAR.test(title)) return null;
  const year = Number(title.match(/\b(19\d{2})\b/)?.[1]);
  if (!year || year < 1963 || year > 1998) return null;
  const family = classifyModelFamily(title, year);
  if (!family) return null;
  const price = parsePrice2(item.price);
  if (price == null || price < MIN_PLAUSIBLE_PRICE) return null;
  const url = link.startsWith("http") ? link : `https://www.ebay.com${link}`;
  const itemId = url.match(/\/itm\/(?:.*?\/)?(\d{6,})/)?.[1] ?? url;
  const opts = (str5(item.opts) ?? "").toLowerCase();
  const listingType = /bid|auction/.test(opts) ? "auction" : "bin";
  const image = str5(item.image);
  const location = (str5(item.location) ?? "").replace(/^from\s+/i, "").trim();
  const [city, state] = location.split(",").map((s) => s.trim());
  const clean = title.replace(/^\d{4}\s+/, "").replace(/^porsche\s+/i, "").trim() || title;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: `ebay-motors:${itemId}`,
    source: "eBay Motors",
    sourceId: itemId,
    url,
    firstSeen: now,
    lastSeen: now,
    status: "active",
    year,
    modelFamily: family,
    trim: clean,
    body: bodyFrom5(title),
    transmission: /automatic|tiptronic|sportomatic/i.test(title) ? "Automatic" : /manual|5-spd|6-spd|4-spd|5 speed/i.test(title) ? "Manual" : "Unknown",
    listingType,
    sellerType: "dealer",
    // eBay Motors skews dealer
    price,
    currency: "USD",
    city: city || void 0,
    state: state || void 0,
    photos: image ? [image] : [],
    title: clean
  };
}
var ebayConnector = {
  meta: {
    id: "ebay-motors",
    name: "eBay Motors",
    tier: "apify",
    provides: ["listings"],
    enabled: true,
    ref: "apify:apify/cheerio-scraper",
    notes: "Scrapes public eBay Motors search results (official Browse API path unavailable \u2014 dev account denied). Runs on APIFY_TOKEN."
  },
  isConfigured(ctx) {
    return Boolean(ctx.env("APIFY_TOKEN"));
  },
  async fetchListings(ctx) {
    const token = ctx.env("APIFY_TOKEN");
    if (!token) throw new ConnectorNotImplemented("ebay-motors");
    const input = {
      startUrls: START_URLS4.map((url) => ({ url })),
      pageFunction: PAGE_FUNCTION3,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxRequestRetries: 3,
      maxRequestsPerCrawl: 20,
      maxConcurrency: 6
    };
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR4}/runs?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!start.ok) throw new Error(`eBay start failed: ${start.status}`);
    const run = (await start.json()).data;
    const deadline = Date.now() + 28e4;
    let status = run.status;
    while (status === "READY" || status === "RUNNING") {
      if (Date.now() > deadline) throw new Error("eBay run timed out (still running)");
      await new Promise((r) => setTimeout(r, 5e3));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
      if (!poll.ok) throw new Error(`eBay poll failed: ${poll.status}`);
      status = (await poll.json()).data.status;
    }
    if (status !== "SUCCEEDED") throw new Error(`eBay run ${status}`);
    const ds = await fetch(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`
    );
    if (!ds.ok) throw new Error(`eBay dataset failed: ${ds.status}`);
    const data = await ds.json();
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) {
      throw new Error("eBay returned an empty dataset \u2014 requests likely blocked (no pages fetched).");
    }
    const diag = items.find((it) => it && it.__diag);
    const rawCards = items.filter((it) => it && !it.__diag);
    const byId = /* @__PURE__ */ new Map();
    for (const it of rawCards) {
      const mapped = ebayMap(it);
      if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    const cars = [...byId.values()];
    if (cars.length === 0) {
      if (diag) {
        throw new Error(
          `eBay found no item cards. url=${str5(diag.url)} title="${str5(diag.pageTitle)}" h1="${str5(diag.h1)}" s-item=${str5(diag.sItem)} s-card=${str5(diag.sCard)} itm-links=${str5(diag.itmLinks)} bodyLen=${str5(diag.bodyLen)} :: ${str5(diag.textHead)}`
        );
      }
      if (rawCards.length) {
        const s = rawCards[0];
        throw new Error(
          `eBay scraped ${rawCards.length} cards but 0 passed the air-cooled filter. sample: title="${str5(s.title)}" price="${str5(s.price)}"`
        );
      }
    }
    return cars;
  }
};

// ../src/lib/luft/connectors/elferspot.ts
var ACTOR5 = "apify~cheerio-scraper";
var START_URLS5 = [
  "https://www.elferspot.com/en/search/?series%5B%5D=911-f-model&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=912&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=911-g-model&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=930&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=964&country%5B%5D=C_NA&sorting=newest",
  "https://www.elferspot.com/en/search/?series%5B%5D=993&country%5B%5D=C_NA&sorting=newest"
];
var PAGE_FUNCTION4 = `async function pageFunction(context) {
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
var str6 = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
function parsePrice3(s) {
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
function bodyFrom6(body) {
  const b = (body ?? "").toLowerCase();
  if (/targa/.test(b)) return "Targa";
  if (/cabrio|convertible|spyder|speedster/.test(b)) return "Cabriolet";
  return "Coupe";
}
function elferspotMap(item) {
  const specs = item.specs ?? {};
  const model = (specs["Model"] ?? "").trim();
  const year = Number((specs["Year of construction"] ?? "").match(/\b(19|20)\d{2}\b/)?.[0]);
  const title = model || (str6(item.title) ?? "").replace(/^porsche\s+/i, "").trim();
  if (!title || !year) return null;
  const family = classifyModelFamily(`${year} Porsche ${title}`);
  if (!family) return null;
  const { price, currency } = parsePrice3(str6(item.price) ?? "");
  if (price == null || currency !== "USD" || price < MIN_PLAUSIBLE_PRICE) return null;
  const url = str6(item.url) ?? "#";
  const vin = (specs["VIN"] ?? "").match(/\b[A-HJ-NPR-Z0-9]{11,17}\b/i)?.[0];
  const image = str6(item.image);
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
    body: bodyFrom6(specs["Body"]),
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
      startUrls: START_URLS5.map((url) => ({ url })),
      linkSelector: "a.content-teaser",
      globs: [{ glob: "https://www.elferspot.com/en/car/*" }],
      pageFunction: PAGE_FUNCTION4,
      proxyConfiguration: { useApifyProxy: true },
      maxRequestsPerCrawl: 400,
      maxConcurrency: 20
    };
    const start = await fetch(`https://api.apify.com/v2/acts/${ACTOR5}/runs?token=${token}`, {
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
  // eBay Motors scrape (Browse API path denied) — runs on APIFY_TOKEN
  classicComConnector,
  // working MVP source — runs on APIFY_TOKEN alone
  elferspotConnector,
  // two-stage cheerio crawl — runs on APIFY_TOKEN alone
  autotraderConnector,
  // single-stage cheerio crawl — runs on APIFY_TOKEN alone
  bringATrailerConnector,
  // live BaT auctions — OPT-IN: needs APIFY_TOKEN + LUFT_ENABLE_BAT
  ...apifyConnectors
  // other Apify-actor sources (need actorId/actorEnv)
];
var activeConnectors = (ctx) => CONNECTORS.filter((c) => c.meta.enabled && isConfigured(c, ctx));

// src/index.ts
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-submit-secret,x-admin-secret,x-subscribe-secret"
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
async function ensureSubscribers(db) {
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS subscribers (
           email TEXT PRIMARY KEY,
           status TEXT NOT NULL DEFAULT 'active',
           token TEXT NOT NULL,
           created_at TEXT NOT NULL,
           last_sent TEXT
         )`
    ).run();
  } catch (e) {
    console.error("ensureSubscribers failed:", e);
  }
}
var isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
var esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function renderDigestHtml(cars, env) {
  const money = (n, cur) => (cur === "EUR" ? "\u20AC" : "$") + Math.round(n).toLocaleString("en-US");
  const cards = cars.map((c) => {
    const photo = (() => {
      try {
        const arr = JSON.parse(c.photos || "[]");
        return Array.isArray(arr) && arr[0] ? String(arr[0]) : "";
      } catch {
        return "";
      }
    })();
    const loc = [c.city, c.state].filter(Boolean).join(", ");
    const meta = [c.source, loc, c.mileage ? `${c.mileage.toLocaleString("en-US")} mi` : ""].filter(Boolean).join(" \xB7 ");
    const img = photo ? `<img src="${esc(photo)}" width="160" height="120" alt="" style="width:160px;height:120px;object-fit:cover;display:block;border:1px solid #e6e5e2;background:#e5e4e0" />` : `<div style="width:160px;height:120px;background:#f1f0ed;border:1px solid #e6e5e2"></div>`;
    return `<tr>
        <td width="160" style="padding:0 16px 20px 0;vertical-align:top">${img}</td>
        <td style="padding:0 0 20px 0;vertical-align:top;font-family:Arial,Helvetica,sans-serif">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a8a85">${esc(c.model_family)}</div>
          <div style="font-size:18px;font-weight:700;color:#0d0d0d;margin:4px 0 2px">${esc(String(c.year))} ${esc(c.title)}</div>
          <div style="font-size:14px;color:#5e5e5a;margin-bottom:6px">${esc(meta)}</div>
          <div style="font-size:18px;font-weight:700;color:#0d0d0d;margin-bottom:8px">${money(c.price, c.currency)}</div>
          <a href="${esc(c.url)}" style="display:inline-block;background:#0d0d0d;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:9px 16px">View listing \u2192</a>
        </td>
      </tr>`;
  }).join("");
  const browse = env.APP_BASE_URL ? `${env.APP_BASE_URL.replace(/\/$/, "")}/marketplace` : "#";
  return `<!doctype html><html><body style="margin:0;background:#f2f1ef;padding:24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e6e5e2">
        <tr><td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif">
          <div style="font-size:26px;font-weight:800;letter-spacing:1px;color:#0d0d0d">LUFT</div>
          <div style="font-size:13px;color:#8a8a85;letter-spacing:2px;text-transform:uppercase">Air-cooled \xB7 new today</div>
        </td></tr>
        <tr><td style="padding:16px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table></td></tr>
        <tr><td style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif">
          <a href="${esc(browse)}" style="display:inline-block;border:1px solid #0d0d0d;color:#0d0d0d;text-decoration:none;font-size:13px;font-weight:700;padding:10px 18px">Browse the full marketplace \u2192</a>
        </td></tr>
      </table>
    </td></tr></table>
    __UNSUB__
  </body></html>`;
}
function unsubFooter(env, token) {
  const base = (env.APP_BASE_URL || "").replace(/\/$/, "");
  const link = base ? `${base}/unsubscribe?token=${encodeURIComponent(token)}` : "#";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8a85">
    You're getting this because you subscribed to LUFT new-listing alerts.<br/>
    <a href="${link}" style="color:#8a8a85">Unsubscribe</a>
  </td></tr></table>`;
}
async function resendBatch(env, emails) {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(emails)
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
async function resendSend(env, to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html })
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
function renderConfirmHtml(env, token) {
  const base = (env.APP_BASE_URL || "").replace(/\/$/, "");
  const link = base ? `${base}/confirm?token=${encodeURIComponent(token)}` : "#";
  return `<!doctype html><html><body style="margin:0;background:#f2f1ef;padding:24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e6e5e2">
        <tr><td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif">
          <div style="font-size:26px;font-weight:800;letter-spacing:1px;color:#0d0d0d">LUFT</div>
          <div style="font-size:13px;color:#8a8a85;letter-spacing:2px;text-transform:uppercase">Confirm your subscription</div>
        </td></tr>
        <tr><td style="padding:16px 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#3f3f3d;line-height:1.6">
          One click and you'll get a daily email of every air-cooled 911, 912, and 930 that just came to market.
        </td></tr>
        <tr><td style="padding:16px 32px 8px">
          <a href="${esc(link)}" style="display:inline-block;background:#0d0d0d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px">Confirm subscription \u2192</a>
        </td></tr>
        <tr><td style="padding:12px 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8a85">
          If you didn't request this, just ignore this email \u2014 you won't be subscribed.
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
async function sendDailyDigest(env) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { sent: 0, newListings: 0, reason: "email not configured" };
  await ensureSubscribers(env.DB);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
  const { results: cars } = await env.DB.prepare(
    `SELECT id, title, year, price, currency, photos, url, source, city, state, model_family, mileage
       FROM listings WHERE status = 'active' AND first_seen >= ? ORDER BY first_seen DESC LIMIT 60`
  ).bind(cutoff).all();
  if (!cars?.length) return { sent: 0, newListings: 0, reason: "no new listings" };
  const { results: subs } = await env.DB.prepare(
    "SELECT email, token FROM subscribers WHERE status = 'active'"
  ).all();
  if (!subs?.length) return { sent: 0, newListings: cars.length, reason: "no subscribers" };
  const body = renderDigestHtml(cars, env);
  const subject = `${cars.length} new air-cooled listing${cars.length === 1 ? "" : "s"} on LUFT`;
  const base = (env.APP_BASE_URL || "").replace(/\/$/, "");
  let sent = 0;
  for (let i = 0; i < subs.length; i += 100) {
    const chunk = subs.slice(i, i + 100);
    const emails = chunk.map((s) => ({
      from: env.EMAIL_FROM,
      to: [s.email],
      subject,
      html: body.replace("__UNSUB__", unsubFooter(env, s.token)),
      // List-Unsubscribe header — mail clients (esp. Gmail/Yahoo/AOL) surface a
      // native "Unsubscribe" control and reward its presence with better inbox
      // placement. Points at the same token-based unsubscribe page.
      ...base ? { headers: { "List-Unsubscribe": `<${base}/unsubscribe?token=${encodeURIComponent(s.token)}>` } } : {}
    }));
    await resendBatch(env, emails);
    sent += chunk.length;
  }
  await env.DB.prepare("UPDATE subscribers SET last_sent = ? WHERE status = 'active'").bind((/* @__PURE__ */ new Date()).toISOString()).run();
  return { sent, newListings: cars.length };
}
var handler = {
  // Scheduled ingestion (cron in wrangler.toml). The digest runs AFTER the
  // ingest so today's new arrivals (their first_seen) are already in D1.
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      ingest(env).then((r) => console.log("ingest ok:", r)).then(() => sendDailyDigest(env)).then((d) => console.log("digest:", d)).catch((e) => console.error("scheduled run failed:", e))
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
    if (url.pathname === "/subscribe" && request.method === "POST") {
      if (!env.SUBSCRIBE_SECRET || request.headers.get("x-subscribe-secret") !== env.SUBSCRIBE_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      let b;
      try {
        b = await request.json();
      } catch {
        return Response.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
      }
      const email = (b.email || "").trim().toLowerCase();
      if (!isEmail(email)) return Response.json({ error: "Enter a valid email." }, { status: 400, headers: CORS });
      try {
        await ensureSubscribers(env.DB);
        await env.DB.prepare(
          `INSERT INTO subscribers (email, status, token, created_at) VALUES (?, 'pending', ?, ?)
           ON CONFLICT(email) DO UPDATE SET
             status = CASE WHEN subscribers.status = 'active' THEN 'active' ELSE 'pending' END`
        ).bind(email, crypto.randomUUID(), (/* @__PURE__ */ new Date()).toISOString()).run();
        const row = await env.DB.prepare("SELECT status, token FROM subscribers WHERE email = ?").bind(email).first();
        if (row?.status === "active") {
          return Response.json({ ok: true, status: "active" }, { headers: CORS });
        }
        if (row?.token && env.RESEND_API_KEY && env.EMAIL_FROM) {
          try {
            await resendSend(env, email, "Confirm your LUFT subscription", renderConfirmHtml(env, row.token));
          } catch (e) {
            console.error("confirm email failed:", e);
          }
        }
        return Response.json({ ok: true, status: "pending" }, { headers: CORS });
      } catch (e) {
        console.error("subscribe failed:", e);
        return Response.json({ error: "Could not subscribe." }, { status: 500, headers: CORS });
      }
    }
    if (url.pathname === "/confirm" && request.method === "POST") {
      if (!env.SUBSCRIBE_SECRET || request.headers.get("x-subscribe-secret") !== env.SUBSCRIBE_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      let b;
      try {
        b = await request.json();
      } catch {
        return Response.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
      }
      if (!b.token) return Response.json({ error: "Missing token" }, { status: 400, headers: CORS });
      await ensureSubscribers(env.DB);
      await env.DB.prepare("UPDATE subscribers SET status = 'active' WHERE token = ? AND status = 'pending'").bind(b.token).run();
      const row = await env.DB.prepare("SELECT status FROM subscribers WHERE token = ?").bind(b.token).first();
      return Response.json({ ok: true, status: row?.status ?? "unknown" }, { headers: CORS });
    }
    if (url.pathname === "/unsubscribe" && request.method === "POST") {
      if (!env.SUBSCRIBE_SECRET || request.headers.get("x-subscribe-secret") !== env.SUBSCRIBE_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }
      let b;
      try {
        b = await request.json();
      } catch {
        return Response.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
      }
      if (!b.token) return Response.json({ error: "Missing token" }, { status: 400, headers: CORS });
      await ensureSubscribers(env.DB);
      const res = await env.DB.prepare("UPDATE subscribers SET status = 'unsubscribed' WHERE token = ?").bind(b.token).run();
      return Response.json({ ok: true, changed: res.meta?.changes ?? 0 }, { headers: CORS });
    }
    if (url.pathname === "/digest" && request.method === "POST") {
      if (!env.INGEST_SECRET || request.headers.get("x-ingest-secret") !== env.INGEST_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }
      try {
        const d = await sendDailyDigest(env);
        return Response.json({ ok: true, ...d });
      } catch (e) {
        return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
      }
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
var index_default = handler;
export {
  index_default as default
};
