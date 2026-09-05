// falgen — a personal, local-only image + video generator on top of Fal.ai.
//
// Design goals:
//   * Standalone. Zero npm dependencies (Node built-ins only), no framework,
//     no relation to anything else in this repo.
//   * Private. Binds to 127.0.0.1 only, so it is not reachable from the network.
//     A password gate adds defense-in-depth on top of that.
//   * Safe with your key. FAL_KEY lives on the server and is never sent to the
//     browser; the browser talks only to this proxy.
//
// Run:  cp .env.example .env  (fill in FAL_KEY + APP_PASSWORD)  then  npm start

import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize } from "node:path";

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
const FAL_KEY = process.env.FAL_KEY || "";
const FAL_QUEUE = "https://queue.fal.run";

// Password gate. If APP_PASSWORD is unset we generate a one-off and print it,
// so the app is never accidentally left wide open.
let APP_PASSWORD = process.env.APP_PASSWORD || "";
if (!APP_PASSWORD) {
  APP_PASSWORD = randomBytes(9).toString("base64url");
  console.log(
    `\n  No APP_PASSWORD set. Using a temporary one for this run:\n\n      ${APP_PASSWORD}\n\n  Set APP_PASSWORD in falgen/.env to make it permanent.\n`
  );
}

// --- sessions & jobs (in-memory; personal single-user tool) -----------------
const sessions = new Set(); // valid session tokens
const jobs = new Map(); // requestId -> { statusUrl, responseUrl, model, createdAt }

// Drop jobs older than 6h so the map can't grow forever.
setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [id, job] of jobs) if (job.createdAt < cutoff) jobs.delete(id);
}, 30 * 60 * 1000).unref();

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
  return token && sessions.has(token);
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
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

// --- Fal helpers ------------------------------------------------------------
const falHeaders = () => ({
  Authorization: `Key ${FAL_KEY}`,
  "Content-Type": "application/json",
});

// Submit a job to the Fal queue. Works for both images and video; video simply
// takes longer, which is why everything goes through the async queue + polling.
async function falSubmit(model, input) {
  const url = `${FAL_QUEUE}/${model}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: falHeaders(),
    body: JSON.stringify(input),
  });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: resp.ok, status: resp.status, data };
}

async function falGet(url) {
  const resp = await fetch(url, { headers: falHeaders() });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: resp.ok, status: resp.status, data };
}

// --- routing ----------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const path = url.pathname;

  try {
    // ---- static: the single-page UI ----
    if (req.method === "GET" && (path === "/" || path === "/index.html")) {
      const html = await readFile(join(__dirname, "public", "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
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
        authed: Boolean(isAuthed(req)),
        falConfigured: Boolean(FAL_KEY),
      });
    }

    // ---- everything below requires auth ----
    if (path.startsWith("/api/") && !isAuthed(req)) {
      return json(res, 401, { error: "Not signed in." });
    }

    // ---- generate: submit a prompt to a Fal model ----
    if (path === "/api/generate" && req.method === "POST") {
      if (!FAL_KEY) return json(res, 503, { error: "FAL_KEY is not configured on the server." });

      const body = JSON.parse((await readBody(req)) || "{}");
      const model = String(body.model || "").trim();
      const input = body.input && typeof body.input === "object" ? body.input : {};
      if (!model) return json(res, 400, { error: "Pick a model id." });
      if (!input.prompt && !input.image_url) {
        return json(res, 400, { error: "Provide a prompt (or an image_url for image-to-video)." });
      }

      const { ok, status, data } = await falSubmit(model, input);
      if (!ok) {
        return json(res, 502, { error: "Fal rejected the request.", falStatus: status, detail: data });
      }

      const requestId = data.request_id || data.requestId;
      const statusUrl = data.status_url;
      const responseUrl = data.response_url;
      if (!requestId || !statusUrl || !responseUrl) {
        return json(res, 502, { error: "Unexpected Fal response.", detail: data });
      }
      jobs.set(requestId, { statusUrl, responseUrl, model, createdAt: Date.now() });
      return json(res, 200, { requestId });
    }

    // ---- status: poll a submitted job; returns the result once COMPLETED ----
    if (path === "/api/status" && req.method === "GET") {
      const id = url.searchParams.get("id");
      const job = id && jobs.get(id);
      if (!job) return json(res, 404, { error: "Unknown job id." });

      const statusResp = await falGet(`${job.statusUrl}?logs=1`);
      if (!statusResp.ok) {
        return json(res, 502, { error: "Status check failed.", detail: statusResp.data });
      }
      const state = statusResp.data.status;
      if (state !== "COMPLETED") {
        return json(res, 200, {
          status: state,
          queuePosition: statusResp.data.queue_position,
          logs: statusResp.data.logs || [],
        });
      }
      const resultResp = await falGet(job.responseUrl);
      if (!resultResp.ok) {
        return json(res, 502, { error: "Result fetch failed.", detail: resultResp.data });
      }
      return json(res, 200, { status: "COMPLETED", result: resultResp.data });
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
  console.log(`  FAL_KEY: ${FAL_KEY ? "configured" : "MISSING — set it in falgen/.env"}\n`);
});
