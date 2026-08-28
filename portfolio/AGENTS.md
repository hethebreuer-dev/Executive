<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# hethebreuer.com — a standalone project

This `portfolio/` directory is a **completely separate project** from anything
else in the repository (e.g. the LUFT / DriveLuft site at the repo root). It has
its own `package.json`, dependencies, config, and `node_modules`. Do not import
across the boundary, and do not modify files outside this directory when working
on the portfolio.

Run everything from inside `portfolio/`:

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```
