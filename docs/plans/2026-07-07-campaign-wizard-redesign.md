# Campaign Wizard Redesign — Design Spec

Date: 2026-07-07
Scope: `webapp/` only (advertiser campaign-creation wizard). No backend or admin changes.

## Goal

Make the campaign-creation wizard (`/campaign/new/*`) professional, consistent, fully validated per
ad type, and impeccably responsive across mobile / tablet / desktop. Replace the duplicated
`SearchUser`/`SearchEvent` full-page pickers with a single reusable modal, centralize wizard state,
and make the "campaign type is immutable once created" rule visible in the UI (it is already enforced
in code, but silently).

## Background (current state)

- Wizard state lives in `localStorage.campaignWizard`, a flat, untyped object with 34 keys, each
  written ad hoc by whichever step component touches it.
- No route guards: any `/campaign/new/*` route is directly reachable, regardless of prior steps.
- `SearchUser.tsx` and `SearchEvent.tsx` are near-duplicate full-page steps for picking a
  `spotlightUserId` / `eventId`.
- Validation is inconsistent: some steps disable "Next" on missing required fields, but there is no
  URL format check on `link`, no `endDate > startDate` check, and error styling differs page to page.
- `EditCampaign.tsx` already has no field for `adType` or target (`spotlightUserId`/`eventId`) and
  never sends them on update — the "type is locked after creation" rule already holds, but nothing in
  the UI says so.

## Design

### 1. Centralized wizard state — `useCampaignWizard`

New file `webapp/src/hooks/useCampaignWizard.ts`:

- `CampaignWizardData` — a single typed interface for all 34 existing keys, grouped by concern
  (identity, target, creative, targeting, audience, payment) and discriminated by `adType` where a
  field only applies to one type.
- `getWizardData()` / `setWizardData(partial)` / `clearWizardData()` — the only code that touches
  `localStorage.campaignWizard` directly; every step component is refactored to go through this hook
  instead of calling `localStorage` itself.
- Per-step completeness predicates (pure functions, unit-testable in isolation):
  - `isIdentityStepComplete` — `name` non-empty, `adType` set.
  - `isTargetStepComplete` — `true` for `brand`; requires `spotlightUserId` for `user`, `eventId` for
    `event`.
  - `isCreativeStepComplete` — `adText` (1–150 chars) and a valid `link` URL; banner optional but if
    present must already have passed the size/type check at upload time.
  - `isTargetingStepComplete` — `address`, `startDate`, `endDate` present and `endDate > startDate`.
  - `isPaymentStepComplete` — `budget >= 10` and `paymentMethodId` present.
  - `isAudienceStepComplete` — always `true` (intentionally optional).
- `getStepOrder(adType)` — returns the ordered list of step routes for that type (the three flows
  already implicit in the app: brand / user / event), used by both the route guard and the stepper.
- Switching `adType` clears the fields specific to the previously selected type so a stale
  `spotlightUserId` from an abandoned "user" choice can never leak into a `brand` submission.

### 2. Route guard

A small wrapper (`WizardStepGuard`) used at the top of every `/campaign/new/*` step: if that step's
predicate chain (all prior steps' completeness predicates) fails, redirect to the first incomplete step
instead of rendering. Removes the current "type a URL, land on a broken step" gap.

### 3. `TargetPickerModal` (replaces `SearchUser.tsx` / `SearchEvent.tsx`)

New `webapp/src/components/campaign/TargetPickerModal.tsx` (+ `.module.css`):

- Props: `mode: 'user' | 'event'`, `open: boolean`, `onClose()`, `onSelect(target)`.
- Same search behavior as today: 400ms debounce, 2-character minimum, calls `usersApi.search` /
  `eventsApi.search`.
- Result rows are enriched: profile rows get a larger avatar with an initials fallback; event rows get
  a banner thumbnail (placeholder icon if missing), formatted date, and address.
- Clicking a row selects it and closes the modal immediately (no separate confirm step).
- Layout: full-screen sheet below 640px width; centered dialog with a max-width above that.
- Accessibility: `role="dialog"` + `aria-modal`, labelled title, focus trap, `Esc` to close,
  click-outside to close, arrow-key navigation through results (same pattern as the existing
  `CityAutocomplete`).
- Empty state ("No results for '…'") and a network-error state with a retry action.

Integration: the `SelectAdType` step gains a "Choose profile" / "Choose event" action (shown only when
`adType` is `user`/`event`) that opens this modal in place; the selected target renders as a card on
that same step with a "Change" action to reopen the modal. The `/campaign/new/search-user` and
`/campaign/new/search-event` routes are removed.

### 4. Validation additions per step

No step is rewritten from scratch — each gets targeted fixes:

| Step | Addition |
|---|---|
| CreateAd | Real URL validation on `link` (currently accepts any non-empty string) |
| Targeting | `endDate > startDate` check (currently unchecked) |
| Payment | Explicit JS-level `budget >= 10` check (currently only an HTML `min` attribute) |
| UserAdPreview / EventPreview | Align image validation (jpg/png, ≤5MB) with `CreateAd`'s existing rule |

All field-level errors render through one new `FieldError` component (small red text + icon) instead
of the current mix of ad-hoc styled `<p>` tags. Submission-level errors (Payment, Review) render
through one `AlertBanner` component.

### 5. Ad-type lock — visible, not just enforced

No functional change needed (`EditCampaign.tsx` already excludes `adType` and target fields from its
form and its update payload). Add a read-only badge at the top of `EditCampaign` — "Type: User
Spotlight" / "Event Promotion" / "Brand Campaign" — with helper text: "To change the campaign type,
create a new campaign." This makes an already-enforced constraint visible instead of a silent
omission.

### 6. Responsive pass

Audit `WizardLayout` and every step's `*.module.css` against three breakpoints (mobile <640px, tablet
640–1024px, desktop >1024px) using the existing design tokens in `styles/tokens.css`; fix any
fixed-width assumptions found. The `TargetPickerModal` is built responsive from the start (item 3).

### 7. Testing

Per this repo's existing bar for `webapp/` (Vitest unit + Playwright e2e, 80% coverage threshold):

- Unit tests for `useCampaignWizard`'s completeness predicates and state transitions.
- Unit tests for `TargetPickerModal` (search, selection, empty/error states, keyboard nav).
- Update the existing Playwright e2e campaign-creation spec(s) to reflect the merged target-selection
  step and the new blocking validation.
- Final verification: `npm run build`, `npm run lint`, `npm run test:coverage` in `webapp/`.

## Out of scope

- Backend/API changes — none needed; the type-immutability rule is already enforced server-side too.
- Admin panel (`admin/`) — read-only for campaigns, untouched.
- Allowing the target (profile/event) to change on an existing draft/rejected campaign while keeping
  the same ad type — not requested; noted as a possible future enhancement only.
- Payment/Stripe integration internals beyond the added validation messaging.
