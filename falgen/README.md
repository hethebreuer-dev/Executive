# falgen

A personal, **local-only** image + video generator built on the [Fal.ai](https://fal.ai) API.

This is a standalone tool. It lives in its own folder, has **no dependency on
the rest of this repo** (LUFT, the portfolio, etc.), is not part of any Next.js
build, and is never deployed. It runs on your machine, for you.

## What it does

- Single-page web UI to run any Fal.ai **image** or **video** model.
- Optional **Stability AI** provider (models `ultra` / `core` / `sd3`) for images,
  selectable from the Provider dropdown when `STABILITY_KEY` is set. Stability
  video (image-to-video) is not wired up yet.
- Your `FAL_KEY` stays on the server and is never exposed to the browser — the
  page talks only to a local proxy.
- `enable_safety_checker` is exposed as a toggle (off by default). This is a
  documented Fal parameter; its main effect is preventing the NSFW classifier
  from returning blanked/false-positive results. Some models ignore or reject
  the key — if a model errors, delete it from the **Advanced input** box.
- Handles long-running video via Fal's async queue with automatic polling.

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
cp .env.example .env      # then edit .env: add FAL_KEY and APP_PASSWORD
npm start                 # or: node server.mjs
```

Open http://127.0.0.1:5178, enter your password, and generate.

## Using it

1. Pick **Image** or **Video**.
2. Enter a **model id** (e.g. `fal-ai/flux/dev`). Exact ids and their input
   schemas live at [fal.ai/models](https://fal.ai/models) — the built-in
   suggestions are just starting points and can go stale.
3. Type a prompt. Put any model-specific fields (`image_size`, `seed`,
   `num_images`, `image_url` for image-to-video, `duration`, `aspect_ratio`, …)
   in the **Advanced input** JSON box.
4. Generate. Results render inline with links to open/download the originals.

## One thing to keep in mind

Disabling the safety checker only turns off Fal's automatic NSFW *blur/filter*
— it does not change what's legal or what Fal's own terms allow. Don't use this
to generate content that's illegal or that targets real people without consent
(sexual deepfakes of real individuals, anything involving minors). Fal can and
does suspend accounts for that, key or no key.
