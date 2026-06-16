# Admin & Webapp Remediation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the correctness, security, design, and dead-code issues found in [../review-2026-06-16.md](../review-2026-06-16.md), making `admin` and `webapp` production-ready while keeping the two apps 100% independent.

**Architecture:** Work the two apps separately (never couple them — see [../../CLAUDE.md](../../CLAUDE.md) §0). Phases are ordered by risk: user-facing/financial correctness first, then rendering, then auth hardening, then cleanup, then tests and design polish. Each task is self-contained and ends in its own commit. After any task that touches TS, run `npm run build` in that app; `tsc -b` must stay green (the `noUnusedLocals`/`noUnusedParameters` flags will catch leftover symbols from dead-code removal).

**Tech Stack:** React 19, TypeScript 5.9 (strict), Vite 7, React Router v7, CSS Modules + `tokens.css`. webapp also: Vitest + Testing Library + Playwright, leaflet/react-leaflet.

**Conventions:** professional English everywhere; branch off `master`; commit per task; append a session-log entry under `docs/sessions/` when done. Do **not** touch `legacy/`.

**Verification commands (per app):**
```bash
cd webapp   # or: cd admin
npm run build          # tsc -b + vite build — must pass
npm run lint           # ESLint
npm run test:run       # webapp only — Vitest once
npm run test:e2e       # webapp only — Playwright
```

---

## Phase 1 — webapp correctness (Critical)

These are user-facing or financial bugs. webapp has Vitest; add a focused test with each fix where practical.

### Task 1.1: Remove hardcoded fake users/events from search

**Files:**
- Modify: `webapp/src/pages/campaign/SearchUser.tsx:42-72`
- Modify: `webapp/src/pages/campaign/SearchEvent.tsx:58-78`

- [ ] **Step 1:** Read both files. Delete the `HARDCODED_USERS` / `HARDCODED_EVENTS` arrays and every reference that merges them into the live API results. The search handler must render only what the API returns (plus the existing empty/loading/error states).
- [ ] **Step 2:** Grep to confirm no remaining references: `grep -rn "HARDCODED_" webapp/src` → expect none.
- [ ] **Step 3:** `cd webapp && npm run build` → PASS (no unused-symbol errors).
- [ ] **Step 4:** Commit: `fix(webapp): stop merging hardcoded users/events into live search`

### Task 1.2: Wire real email verification

**Files:**
- Modify: `webapp/src/pages/auth/VerifyEmail.tsx:79-81`
- Reference: `webapp/src/api/auth.ts` (the verify-email endpoint; confirm the exact method/path)

- [ ] **Step 1:** Read `VerifyEmail.tsx` and `api/auth.ts`. Identify (or add) the verify call in the auth API module. The handler currently has the call commented out and always `navigate('/dashboard')`.
- [ ] **Step 2:** In `handleSubmit`, `await` the verify API with the entered code; on success `navigate('/dashboard')`; on failure set an error message and stay on the page. Remove the unconditional navigate.
- [ ] **Step 3:** Manual check against a running API: a wrong code shows an error and does not navigate; a correct code navigates. `npm run build` → PASS.
- [ ] **Step 4:** Commit: `fix(webapp): perform real email verification before redirect`

### Task 1.3: Fix targeting radius unit (miles → km)

**Files:**
- Modify: `webapp/src/api/campaigns.ts:305` (`mapCreateRequest`)
- Reference: `webapp/src/pages/campaign/Targeting.tsx:104`, `webapp/src/api/campaigns.ts:247-251` (`mapCampaignDetail`)
- Test: `webapp/src/api/__tests__/campaigns.test.ts` (new)

- [ ] **Step 1: Write the failing test.** The UI radius is in miles; the backend field is `radiusKm`.
```ts
import { describe, it, expect } from 'vitest';
import { mapCreateRequest } from '../campaigns';

describe('mapCreateRequest radius', () => {
  it('converts a miles radius to kilometers', () => {
    // build a minimal valid wizard payload with targeting.radius = '5' (miles)
    const req = mapCreateRequest(/* payload with radius '5' */);
    expect(req.radiusKm).toBe(8); // round(5 * 1.60934)
  });
});
```
- [ ] **Step 2:** Run `cd webapp && npx vitest run src/api/__tests__/campaigns.test.ts` → FAIL (expects 8, gets 5).
- [ ] **Step 3:** In `mapCreateRequest`, convert before rounding:
```ts
const MILES_TO_KM = 1.60934;
radiusKm: Math.round(parseFloat(data.targeting.radius) * MILES_TO_KM),
```
Confirm `mapCampaignDetail` reads back consistently (expose `radius` in miles for the UI, `radiusKm` for storage).
- [ ] **Step 4:** Run the test → PASS. `npm run build` → PASS.
- [ ] **Step 5:** Commit: `fix(webapp): convert targeting radius from miles to km before submit`

### Task 1.4: Persist the uploaded banner image

**Files:**
- Modify: `webapp/src/pages/campaign/CreateAd.tsx:61-67` (`handleNext`)
- Reference: `webapp/src/api/` (the upload/asset endpoint, if any) and `Review.tsx` (submit)

- [ ] **Step 1:** Read `CreateAd.tsx` and trace how wizard data flows to `Review.tsx`'s `campaignsApi.create`. Today only `hasBanner: boolean` is saved; the `File` is discarded.
- [ ] **Step 2:** Decide the persistence path: if an upload endpoint exists, upload on `handleNext` and store the returned URL in wizard data as `bannerImage`; if not, base64-encode the file and store the string. Update the create request mapping to send it. (Confirm the backend contract before choosing.)
- [ ] **Step 3:** Manual check: select an image → advance → `Review` shows it → submit includes the banner. `npm run build` → PASS.
- [ ] **Step 4:** Commit: `fix(webapp): persist uploaded banner image through the wizard`

### Task 1.5: Capture payment atomically with campaign creation

**Files:**
- Modify: `webapp/src/pages/campaign/Payment.tsx:102-151` (`handleSubmit`)
- Modify: `webapp/src/pages/campaign/Review.tsx:87-137` (submit/create)

- [ ] **Step 1:** Read both files and the Stripe API module. Today Payment charges the card (`createPaymentIntent` + `confirmPayment`) and Review separately calls `campaignsApi.create` — so a Review failure/abandon leaves the user charged with no campaign.
- [ ] **Step 2:** Restructure so the charge and campaign creation succeed or fail together. Preferred approach: defer `confirmPayment` to the final submit in `Review` (create the campaign first, then confirm payment, then handle rollback/error messaging if confirm fails); or create the `PaymentIntent` at Payment but only **confirm** it alongside `campaignsApi.create` in one submit handler with error handling that does not leave a charge without a campaign. Confirm the intended backend flow before implementing.
- [ ] **Step 3:** Manual check: a forced failure in campaign creation does not result in a charge (or is refunded/voided); the happy path creates campaign + charge exactly once. `npm run build` → PASS.
- [ ] **Step 4:** Commit: `fix(webapp): make payment atomic with campaign creation`

---

## Phase 2 — webapp design tokens (Critical rendering)

### Task 2.1: Define the missing tokens and fix the Card border typo

**Files:**
- Modify: `webapp/src/styles/tokens.css`
- Modify: `webapp/src/components/ui/Card.module.css:12`

- [ ] **Step 1:** Generate the exact list of undefined tokens:
```bash
cd webapp
comm -23 \
  <(grep -rhoE "var\(--[a-z0-9-]+" src --include=*.css | sed 's/var(//' | sort -u) \
  <(grep -oE "^\s*--[a-z0-9-]+" src/styles/tokens.css | tr -d ' ' | sort -u)
```
Expect ~19 names (`--color-neutral-50..900`, `--color-primary-50/100/200/400`, `--color-secondary-50`, `--color-success-50/600`, `--color-danger-50/600`, `--color-border-light`).
- [ ] **Step 2:** Resolve each: either **alias** to the existing palette (e.g. map `--color-neutral-*` → the defined `--color-gray-*` scale) by adding the definitions to `tokens.css`, **or** rename the references to the existing tokens. Aliasing in `tokens.css` is lower-risk (one file) — prefer it. Keep teal branding; do not introduce slate.
- [ ] **Step 3:** Fix the Card typo: `Card.module.css:12` `var(--color-border-light)` → `var(--border-color-light)` (the token defined at `tokens.css:124`).
- [ ] **Step 4:** Re-run the Step 1 diff → expect **no** undefined tokens. `npm run build` → PASS.
- [ ] **Step 5:** Commit: `fix(webapp): define missing design tokens and fix Card border token`

### Task 2.2: Remove off-brand fallbacks and inline color placeholders; tokenize status hex

**Files:**
- Modify: `webapp/src/pages/StripeSuccess.module.css:6,36,49,52,59`
- Modify: `webapp/src/components/ui/Badge.module.css` (`#b89600`, `#e3f2fd`, `#fce4ec`, `#c62828`)
- Modify: `webapp/src/pages/campaign/Review.tsx:215`, `webapp/src/pages/campaign/EditCampaign.tsx:153`, `webapp/src/components/ui/LocationMap.tsx:103-119`
- Modify: `webapp/src/styles/tokens.css` (add status tokens as needed)

- [ ] **Step 1:** Replace the Tailwind-slate fallbacks in `StripeSuccess.module.css` with the app's teal/brand tokens.
- [ ] **Step 2:** Add status tokens (e.g. `--color-warning-text`, status backgrounds) to `tokens.css` and replace the hardcoded hex in `Badge.module.css` and other status spots.
- [ ] **Step 3:** Replace inline `color: 'red'` / raw-hex placeholders in `Review.tsx:215`, `EditCampaign.tsx:153`, and `LocationMap.tsx:103-119` with module CSS classes using error/neutral tokens.
- [ ] **Step 4:** `npm run build` → PASS. Commit: `style(webapp): tokenize status colors and remove inline color placeholders`

---

## Phase 3 — Auth hardening (both apps)

### Task 3.1: admin — refresh-and-retry on 401 in the client

**Files:**
- Modify: `admin/src/api/client.ts:40-75`
- Reference: `admin/src/context/AuthContext.tsx:20-47`, `admin/src/api/auth.ts`

- [ ] **Step 1:** Read all three. Today only `AuthContext.checkAuth` refreshes (at mount); any later 401 dispatches `auth:session-expired` and logs out.
- [ ] **Step 2:** Add one-shot refresh-and-retry inside `handleResponse`/the request path: on `401`, call the refresh endpoint once, and on success retry the original request once; only dispatch `auth:session-expired` if the refresh itself fails. Guard concurrent refreshes with a single shared in-flight promise (mirror webapp's intended design, but fixed — see Task 3.2).
- [ ] **Step 3:** Manual check: expire/clear the access token mid-session → the next action refreshes and succeeds instead of logging out. `npm run build` → PASS.
- [ ] **Step 4:** Commit: `fix(admin): refresh and retry once on mid-session 401`

### Task 3.2: webapp — fix the refresh-retry race

**Files:**
- Modify: `webapp/src/api/client.ts:43-62`
- Test: `webapp/src/api/__tests__/client.test.ts` (new)

- [ ] **Step 1: Write the failing test.** Two concurrent 401s must both await a single refresh, not have the second give up.
```ts
// Mock fetch: first two calls 401, refresh ok, retries ok.
// Fire two apiClient.get(...) concurrently; expect BOTH to resolve
// (today the second emits auth:session-expired because isRefreshing is true).
```
- [ ] **Step 2:** Run the test → FAIL.
- [ ] **Step 3:** Replace the `if (isRefreshing) return false` early-out with a shared `refreshPromise`: concurrent callers `await` the same promise instead of bailing.
- [ ] **Step 4:** Run the test → PASS. `npm run build` → PASS.
- [ ] **Step 5:** Commit: `fix(webapp): queue concurrent 401s behind a single refresh`

### Task 3.3: both — route `auth.refresh()` through the shared client (CSRF)

**Files:**
- Modify: `admin/src/api/auth.ts:43-52`
- Modify: `webapp/src/api/auth.ts:50-59`
- Reference: `webapp/src/context/AuthContext.tsx:22-42`

- [ ] **Step 1:** Replace the raw `fetch` refresh in each app with `apiClient.post('/.../auth/refresh')` so the CSRF header is attached. In webapp, ensure the reload-time `getProfile()` path benefits from the client's refresh (set the client's authenticated flag appropriately, or rely on the shared refresh from Task 3.2).
- [ ] **Step 2:** Manual check against a CSRF-enforcing API: reload-time refresh succeeds. `npm run build` → PASS in both apps.
- [ ] **Step 3:** Commit (one per app): `fix(admin): send CSRF on token refresh` / `fix(webapp): consolidate token refresh through the client`

---

## Phase 4 — Dead-code sweep (both apps)

Large but low-risk. `tsc -b` (with the unused-symbol flags) is the safety net. Confirm each symbol is unreferenced with `grep -rn` before deleting.

### Task 4.1: admin dead code + helper consolidation

**Files (remove):** `admin/src/utils/formatters.ts`, `admin/src/hooks/usePermissions.ts`, `admin/src/utils/permissions.ts` (verify no live consumers), and the unused `ApiResponse` (`types/index.ts:79-84`), `EmailRecipient` + `BulkEmailResult.errors` (`api/SendGrid_emails.ts`).
**Files (consolidate):** new `admin/src/api/query.ts` for `buildQueryString` (replace copies in `users.ts:63`, `campaigns.ts:77`, `Stripe_payments.ts:161`); single currency helper (replace inline `$${x.toLocaleString()}` in `Users.tsx`, `Campaigns.tsx`, `export.ts`, and the local one in `Stripe_Payments.tsx`).

- [ ] **Step 1:** For each removal, `grep -rn <symbol> admin/src` → confirm only self-references, then delete.
- [ ] **Step 2:** Extract `query.ts` and a currency formatter (clarify the cents-vs-dollars contract); update imports.
- [ ] **Step 3:** Decide on the stub features (`dashboard.ts:31` empty activity/zero growth; `Settings.tsx:60-76` no-op danger zone; "coming soon" panels): either wire to a real endpoint or remove the UI — do not ship stubs. Track any deferred ones explicitly.
- [ ] **Step 4:** `cd admin && npm run build && npm run lint` → PASS. Commit: `refactor(admin): remove dead code and consolidate query/currency helpers`

### Task 4.2: webapp dead code + wizardStorage util

**Files (remove):** `webapp/src/hooks/useForm.ts`, the dead exports in `webapp/src/utils/validation.ts` (keep only what survives — likely the whole module goes once `useForm` is gone), `webapp/src/components/ui/Card.tsx` (+ CSS), `webapp/src/components/ui/Skeleton.tsx`, the unused Stripe/SendGrid/campaign/user API functions + their re-exported types (`api/index.ts`), unused `types/api.ts` types, the dead `@` alias in `vitest.config.ts:37-40`, and `mapUserFromBackend` (`auth.ts:15-28`).
**Files (extract):** new `webapp/src/utils/wizardStorage.ts` for `saveWizardData`/`getWizardData`; replace the 12 copies + the `Review.tsx:18-25` variant.

- [ ] **Step 1:** For each removal, `grep -rn <symbol> webapp/src` → confirm unreferenced (remember `validation.ts` is reachable only via the dead `useForm`), then delete. Remove the matching unit tests that only covered dead code.
- [ ] **Step 2:** Extract `wizardStorage.ts` (with guarded `try/catch` writes) and replace all copies.
- [ ] **Step 3:** Remove the `@` alias from `vitest.config.ts` (or add it to `vite.config.ts` if you intend to use `@/`). Fix `playwright.config.ts:4` comment ("Admin" → "Advertiser").
- [ ] **Step 4:** `cd webapp && npm run build && npm run lint && npm run test:run` → PASS. Commit: `refactor(webapp): remove dead code and extract wizardStorage util`

---

## Phase 5 — webapp tests & coverage

### Task 5.1: Repair or quarantine the e2e suite + recalibrate coverage

**Files:**
- Modify: `webapp/e2e/campaign.spec.ts`, `dashboard.spec.ts`, `settings.spec.ts`, `auth.spec.ts`
- Modify: `webapp/playwright.config.ts` (`webServer`)
- Modify: `webapp/vitest.config.ts:25-32` (thresholds)

- [ ] **Step 1:** Update e2e routes to the real ones in `App.tsx` (`/campaign/new/*`, `/campaign/:id/edit`, etc.). Replace vacuous `if (await x.isVisible())` assertions with real expectations.
- [ ] **Step 2:** Configure Playwright `webServer` to start the app (and document/mocks for the `:3000` backend the `login` helper needs), or mark backend-dependent specs `test.skip` with a clear reason until a test API exists.
- [ ] **Step 3:** Lower the Vitest coverage thresholds to a realistic, currently-passing number, then raise them as Task 5.2 adds tests. `npm run test:run` → PASS.
- [ ] **Step 4:** Commit: `test(webapp): fix e2e routes/webServer and recalibrate coverage`

### Task 5.2: Add unit tests for the risky logic

**Files:** `webapp/src/api/__tests__/client.test.ts` (extend Task 3.2), `webapp/src/api/__tests__/campaigns.test.ts` (extend Task 1.3), new `webapp/src/context/__tests__/AuthContext.test.tsx`.

- [ ] **Step 1:** Add tests for: `apiClient` CSRF header on mutations + 401-refresh-retry; the campaigns/stripe mappers; `AuthContext` reload refresh flow.
- [ ] **Step 2:** `npm run test:coverage` → PASS at the (raised) thresholds.
- [ ] **Step 3:** Commit: `test(webapp): cover apiClient, mappers, and auth refresh`

---

## Phase 6 — Remaining correctness/design polish

### Task 6.1: webapp smaller correctness items
- [ ] `Dashboard.tsx:139-140` — either add `impressions`/`clicks` to `mapCampaignSummary` (`campaigns.ts:221-234`) or remove the dead zero-producing computation. Commit.
- [ ] `WizardLayout.tsx` — derive `currentStep`/`totalSteps` from one flow definition instead of hardcoded `totalSteps={3}`. Commit.
- [ ] `Payment.tsx:313` — `parseFloat(budget).toFixed(2)` for the displayed total. Commit.
- [ ] `AuthContext.tsx:78-91` — wrap the context `value` in `useMemo`. `SendGrid_emails.ts:45-103` — add the missing `/v1` prefix. Commit.

### Task 6.2: admin smaller correctness items
- [ ] `Table.tsx` — make sort fully controlled (drive indicator from props; drop local state). Commit.
- [ ] `useUsers.ts:44` / `useCampaigns.ts:44` — depend on primitive filter fields, not the object. Commit.
- [ ] `SendGrid_emails.ts:158-166` — derive `sendBulkEmail` `success` from `failedCount === 0` and map errors. Commit.
- [ ] `Campaigns.tsx:145`, `CampaignDetail.tsx:138,143` — guard `budget > 0` before the spend percentage. Commit.
- [ ] `Input.tsx:15` — replace `substr` and `Math.random()` id with `useId()`. Commit.

### Task 6.3: design polish
- [ ] admin `tokens.css` — add a z-index scale (`--z-dropdown/modal/toast`) and replace hardcoded z-indexes in `Modal`/`Toast`/`Sidebar`/`AdminHeader`. Commit.
- [ ] admin — Settings toggle a11y (wrap in `<label>`, add `:focus-visible` on slider) and make `AdminHeader.tsx:71` user-menu a real `<button>` or drop the affordance. Commit.
- [ ] admin — give `Input.tsx` the `aria-invalid`/`aria-describedby`/`role="alert"` treatment webapp's Input already has. Commit.
- [ ] webapp — add `:focus-visible` to code/date inputs (`Auth.module.css`, `Dashboard.module.css:378`); fix the inverted `--color-info-light`. Commit.

---

## Phase 7 (optional) — admin test setup

admin has no tests. To match webapp and protect the auth fix (Task 3.1):
- [ ] Add Vitest + Testing Library to `admin` (mirror `webapp/vitest.config.ts` and `src/test/`), without coupling to webapp. Add a first test for the client refresh-retry. Commit: `test(admin): add Vitest setup and client refresh test`.

---

## Self-review notes
- **Spec coverage:** every Critical/Important/Minor item in the review report maps to a task (Critical → Phases 1-3 + 4 stubs; Important → Phases 3, 6; Minor → Phase 6; dead code → Phase 4; tests → Phase 5; design → Phases 2, 6.3). 
- **Independence:** no task creates any link between `admin` and `webapp`; shared-looking fixes (refresh-retry, CSRF) are implemented separately in each app on purpose.
- **Risk note:** Tasks 1.4, 1.5, 1.2, 3.3 depend on backend contracts (upload endpoint, payment/refund flow, verify endpoint, CSRF on refresh) — confirm those against the API before implementing rather than guessing. `legacy/` is the API but is out of scope to read/modify; confirm via API docs or the team.
