# Deployment Status - 2026-02-17

## Service URLs

| Service | URL |
|---------|-----|
| API | `https://advertiser-api-dot-myngly-336422.uc.r.appspot.com` |
| Webapp | `https://advertiser-webapp-dot-myngly-336422.uc.r.appspot.com` |
| Admin | `https://advertiser-admin-dot-myngly-336422.uc.r.appspot.com` |

---

## Fix 1: Cross-Origin CSRF & Cookie Resolution

**Commit:** `0db954a` - fix: Resolve cross-origin CSRF and cookie issues for production deployment

### Problem

Production API returned `{"success":false,"error":"Invalid CSRF token","code":"CSRF_INVALID"}` on all mutating requests from both webapp and admin panel.

### Root Cause

1. **Public Suffix List (PSL):** `*.appspot.com` is on the PSL. Setting `COOKIE_DOMAIN=myngly-336422.uc.r.appspot.com` caused browsers to silently reject the cookie.
2. **Cross-origin cookie reading:** The webapp cannot read `document.cookie` for cookies belonging to the API (different origins).

### Changes

| File | Change |
|------|--------|
| `Dockerfile` | Removed `COOKIE_DOMAIN` env var |
| `src/infrastructure/middleware/csrf.middleware.ts` | Removed `domain`, changed `sameSite` to `'none'`, added `X-CSRF-Token` response header |
| `src/infrastructure/middleware/cors.middleware.ts` | Added `X-CSRF-Token` to `exposedHeaders` |
| `src/domains/identity/services/token.service.ts` | Removed `domain` from auth cookies, changed `sameSite` to `'none'` |
| `admin/src/api/client.ts` | Reads CSRF token from response header instead of `document.cookie` |
| `webapp/src/api/client.ts` | Same as admin client |

### Cookie Configuration

| Cookie | httpOnly | secure | sameSite | domain |
|--------|----------|--------|----------|--------|
| `csrf_token` | false | true | none | host-only (API origin) |
| `access_token` / `admin_access_token` | true | true | none | host-only (API origin) |
| `refresh_token` / `admin_refresh_token` | true | true | none | host-only (API origin) |

---

## Fix 2: Campaign Wizard - 3 Bugs Resolved

**Commit:** `f42ad0c` - fix: Resolve 3 campaign wizard bugs (image preview, payment, map)

### Bug 2a: Ad Image Preview Not Showing in Simulator

**Screen:** `campaign/new/create-ad`

**Problem:** Uploaded banner images did not display in the phone simulator preview. The preview showed an empty bordered area.

**Root Cause:** The preview section had no `<img>` tag. The uploaded `File` object was never converted to a displayable URL.

**Fix:**
| File | Change |
|------|--------|
| `webapp/src/pages/campaign/CreateAd.tsx` | Added `URL.createObjectURL()` via `useMemo` to create preview URL; added `<img>` in simulator; cleanup with `revokeObjectURL` on unmount |
| `webapp/src/pages/campaign/CreateAd.module.css` | Added `.adBannerImage` class for proper sizing inside phone mockup |

### Bug 2b: Payment Always Failing

**Screen:** `campaign/new/payment`

**Problem:** Every payment attempt returned "Payment processing failed. Please try again." regardless of card used.

**Root Cause:** Three endpoint misalignments between frontend and backend:
1. Frontend called `POST /v1/stripe/payment-intents` but backend expected `POST /v1/stripe/customers/:customerId/payment-intents`
2. Frontend called `POST /v1/stripe/payment-intents/{id}/confirm` but backend route is `POST /v1/stripe/payments/confirm`
3. Frontend passed the database ID as `paymentMethodId` instead of the Stripe ID (`pm_xxx`)

**Fix:**
| File | Change |
|------|--------|
| `src/domains/payment/routes/stripe.routes.ts` | Added new route `POST /payment-intents` (without customer ID in path) |
| `src/domains/payment/controllers/stripe.controller.ts` | Added `createPaymentIntentForUser` method that resolves Stripe customer ID from authenticated user |
| `webapp/src/api/Stripe_payments.ts` | Added `stripePaymentMethodId` to `PaymentMethod` type and mapper; fixed `confirmPayment` to call `/v1/stripe/payments/confirm` |
| `webapp/src/pages/campaign/Payment.tsx` | Looks up `stripePaymentMethodId` from selected card before calling API |

### Bug 2c: Missing Map on Targeting Page

**Screen:** `campaign/new/targeting`

**Problem:** No map was rendered, only a placeholder saying "Map preview will appear here". No lat/lng was sent to the API.

**Root Cause:** No map library was installed. Only a static placeholder `<div>` existed. No geocoding or coordinate capture was implemented.

**Fix:** Implemented interactive map using Leaflet + OpenStreetMap (free, no API key needed).

| File | Change |
|------|--------|
| `webapp/package.json` | Added `leaflet`, `react-leaflet`, `@types/leaflet` |
| `webapp/src/components/ui/LocationMap.tsx` | **New file.** Map component with OpenStreetMap tiles, Nominatim geocoding (debounced), marker + radius circle |
| `webapp/src/components/ui/index.ts` | Exported `LocationMap` |
| `webapp/src/pages/campaign/Targeting.tsx` | Replaced placeholder with `<LocationMap>`, added `latitude`/`longitude` state, saves coords to wizard session data |
| `webapp/src/pages/campaign/Targeting.module.css` | Replaced `.mapPlaceholder` with `.mapContainer` |

---

## Fix 3: Admin Login Password Visibility Toggle

**Commit:** `5e9a0ef` - fix: Enable click on password visibility toggle in admin login

**Screen:** Admin login page

**Problem:** The eye icon to show/hide password did not respond to clicks.

**Root Cause:** In `admin/src/components/ui/Input.module.css`, both `.leftIcon` and `.rightIcon` had `pointer-events: none`, which blocked all click events on the eye toggle button.

**Fix:**
| File | Change |
|------|--------|
| `admin/src/components/ui/Input.module.css` | Moved `pointer-events: none` to `.leftIcon` only; `.rightIcon` is now interactive |

---

## Fix 4: Campaign Submission Error Handling

**Commit:** `4688a95` - fix: Fix campaign submission error handling and missing targeting data

**Screen:** `campaign/new/review`

**Problem:** Clicking "Submit Campaign" always showed generic "Failed to submit campaign" error, hiding the actual backend validation error.

**Root Cause:**
1. `Review.tsx` catch block used `err instanceof Error` but `createApiError` returns a plain object `{status, message}`, not an `Error` instance — so the real error was always swallowed
2. `mapCreateRequest` didn't include `latitude`/`longitude` in the targeting payload
3. `radiusKm` was sent as a float but backend Zod schema expects `z.number().int()`
4. Backend validation field-level details were lost in `handleResponse`

**Fix:**
| File | Change |
|------|--------|
| `webapp/src/pages/campaign/Review.tsx` | Added `isApiError()` check to show actual API error message; added `latitude`/`longitude` to targeting payload |
| `webapp/src/api/campaigns.ts` | Added `latitude`/`longitude` to `CreateCampaignRequest` type and `mapCreateRequest`; changed `radiusKm` to `Math.round()` |
| `webapp/src/api/client.ts` | Enhanced `handleResponse` to append validation field details to error messages |

---

## Fix 5: "Reuse Previous Campaign" Button

**Commit:** `a09cfd6` - feat: Implement "Reuse Previous Campaign" button with wizard prefill

**Screen:** Dashboard

**Problem:** The "Reuse Previous Campaign" button had no `onClick` handler — it did nothing.

**Fix:**
| File | Change |
|------|--------|
| `webapp/src/pages/Dashboard.tsx` | Added campaign picker modal; fetches campaign details, maps to wizard format, populates sessionStorage, navigates to wizard |
| `webapp/src/pages/Dashboard.module.css` | Added modal overlay/content/list styles |
| `webapp/src/pages/campaign/SelectAdType.tsx` | Pre-populates `name` and `adType` from sessionStorage |
| `webapp/src/pages/campaign/SelectAdFormat.tsx` | Pre-populates `adFormat` from sessionStorage |
| `webapp/src/pages/campaign/SelectBoostType.tsx` | Pre-populates `boostType` from sessionStorage |
| `webapp/src/pages/campaign/CreateAd.tsx` | Pre-populates `adText` and `link` from sessionStorage |
| `webapp/src/pages/campaign/Targeting.tsx` | Pre-populates `address`, `radius`, dates, lat/lng from sessionStorage |

---

## Fix 6: Per-Ad-Type Screens (Figma Implementation)

**Commit:** `1888ff3` - feat: Add per-ad-type screens to campaign wizard (from Figma designs)

**Problem:** All three ad types (user, event, brand) followed the same flow. Figma designs show each ad type has a unique intermediate screen before continuing to the rest of the wizard.

**Figma source:** Node `3232-12473` and siblings in `Myngly Advertiser Web Panel` page.

### New Screens

| Screen | Route | Figma Source | Description |
|--------|-------|-------------|-------------|
| SearchUser | `/campaign/new/search-user` | `3232:12473` | "Who do you want to spotlight?" — @username input |
| SearchEvent | `/campaign/new/search-event` | `3232:12498` | "Which event would you like to promote?" — event name/code input |
| BrandDetails | `/campaign/new/brand-details` | `3232:12521` | "Which brand would you like to promote?" — brand name + tagline |

### Updated Flows

| Ad Type | Previous Flow | New Flow |
|---------|--------------|----------|
| Spotlighted User | Select Type → Boost Type → ... | Select Type → **Search User** → Boost Type → Create Ad → ... |
| Featured Event | Select Type → Ad Format → ... | Select Type → **Search Event** → Ad Format → Create Ad → ... |
| Promote Brand | Select Type → Ad Format → ... | Select Type → **Brand Details** → Ad Format → Create Ad → ... |

### Files Changed

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/SearchUser.tsx` | **New.** User search screen with @username input |
| `webapp/src/pages/campaign/SearchUser.module.css` | **New.** Styles for user search |
| `webapp/src/pages/campaign/SearchEvent.tsx` | **New.** Event search screen with name/code inputs |
| `webapp/src/pages/campaign/SearchEvent.module.css` | **New.** Styles for event search |
| `webapp/src/pages/campaign/BrandDetails.tsx` | **New.** Brand name + tagline input screen |
| `webapp/src/pages/campaign/BrandDetails.module.css` | **New.** Styles for brand details |
| `webapp/src/pages/campaign/index.ts` | Added exports for 3 new components |
| `webapp/src/App.tsx` | Added 3 new routes + imports |
| `webapp/src/pages/campaign/SelectAdType.tsx` | Updated navigation: user→search-user, event→search-event, brand→brand-details |
| `webapp/src/pages/campaign/SelectBoostType.tsx` | Back button → `/campaign/new/search-user` |
| `webapp/src/pages/campaign/SelectAdFormat.tsx` | Back button routes dynamically based on ad type |

---

## Fix 7: Complete Spotlighted User Campaign Flow

**Commit:** `271a758` - feat: Implement complete Spotlighted User campaign flow

### Problem

After selecting "Spotlighted User" on the ad type screen, the flow was incomplete. It went directly to Boost Type without letting the advertiser pick which user to spotlight, define a target audience, or preview the ad. The Figma designs show 4 screens specific to this ad type.

### New Flow

```
SelectAdType → SearchUser → AudienceTargeting → SelectBoostType → UserAdPreview → Targeting → Payment → Review
```

### Backend: User Search API

| File | Change |
|------|--------|
| `src/domains/user/interfaces/user-profile-repository.interface.ts` | Added `searchByName(query, limit)` to interface |
| `src/domains/user/repositories/user-profile.repository.ts` | Implemented `searchByName` using Prisma `name: { contains: query }`, active users only |
| `src/domains/user/types/user.types.ts` | Added `UserSearchResultDTO` interface (`id`, `name`, `company`, `avatar`) |
| `src/domains/user/services/user-profile.service.ts` | Added `searchUsers(query, limit)` method |
| `src/domains/user/controllers/user.controller.ts` | Added `search` handler (returns `[]` if query < 2 chars) |
| `src/domains/user/routes/user.routes.ts` | Added `GET /v1/users/search?q=` route |

### Frontend: New Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **SearchUser** | `/campaign/new/search-user` | "Who do you want to spotlight?" — live debounced search (400ms) with avatar dropdown, user selection card. Saves `spotlightUserId`, `spotlightUsername`, `spotlightUserCompany`, `spotlightUserAvatar` to wizard. |
| **AudienceTargeting** | `/campaign/new/audience-targeting` | "Define your target audience" — city text input, industry dropdown (12 options), goals multi-select chips (15 options), education chips (7 options), experience chips (6 options). Chip toggle logic: clicking "All" resets, specific chips remove "All". Saves `audienceCity`, `audienceIndustry`, `audienceGoals`, `audienceEducation`, `audienceExperience`. |
| **UserAdPreview** | `/campaign/new/user-ad-preview` | "Ad Preview" — two-column layout: left shows profile image card, right shows phone mockup with promoted profile (name, company, tags, accept/reject buttons). Premium boost shows "Featured Connections" bar. Read-only preview, no data saved. |

### Frontend: New Files

| File | Purpose |
|------|---------|
| `webapp/src/api/users.ts` | Frontend API module: `usersApi.search(query)` calls `GET /v1/users/search?q=`, uses string ObjectId from backend directly |
| `webapp/src/pages/campaign/AudienceTargeting.tsx` | Audience targeting screen component |
| `webapp/src/pages/campaign/AudienceTargeting.module.css` | 2-column grid, card styles, chip active/hover states |
| `webapp/src/pages/campaign/UserAdPreview.tsx` | Ad preview screen component |
| `webapp/src/pages/campaign/UserAdPreview.module.css` | Phone mockup, profile preview, featured bar styles |

### Frontend: Modified Files

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/SearchUser.tsx` | Rebuilt with live search, debounce, avatar dropdown, user selection |
| `webapp/src/pages/campaign/SearchUser.module.css` | Rebuilt with dropdown and avatar styles |
| `webapp/src/pages/campaign/SelectBoostType.tsx` | Conditional navigation: user flow → `user-ad-preview`, others → `create-ad`. Back: user → `audience-targeting`, others → `search-user` |
| `webapp/src/pages/campaign/index.ts` | Added exports for `AudienceTargeting` and `UserAdPreview` |
| `webapp/src/App.tsx` | Added routes for `/audience-targeting` and `/user-ad-preview` |
| `webapp/src/api/campaigns.ts` | Added `spotlightUserId` and `audience` (city, industry, goals, education, experience) to `CreateCampaignRequest`. `mapCreateRequest` flattens audience data into `targeting.interests[]` and `targeting.locationName` |
| `webapp/src/pages/campaign/Review.tsx` | Passes `spotlightUserId` and `audience` data to `campaignsApi.create()` |

### sessionStorage Wizard Data (Spotlighted User)

```json
{
  "name": "My Campaign",
  "adType": "user",
  "spotlightUserId": "123",
  "spotlightUsername": "Jane Doe",
  "spotlightUserCompany": "Acme Inc",
  "spotlightUserAvatar": "https://...",
  "audienceCity": "Austin, TX",
  "audienceIndustry": "Technology",
  "audienceGoals": ["Network", "Find investors"],
  "audienceEducation": ["Graduate degree"],
  "audienceExperience": ["6 - 10 years"],
  "boostType": "premium",
  "address": "...",
  "radius": "10",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31",
  "budget": "500",
  "paymentMethodId": "..."
}
```

---

## Fix 8: Complete Featured Event Campaign Flow

**Commit:** `3faac25` - feat: Implement complete Featured Event campaign flow

### Problem

After selecting "Featured Event" on the ad type screen, the flow went directly to ad format selection. The Figma designs show a dedicated event flow: search for an event, define target audience, preview how the event promotion will look, then continue to campaign timeline.

### New Flow

```
SelectAdType → SearchEvent → AudienceTargeting → EventPreview → Targeting → Payment → Review
```

### Database: Event Model

Added `Event` model to Prisma schema (`events` table):

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (ObjectId, PK) | MongoDB auto-generated |
| `code` | Int (unique) | Event code (e.g. 1254) |
| `name` | String | Event name |
| `address` | String | Event location address |
| `date` | DateTime | Event date and time |
| `bannerImage` | String | URL to event banner image |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

**Note:** Run `npx prisma db push` to sync the schema with MongoDB.

### Backend: Event Search API (New Domain)

| File | Purpose |
|------|---------|
| `src/domains/event/index.ts` | `buildEventDomain()` factory — wires repo → service → controller → routes |
| `src/domains/event/interfaces/event-repository.interface.ts` | `IEventRepository` interface with `searchByNameOrCode` |
| `src/domains/event/repositories/event.repository.ts` | Prisma queries: numeric input → exact code match, text → `name CONTAINS` |
| `src/domains/event/types/event.types.ts` | `EventSearchResultDTO` (id, code, name, address, date, bannerImage) |
| `src/domains/event/services/event.service.ts` | `searchEvents(query, limit)` maps DB rows to DTOs |
| `src/domains/event/controllers/event.controller.ts` | `search` handler — returns `[]` if query < 2 chars |
| `src/domains/event/routes/event.routes.ts` | `GET /search` with JWT auth |
| `src/routes/api.routes.ts` | Registered `/events` route prefix |

### Frontend: New Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **SearchEvent** | `/campaign/new/search-event` | "Which event would you like to promote?" — live debounced search (400ms) with calendar icon event cards showing code (bold), name, address, date/time. Saves `eventId`, `eventCode`, `eventName`, `eventAddress`, `eventDate`, `eventBannerImage` to wizard. |
| **EventPreview** | `/campaign/new/event-preview` | "Event Preview" — left: Event Banner card (image + code/date/name/address) with push notification note. Right: phone mockup showing Events tab with promoted event card highlighted, bottom nav, "Sponsored" label. Read-only preview. |

### Frontend: New Files

| File | Purpose |
|------|---------|
| `webapp/src/api/events.ts` | Frontend API module: `eventsApi.search(query)` calls `GET /v1/events/search?q=`, uses string ObjectId from backend directly |
| `webapp/src/pages/campaign/EventPreview.tsx` | Event preview screen component |
| `webapp/src/pages/campaign/EventPreview.module.css` | Event banner card, phone mockup with Events tab styles |

### Frontend: Modified Files

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/SearchEvent.tsx` | Rebuilt with live search, debounce, calendar icon event cards |
| `webapp/src/pages/campaign/SearchEvent.module.css` | Rebuilt with dropdown and event card styles |
| `webapp/src/pages/campaign/AudienceTargeting.tsx` | Conditional navigation: event flow Next→`event-preview`, Back→`search-event`; user flow unchanged |
| `webapp/src/pages/campaign/index.ts` | Added export for `EventPreview` |
| `webapp/src/App.tsx` | Added route for `/event-preview` |
| `webapp/src/api/campaigns.ts` | Added `eventId` to `CreateCampaignRequest` and `mapCreateRequest` |
| `webapp/src/pages/campaign/Review.tsx` | Passes `eventId` to `campaignsApi.create()` |

### sessionStorage Wizard Data (Featured Event)

```json
{
  "name": "My Event Campaign",
  "adType": "event",
  "eventId": "42",
  "eventCode": 1123,
  "eventName": "TYP Fort Worth July Happy Hour",
  "eventAddress": "3200 Kirby Dr, Suite 2A, Houston, TX.",
  "eventDate": "2025-07-10T16:30:00.000Z",
  "eventBannerImage": "https://...",
  "audienceCity": "Houston, TX",
  "audienceIndustry": "Technology",
  "audienceGoals": ["Network"],
  "audienceEducation": ["All"],
  "audienceExperience": ["All"],
  "address": "...",
  "radius": "10",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31",
  "budget": "300",
  "paymentMethodId": "..."
}
```

---

## Fix 9: Complete Promote your Brand Campaign Flow

**Commit:** `61e6909` - feat: Implement complete Promote your Brand campaign flow

### Problem

After selecting "Promote your Brand", the wizard navigation chain was broken. BrandDetails went directly to Ad Format, skipping AudienceTargeting. The CreateAd screen showed the same phone mockup (banner-style calendar) regardless of the selected ad format (Banner, Interstitial, or Push). The backend had no `brandName`/`brandTagline` fields.

### New Flow

```
SelectAdType → BrandDetails → AudienceTargeting → SelectAdFormat → CreateAd(Banner|Interstitial|Push) → Targeting → Payment → Review
```

### Backend: Brand Data Fields

Added `brandName` and `brandTagline` fields through the full backend stack:

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `brandName` (VarChar 255) and `brandTagline` (VarChar 500) to Campaign model |
| `src/domains/campaign/types/campaign.types.ts` | Added `brandName`/`brandTagline` to `CampaignDTO` and `CreateCampaignData` |
| `src/domains/campaign/validators/campaign.validator.ts` | Added `brandName`/`brandTagline` to `createCampaignSchema` |
| `src/domains/campaign/repositories/campaign.repository.ts` | Added to `create` and `duplicate` methods |
| `src/domains/campaign/services/campaign.service.ts` | Added to `create` and `duplicate` return DTOs |
| `src/domains/campaign/services/campaign.transformer.ts` | Added to `toCampaignDTO` mapper |

### Frontend: Format-Specific Emulators

CreateAd now shows 3 distinct phone mockup previews based on selected ad format:

| Format | Preview |
|--------|---------|
| **Banner** | Calendar view with banner ad card in the events section — shows ad text, uploaded image, click link |
| **Interstitial** | Full-screen dark overlay covering the phone UI — shows close button, ad image/placeholder, ad text, "Learn More" CTA |
| **Push** | Push notification bubble at top of phone screen — shows Myngly app icon, notification text, "now" timestamp; calendar view beneath |

### Frontend: Modified Files

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/BrandDetails.tsx` | Next navigation → `/audience-targeting` (was `/ad-format`) |
| `webapp/src/pages/campaign/AudienceTargeting.tsx` | Added brand flow: Back→`/brand-details`, Next→`/ad-format` |
| `webapp/src/pages/campaign/SelectAdFormat.tsx` | Simplified Back to always go to `/audience-targeting` |
| `webapp/src/pages/campaign/CreateAd.tsx` | Rebuilt preview section with 3 format-specific phone emulators |
| `webapp/src/pages/campaign/CreateAd.module.css` | Added interstitial overlay, push notification, and related styles (+130 lines) |
| `webapp/src/api/campaigns.ts` | Added `brandName`/`brandTagline` to `CreateCampaignRequest` and `mapCreateRequest` |
| `webapp/src/pages/campaign/Review.tsx` | Passes `brandName`/`brandTagline` to `campaignsApi.create()` |

### sessionStorage Wizard Data (Promote your Brand)

```json
{
  "name": "My Brand Campaign",
  "adType": "brand",
  "brandName": "Acme Corp",
  "brandTagline": "Connecting professionals worldwide",
  "audienceCity": "San Francisco, CA",
  "audienceIndustry": "Technology",
  "audienceGoals": ["Network", "Find investors"],
  "audienceEducation": ["All"],
  "audienceExperience": ["All"],
  "adFormat": "interstitial",
  "adText": "Check out our new product...",
  "link": "https://acme.com",
  "hasBanner": true,
  "address": "...",
  "radius": "15",
  "startDate": "2026-03-01",
  "endDate": "2026-04-01",
  "budget": "1000",
  "paymentMethodId": "..."
}
```

---

## Fix 10: Destination URL Validation Error

**Commit:** `a92e65f` - fix: Auto-prefix https:// on destination URLs to prevent validation error

### Problem

When submitting a campaign, the backend returned `"destinationUrl: Invalid destination URL"` if the user entered a link without the `https://` protocol prefix (e.g. just `"my"` or `"example.com"`).

### Root Cause

Backend Zod schema uses `z.string().url()` which requires a full URL with protocol. Users typically type URLs without the `https://` prefix.

### Fix

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/CreateAd.tsx` | Normalize link with `https://` prefix before saving to wizard data |
| `webapp/src/api/campaigns.ts` | Auto-prefix `https://` in `mapCreateRequest` if link doesn't start with `http://` or `https://` |

---

## Fix 11: "No Campaign Data Found" on Review Page

**Commit:** `f0143a0` - fix: Preserve wizard data across re-renders in Review page

### Problem

After clicking "Submit Campaign", the Review page showed "No campaign data found. Please start the campaign creation process." instead of the success screen.

### Root Cause

`getWizardData()` was called directly in the component body (not in state), so it re-read storage on every render. After successful submission, `localStorage.removeItem('campaignWizard')` + `setIsSubmitted(true)` triggered a re-render, which read `null` from storage before the success screen could render.

### Fix

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/Review.tsx` | Wrapped `getWizardData()` in `useState(() => ...)` so data survives re-renders after storage clear. Reordered early returns: `isSubmitted` check now comes before `!campaignData` check |

---

## Fix 12: Wizard Data Lost During Stripe Redirect (sessionStorage → localStorage)

**Commit:** `0e6ef09` - fix: Switch wizard data from sessionStorage to localStorage

### Problem

After Fix 11, the "No campaign data found" error persisted in production. Campaign data was lost when the user navigated to Stripe Checkout to add a payment card and returned.

### Root Cause

`sessionStorage` data is scoped to a single browser tab and is **lost during full-page redirects** to external domains (Stripe Checkout). When the user clicked "Add Card" → redirected to `checkout.stripe.com` → returned to the webapp, the `sessionStorage` was empty.

### Fix

Switched all 14 wizard files from `sessionStorage` to `localStorage` for the `campaignWizard` key. `localStorage` persists across tabs, redirects, and browser sessions.

| File | Change |
|------|--------|
| `webapp/src/pages/Dashboard.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/AudienceTargeting.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/BrandDetails.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/CreateAd.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/EventPreview.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/Payment.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/Review.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/SearchEvent.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/SearchUser.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/SelectAdFormat.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/SelectAdType.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/SelectBoostType.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/Targeting.tsx` | `sessionStorage` → `localStorage` |
| `webapp/src/pages/campaign/UserAdPreview.tsx` | `sessionStorage` → `localStorage` |

---

## Additional Fix: Targeting Back Navigation

**Commit:** `df02942` - fix: Use explicit back navigation in Targeting based on adType

### Problem

Targeting page used `navigate(-1)` for back navigation, which could break if the browser history was altered (e.g. by Stripe redirect).

### Fix

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/Targeting.tsx` | Back button uses explicit conditional routing: user→`/user-ad-preview`, event→`/event-preview`, brand→`/create-ad` |

---

## Deployment Required

All three services must be rebuilt and redeployed:

- **API** (`advertiser-api`): CSRF, cookie, payment route, user search, event search, brand fields. **Run `npx prisma db push` to sync Event model and brand fields with MongoDB.**
- **Webapp** (`advertiser-webapp`): All wizard fixes, new screens, reuse feature, spotlighted user flow, featured event flow, brand flow, localStorage fix
- **Admin** (`advertiser-admin`): CSRF handling, password toggle fix

**Note:** Deployment failed on 2026-02-17 due to GCP App Engine CPU quota exhaustion (`CPUS quota: 60, used: 60`). Old App Engine versions need to be cleaned up in Google Cloud Console before re-deploying.
