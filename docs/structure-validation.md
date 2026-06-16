# Structure Validation — `admin` & `webapp`

**Date:** 2026-06-16 · **Scope:** `admin/` and `webapp/` (`legacy/` excluded)

## Summary

The foundations are modern and the folder structure is clean and consistent across both apps. The real risks are (1) git hygiene, (2) silent divergence of the supposedly-shared design system / API client / UI kit, and (3) stale admin documentation. Items marked **✅ Fixed** were addressed on 2026-06-16; the rest remain open.

## What's solid

- Identical, modern toolchain in both apps: `tsconfig.app.json` (bundler resolution, `strict`), flat ESLint config, React 19 + Vite 7.
- Clean taxonomy: `api / components(layout+ui) / context / hooks / pages / styles / types / utils`, with barrel `index.ts` exports and co-located `*.module.css`.
- `webapp` has real test infrastructure: Vitest (80% coverage thresholds) + Playwright e2e + Testing Library.

## Findings

### High — git hygiene · ✅ Fixed
- Root `.gitignore` was the **.NET** template (didn't ignore `node_modules/` or `dist/`), and neither app had its own `.gitignore`.
- Replaced the root `.gitignore` with a JS/TS-monorepo one and added [admin/.gitignore](../admin/.gitignore) and [webapp/.gitignore](../webapp/.gitignore).

### High — the "shared" foundation has diverged · ⬜ Open
The apps were meant to share a design system and primitives, but these are now drifted copies:
- **Design tokens** — [admin/src/styles/tokens.css](../admin/src/styles/tokens.css) vs [webapp/src/styles/tokens.css](../webapp/src/styles/tokens.css): different naming (`--color-neutral-*` vs `--color-gray-*`), different values (`--color-primary-500`: `#4a8b94` vs `#4a7277`), different transition var name (`--transition-base` vs `--transition-normal`). Admin's file is pure tokens + light/dark theme vars; webapp's also bundles a CSS reset, base styles, and utility classes (mixed concerns).
- **HTTP client** — [admin/src/api/client.ts](../admin/src/api/client.ts) vs [webapp/src/api/client.ts](../webapp/src/api/client.ts): webapp adds 401→refresh-retry, module auth state, and field-level error parsing; admin is simpler. Base-URL convention differs (`VITE_API_URL` without `/api` in admin, with `/api` in webapp). `ApiError` is declared inline in admin but imported from `types/api` in webapp.
- **UI components** — e.g. [admin Button](../admin/src/components/ui/Button.tsx) uses `forwardRef` + `loading` spinner + `danger` variant; [webapp Button](../webapp/src/components/ui/Button.tsx) is a plain function with neither.

*Recommendation:* extract a single source of truth (shared tokens + UI kit + API client), e.g. a `packages/shared` workspace, so fixes/styles land once. Larger refactor — not yet done.

### Medium — stale admin documentation · ⬜ Open
- [admin/README.md](../admin/README.md) and [admin/Myngly_ads_admin.md](../admin/Myngly_ads_admin.md) describe `ThemeContext.tsx` / `ThemeToggle.tsx` and a dark-mode toggle that **do not exist** in `admin/src` (only `AuthContext` + `ToastContext`). The API base URL is also described as `http://localhost:3000/api` while the client default is `http://localhost:3000`.
- *Recommendation:* treat `/docs` as the source of truth and remove or update the stale per-app docs.

### Low — config consistency · ✅ Fixed
- Vite dev servers were bound to **`port: 80`** (needs elevated privileges locally). Now `5174` (admin) and `5173` (webapp) so both can run side-by-side.
- `tsconfig.app.json` had `noUnusedLocals` / `noUnusedParameters` set to `false`. Now `true` in both apps.
- ESLint `ecmaVersion` bumped `2020` → `2022` to match the TS `ES2022` target.

### Low — remaining · ⬜ Open
- `webapp` defines an `@` path alias in `vitest.config.ts` but not in `vite.config.ts`. Harmless today (`@/` is unused in source), but inconsistent — either add it to `vite.config.ts` or drop it.
- `admin` has **no tests and no test script** while `webapp` has a full setup. Consider mirroring the Vitest setup in `admin`.
