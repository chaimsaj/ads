# Myngly Ads — Documentation

Documentation for the Myngly advertising platform monorepo. All docs live here under `/docs` and are written in English.

## Repository layout

| Directory | What it is | Status |
|-----------|------------|--------|
| [`admin/`](../admin) | Back-office admin panel (React 19 + TS + Vite) | Active |
| [`webapp/`](../webapp) | Advertiser web app — campaign-creation wizard (React 19 + TS + Vite) | Active |

Both front-ends talk to the **`myngly-microservices`** Ads gateway over `VITE_API_URL` with Bearer-JWT
auth. The old `legacy/` unified API was decommissioned on 2026-07-03 — see
[`legacy-decommission.md`](legacy-decommission.md).

## Docs

- [architecture.md](architecture.md) — structure, routing, auth, and API conventions for `admin` and `webapp`.
- [structure-validation.md](structure-validation.md) — structural validation findings and recommendations.

## Getting started

Each app is a standalone npm package:

```bash
cd admin   # or: cd webapp
npm install
npm run dev      # admin → http://localhost:5174, webapp → http://localhost:5173
```

Both apps expect the unified API running locally (default `http://localhost:3000`).

## Common scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` type-check + Vite production build |
| `npm run lint` | ESLint (flat config) |
| `npm run preview` | Preview the production build |

`webapp` additionally has `npm test` (Vitest), `npm run test:e2e` (Playwright), and `npm run test:coverage`.
