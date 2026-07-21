# LUFT — Buy. Sell. Breathe air-cooled.

LUFT is the marketplace and workshop for air-cooled Porsche 911s (plus 912 and
930). It aggregates every air-cooled 911 for sale across the US, prices each car
against real sold comps, surfaces market data, and offers ownership tooling.
Intended domain: **driveluft.com**.

This is a faithful, high-fidelity implementation of the LUFT design handoff,
built on the project's Next.js 16 + React 19 + Tailwind v4 stack. The near-
monochrome, editorial design language (Oswald / Libre Franklin / JetBrains Mono,
1px hairlines, square corners, mono "spec-sheet" accents) lives in
`src/app/globals.css` and `src/components/luft/`.

## Screens & routes

| Screen | Route |
|---|---|
| Home | `/` |
| Marketplace | `/marketplace` |
| Listing detail | `/listing/[id]` |
| Market Data / Analytics | `/market-data` |
| Workshop / Garage | `/workshop` |
| Sell | `/sell` |
| Account | `/account` |

Shared components (`src/components/luft/`): `Header` (sticky, blurred, mobile
menu), `Footer` (simple + full-grid variants), `Auth` (sign-in / create-account
modal with signed-in / signed-out states, backed by `AuthProvider` +
`localStorage`).

## Data

All figures (214 listings, $95k median, 12,400 comps, per-car prices, comp
tables, analytics series) are **placeholders** from the design spec, defined in
`src/lib/luft.ts` and the individual page files. Wire these to a real catalog /
comps / market-data service in production. Auth is a client-side prototype —
any email works.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build (Turbopack)
npm run lint    # eslint
```

## Notes

- LUFT is an independent marketplace and uses no Porsche trademarks, logos, or
  brand imagery. The non-affiliation disclaimer stays in the footer.
- See `AGENTS.md` before editing — this repo runs a non-standard Next.js 16 with
  breaking changes; the bundled docs live in `node_modules/next/dist/docs/`.
