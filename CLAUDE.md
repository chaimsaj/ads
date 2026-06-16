# CLAUDE.md — Myngly Ads

Guidance for AI assistants (and humans) working in this repository. Read this first.

---

## 0. Golden rules (do not violate)

1. **`admin/` and `webapp/` are two fully independent applications.** They must build, run, test, and deploy 100% on their own. **Never** create an import, shared module, symlink, root `package.json`/workspace, or any other coupling between them. If something is genuinely shared, duplicate it deliberately in each app — do **not** link them. Verify after any structural change:
   ```bash
   grep -rn "webapp" admin/src ; grep -rn "admin/" webapp/src   # must return nothing meaningful
   ```
2. **Do not analyze, modify, run, or reference `legacy/`.** It is out of scope. (It is the old Node/Express + Prisma + MongoDB backend, deprioritized.)
3. **Everything in professional English, 100%** — code, identifiers, comments, commit messages, docs, PR text, and every detail of the session logs. (Prompts may arrive in Spanish; always respond and write artifacts in clear, professional English.)
4. **All documentation lives in [`/docs`](docs).** Do not scatter docs inside app folders. `/docs` is the source of truth.
5. **Log every working session** under [`/docs/sessions`](docs/sessions) — see §6.
6. **Code style: modern, clean ("prolijo"), simple.** No dead or unnecessary code. Designs must look clean and professional.

---

## 1. What this repo is

`myngly-ads` is the Myngly advertising platform. It contains three top-level apps:

| Directory | What it is | Status |
|-----------|------------|--------|
| `admin/` | Back-office **admin panel** (manage users, campaigns, Stripe payments, SendGrid emails, settings) | Active |
| `webapp/` | **Advertiser app** — campaign-creation wizard, dashboard, auth, settings | Active |
| `legacy/` | Old unified API backend (Node/Express + Prisma + MongoDB) | **Out of scope — do not touch** |

`admin` and `webapp` are SPA front-ends that talk to the unified API over HTTP (cookie-based auth + CSRF), configured via `VITE_API_URL`.

Detailed structure: [`docs/architecture.md`](docs/architecture.md). Latest structural validation: [`docs/structure-validation.md`](docs/structure-validation.md).

---

## 2. Shared tech baseline (both apps)

- **React 19** + **TypeScript 5.9** (strict) + **Vite 7**, ESM (`"type": "module"`).
- **React Router v7**, **lucide-react** icons.
- **CSS Modules** (`*.module.css`) over a `src/styles/tokens.css` design-token layer. No CSS-in-JS, no Tailwind.
- Identical `tsconfig.app.json` and flat `eslint.config.js` in both apps.
- TS strictness includes `noUnusedLocals` + `noUnusedParameters` (so unused locals/params fail the build — keep code clean).

Common folder taxonomy in each app's `src/`:
```
api/  components/{layout,ui}/  context/  hooks/  pages/  styles/  types/  utils/
```
Pages are grouped by feature with barrel `index.ts` exports; styles are co-located `*.module.css`.

---

## 3. The apps

### `admin/` (back-office)
- Extra deps: `zod`. **No test setup** (gap — see validation doc).
- Routing ([admin/src/App.tsx](admin/src/App.tsx)): public `/login`; everything else nested under `<ProtectedRoute>` → `<AdminLayout>` (layout-route pattern): `/`, `/users(/:id)`, `/campaigns(/:id)`, `/payments`, `/emails`, `/settings`.
- Providers wired in [admin/src/main.tsx](admin/src/main.tsx): `AuthProvider` → `ToastProvider`.
- API client default base: `http://localhost:3000` (override `VITE_API_URL`).

### `webapp/` (advertiser)
- Extra deps: `leaflet` + `react-leaflet` (location targeting).
- Tests: **Vitest** unit + **Playwright** e2e (`webapp/e2e`), 80% coverage thresholds.
- Routing ([webapp/src/App.tsx](webapp/src/App.tsx)): public `/`, `/stripe-success`; `/auth/*`; protected `/dashboard`, `/settings`; multi-step campaign wizard under `/campaign/new/*`; management under `/campaign/:id*`. Each protected page is wrapped individually in `<ProtectedRoute>`.
- Provider: `AuthProvider` wraps routes inside `App.tsx`.
- API client default base: `http://localhost:3000/api`. Includes 401→refresh-retry + field-level error parsing.

> Note: the two apps' design tokens, HTTP clients, and UI primitives have **diverged** (they are copies, not a shared lib). That is acceptable given Rule #1 (independence). Keep each app internally consistent.

---

## 4. Running & building

Each app is standalone — `cd` into it first.

```bash
cd admin    # or: cd webapp
npm install
npm run dev        # admin → http://localhost:5174 , webapp → http://localhost:5173
npm run build      # tsc -b (type-check) + vite build
npm run lint       # ESLint (flat config)
npm run preview    # preview the production build
```

`webapp` only:
```bash
npm test               # Vitest (watch)
npm run test:run       # Vitest (once)
npm run test:coverage  # Vitest + coverage (80% thresholds)
npm run test:e2e       # Playwright
```

Both apps expect the unified API reachable at `VITE_API_URL` (default `http://localhost:3000`). The API itself is not part of admin/webapp scope.

Production env lives in each app's `.env.production` (committed; `VITE_*` values are public — they are inlined into the client bundle). Local overrides go in `.env.local` (gitignored).

---

## 5. Conventions & quality bar

- **No dead code.** Remove unreferenced files, unused exports, commented-out blocks, leftover mocks/placeholders, and unused dependencies. Confirm a symbol is unused (`grep`) before deleting.
- **Type safety.** Avoid `any`; type API responses; map backend DTOs to UI types in `api/`.
- **Design.** Use design tokens — no hardcoded colors/magic px in `*.module.css`. Provide loading/empty/error and hover/`:focus-visible` states. Keep it clean and professional.
- **Simplicity.** Prefer the straightforward solution; no premature abstraction.
- **Verify before claiming done.** Run `npm run build` (and webapp tests) for any app you changed; report real results.
- **Commits/PRs:** only when asked. Branch off `master`. Keep changes scoped to a single app when possible (respect independence).

---

## 6. Session logs (required)

Record every working session in `docs/sessions/` so context survives across sessions.

- One file per day: `docs/sessions/YYYY-MM-DD.md`. Append a new `## <time> — <topic>` entry per session (do not overwrite previous entries).
- Each entry covers: **scope/goal**, **changes made** (with file refs), **key decisions & rationale**, **verification run**, and **open follow-ups**.
- Keep it factual and concise. English only.

See existing entries for the format.
