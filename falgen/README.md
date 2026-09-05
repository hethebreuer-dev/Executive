# falgen

A personal, **local-only** image generator built on the
[Stability AI](https://platform.stability.ai) API.

This is a standalone tool. It lives in its own folder, has **no dependency on
the rest of this repo**, is not part of any build, and is never deployed. It
runs on your machine, for you.

## What it does

- Single-page web UI to run Stability's image models: `ultra` (Stable Image
  Ultra), `core` (Stable Image Core), and `sd3` (Stable Diffusion 3.5).
- Text-to-image, plus image-to-image from one reference image.
- Your `STABILITY_KEY` stays on the server and is never exposed to the browser —
  the page talks only to a local proxy.

## Privacy / access

- The server binds to `127.0.0.1` only, so it is **not reachable from your
  network or the internet** — only from the machine it runs on.
- A password gate (`APP_PASSWORD`) sits on top of that. If you don't set one,
  a random password is printed to the console on each start.
- Do not put this behind a public tunnel/reverse proxy. It's built for local use.

## Setup

Requires Node 18.17+ (uses the built-in `fetch`; zero npm dependencies).

```bash
cd falgen
cp .env.example .env      # then edit .env: add STABILITY_KEY and APP_PASSWORD
npm start                 # or: node server.mjs
```

Open http://127.0.0.1:5178, enter your password, and generate.

## Using it

1. Pick a **model** (`core` is the cheapest — good for testing).
2. Type a **prompt**.
3. Optionally add a **reference image** for image-to-image, and set
   `"strength"` in the Advanced input box (0 = identical to the reference,
   1 = ignore it; 0.6 is a good start).
4. Generate. Results render inline with links to open/save the originals.

Advanced-input fields Stability accepts: `aspect_ratio`, `output_format`
(png/jpeg/webp), `negative_prompt`, `seed`, `style_preset`, `cfg_scale`, and
`strength` (image-to-image). See https://platform.stability.ai/docs for the
per-model specifics.

## Note

Stability moderates content server-side; a blocked generation comes back with
`finish_reason: CONTENT_FILTERED`, which the app surfaces as a warning. That is
enforced by Stability, not something this tool controls.
