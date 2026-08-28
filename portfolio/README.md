# hethebreuer.com — portfolio

A rebuild of Hethe Breuer's personal portfolio. Hethe is a Design Director with
20+ years in apparel design for national US retailers (Ralph Lauren, American
Eagle, PacSun, Kellwood, Mydyer/Providence Industries) plus his own brands and
ventures.

The site puts **role and result in readable text on the work grid, before any
click** — the single biggest fix over the previous image-only site. Aesthetic:
luxury but simple, Apple ethos. Black-dominant so images glow off a dark ground,
neutral grotesk type (Geist), no gradients or ornament, no shadows.

> **Separate project.** This lives in its own `portfolio/` directory with its
> own dependencies and config. It is unrelated to the LUFT / DriveLuft site at
> the repo root and shares no code with it.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · `next/image` (AVIF/WebP)
· self-hosted Geist / Geist Mono via `next/font`. No backend, no auth, no forms.

## Routes

| Screen | Route |
|---|---|
| Homepage — hero, client band, filterable work grid, ventures, contact | `/` |
| Project page | `/work/[slug]` |
| Resume | `/resume` |
| Ventures | `/ventures` |

## Content

All copy lives in typed data files under `src/data/` — `projects.ts` (16
featured projects with slug, categories, role/result, project-page blocks),
`ventures.ts`, `resume.ts` (final resume copy from the handoff), `site.ts`
(contact + nav). The presentation reads these at build time; editing the
portfolio is editing data, not JSX.

Design tokens (oklch colors, type scale, spacing, radii) live in
`src/app/globals.css`, transcribed from the design handoff.

## Images

Photography is Hethe's own, supplied by him. Wired so far (in `public/projects/`):

- **Craft & Commerce** — `cc-*.avif` (card + project page)
- **Lamb & Flag** — `lf-*.avif` (card + project page)
- **Breuer00 Porsche** venture — `garage-hero.png`

Everything else renders the **designed placeholder** (striped dark ground + mono
slot label naming the shot and target resolution) until the source photography
is dropped in. To wire a project: add the image(s) to `public/projects/`, then
set `card` and/or the block `media` in `src/data/projects.ts`.

Still needed from Hethe:

- Homepage **hero** (`uploads/hero.jpeg`) → set `heroImage` in `src/app/page.tsx`
- Per-project photography for the remaining 14 projects and the two remaining
  ventures (Worksta.ai, Happie Mushrooms)
- **Resume PDF** → drop at `public/hethe-breuer-resume.pdf` (the download
  buttons already point there)

## Filtering

The work grid filters client-side by category (All / Apparel / Brand & graphic /
Digital); the active filter is reflected in the URL query (`?filter=apparel`) so
a filtered view is linkable.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```
