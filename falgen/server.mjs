// falgen — a personal, local-only image generator on top of Stability AI.
//
// Design goals:
//   * Standalone. Zero npm dependencies (Node built-ins only), no framework.
//   * Private. Binds to 127.0.0.1 only, so it is not reachable from the network.
//     A password gate adds defense-in-depth on top of that.
//   * Safe with your key. STABILITY_KEY lives on the server and is never sent to
//     the browser; the browser talks only to this proxy.
//
// Run:  cp .env.example .env  (fill in STABILITY_KEY + APP_PASSWORD)  then  npm start

import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- tiny .env loader (no dotenv dependency) --------------------------------
function loadEnv() {
  const path = join(__dirname, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

const PORT = Number(process.env.PORT || 5178);
const HOST = "127.0.0.1"; // localhost only — never bind to 0.0.0.0 for this tool
const STABILITY_KEY = process.env.STABILITY_KEY || "";
const STABILITY_HOST = "https://api.stability.ai";

// Password gate. If APP_PASSWORD is unset we generate a one-off and print it,
// so the app is never accidentally left wide open.
let APP_PASSWORD = process.env.APP_PASSWORD || "";
if (!APP_PASSWORD) {
  APP_PASSWORD = randomBytes(9).toString("base64url");
  console.log(
    `\n  No APP_PASSWORD set. Using a temporary one for this run:\n\n      ${APP_PASSWORD}\n\n  Set APP_PASSWORD in falgen/.env to make it permanent.\n`
  );
}

// --- sessions (in-memory; personal single-user tool) ------------------------
const sessions = new Set();

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie;
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function isAuthed(req) {
  const token = parseCookies(req).fg;
  return Boolean(token && sessions.has(token));
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error("payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function json(res, status, obj) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(obj));
}

// --- Stability AI -----------------------------------------------------------
// Stability's REST API is synchronous multipart/form-data for images (no queue).
function dataUriToBlob(dataUri) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUri || "");
  if (!m) throw new Error("Not a base64 data URI");
  return new Blob([Buffer.from(m[2], "base64")], { type: m[1] });
}

const STABILITY_MIME = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

// Text-to-image or image-to-image via /v2beta/stable-image/generate/{ultra|core|sd3}.
async function stabilityGenerateImage(model, input, refDataUris) {
  const form = new FormData();
  form.set("prompt", input.prompt || "");
  for (const k of ["negative_prompt", "aspect_ratio", "seed", "output_format", "style_preset", "cfg_scale"]) {
    if (input[k] != null && input[k] !== "") form.set(k, String(input[k]));
  }
  const fmt = (input.output_format || "png").toLowerCase();

  if (refDataUris && refDataUris.length) {
    // image-to-image: needs the raw image and a strength; aspect_ratio isn't allowed.
    form.set("image", dataUriToBlob(refDataUris[0]), "ref.png");
    form.set("mode", "image-to-image");
    form.set("strength", String(input.strength != null ? input.strength : 0.6));
    form.delete("aspect_ratio");
  }

  const resp = await fetch(`${STABILITY_HOST}/v2beta/stable-image/generate/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${STABILITY_KEY}`, Accept: "application/json" },
    body: form,
  });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!resp.ok) return { ok: false, status: resp.status, data };

  const result = { seed: data.seed, finish_reason: data.finish_reason };
  if (data.image) result.images = [{ url: `data:${STABILITY_MIME[fmt] || "image/png"};base64,${data.image}` }];
  if (data.finish_reason === "CONTENT_FILTERED") result.filtered = true;
  return { ok: true, status: resp.status, data: result };
}

// --- routing ----------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const path = url.pathname;

  try {
    // ---- static: the single-page UI ----
    if (req.method === "GET" && (path === "/" || path === "/index.html")) {
      const html = await readFile(join(__dirname, "public", "index.html"));
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store", // always serve the current page after an update
      });
      res.end(html);
      return;
    }

    // ---- auth: login / logout / status ----
    if (path === "/api/login" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      if (!safeEqual(body.password || "", APP_PASSWORD)) {
        return json(res, 401, { error: "Wrong password." });
      }
      const token = randomBytes(24).toString("base64url");
      sessions.add(token);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": `fg=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`,
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (path === "/api/logout" && req.method === "POST") {
      const token = parseCookies(req).fg;
      if (token) sessions.delete(token);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": "fg=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (path === "/api/session" && req.method === "GET") {
      return json(res, 200, {
        authed: isAuthed(req),
        stabilityConfigured: Boolean(STABILITY_KEY),
      });
    }

    // ---- everything below requires auth ----
    if (path.startsWith("/api/") && !isAuthed(req)) {
      return json(res, 401, { error: "Not signed in." });
    }

    // ---- generate: text-to-image or image-to-image via Stability ----
    if (path === "/api/generate" && req.method === "POST") {
      if (!STABILITY_KEY) return json(res, 503, { error: "STABILITY_KEY is not configured on the server." });

      // Data-URI reference images make the body large, so allow up to ~64MB.
      const body = JSON.parse((await readBody(req, 64_000_000)) || "{}");
      const model = String(body.model || "").trim();
      const input = body.input && typeof body.input === "object" ? body.input : {};
      const refs = Array.isArray(body.refDataUris) ? body.refDataUris : [];
      if (!model) return json(res, 400, { error: "Pick a model." });
      if (!input.prompt && !refs.length) {
        return json(res, 400, { error: "Provide a prompt or a reference image." });
      }

      try {
        const { ok, status, data } = await stabilityGenerateImage(model, input, refs);
        if (!ok) return json(res, 502, { error: "Stability rejected the request.", httpStatus: status, detail: data });
        return json(res, 200, { result: data });
      } catch (e) {
        return json(res, 502, { error: "Stability request failed.", detail: String(e.message || e) });
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (err) {
    console.error(err);
    json(res, 500, { error: String(err && err.message ? err.message : err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  falgen running at  http://${HOST}:${PORT}`);
  console.log(`  STABILITY_KEY: ${STABILITY_KEY ? "configured" : "MISSING — set it in falgen/.env"}\n`);
});
