# Myngly Ads Platform - System Architecture

**Last Updated:** March 31, 2026
**Branch:** 6_3_with_MongoDB (active development), deploy (Azure CI/CD)

---

## 1. High-Level Overview

Myngly Ads is a three-tier SaaS advertising platform consisting of:

```
+------------------+     +------------------+     +------------------+     +------------------+
|  Advertiser      |     |  Admin Panel     |     |  Mobile App      |     |  Stripe / SG     |
|  Webapp (:5173)  |     |  (:5174)         |     |  (iOS/Android)   |     |  External APIs   |
+--------+---------+     +--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |                        |
         |  Cookie Auth + CSRF    |  Cookie Auth + CSRF    |  x-api-key header      |  API Keys
         v                        v                        v                        v
+--------+------------------------+------------------------+------------------------+---------+
|                              Unified API (:3000)                                            |
|                              Express + TypeScript                                           |
+--------+------------------------------------------------------------------------------------+
         |
         |  Prisma ORM
         v
+--------+---------+
|  MongoDB 7.0+    |
+------------------+
```

| Component | Tech Stack | Port | Purpose |
|-----------|-----------|------|---------|
| Unified API | Node.js, Express, TypeScript, Prisma | 3000 | Backend services |
| Advertiser Webapp | React 19, Vite 7, TypeScript | 5173 | Campaign creation and management |
| Admin Panel | React 19, Vite 7, TypeScript | 5174 | Platform administration |
| Mobile App | iOS/Android (external consumer) | - | Displays active campaigns to end users |
| Database | MongoDB 7.0+ | 27017 | Persistent data storage |

---

## 2. Backend API Architecture

### 2.1 Domain-Driven Design

The backend follows DDD principles with 10 bounded contexts organized under `src/domains/`:

```
src/domains/
  identity/          Authentication, tokens, 2FA, audit logs
  campaign/          Campaign CRUD, review workflow, CSV export, performance analytics, estimates
  user/              User profiles, notification settings, admin user management
  event/             Event search for campaign wizard (promotable events)
  payment/           Stripe integration, transactions, refunds, webhooks
  platform/          Ad formats, boost types
  notification/      SendGrid email, templates (account + campaign)
  analytics/         Dashboard metrics, campaign performance stats, tracking (impressions/clicks/conversions)
  administration/    Audit logs, system settings
  mobile/            Public mobile API for active campaigns (API key auth)
```

Each domain follows a consistent layered structure:

```
domain/
  controllers/       HTTP request handling, validation
  services/          Business logic
  repositories/      Data access (Prisma queries)
  routes/            Express route definitions
  interfaces/        TypeScript interfaces for DI
  types/             Domain-specific DTOs and types
  middleware/        Domain-specific middleware
```

### 2.2 Route Structure

All routes are mounted via `src/routes/`:

| Route Prefix | Domain | Auth | Consumers |
|-------------|--------|------|-----------|
| `GET /health` | - | None | Monitoring |
| `/api/v1/auth` | Identity | Rate limited | Webapp |
| `/api/v1/campaigns` | Campaign | JWT (user) | Webapp |
| `/api/v1/users/search` | User | JWT (user) | Webapp (live user search for spotlight) |
| `/api/v1/events/search` | Event | JWT (user) | Webapp (live event search for promotion) |
| `/api/v1/user` | User | JWT (user) | Webapp |
| `/api/v1/user/payment-methods` | Payment | JWT (user) | Webapp |
| `/api/v1/stripe` | Payment | JWT (user) | Webapp |
| `POST /api/v1/stripe/checkout-sessions/setup` | Payment | JWT (user) | Webapp (Stripe Checkout redirect) |
| `GET /api/v1/stripe/config` | Payment | JWT (user) | Debugging (Stripe publishable key) |
| `/api/v1/ads` | Platform | JWT (user) | Webapp |
| `/api/v1/email` | Notification | JWT (user) | Webapp |
| `/admin/v1/auth` | Identity | Rate limited | Admin |
| `/admin/v1/campaigns` | Campaign | JWT (admin) | Admin |
| `/admin/v1/users` | User | JWT (admin) | Admin |
| `/admin/v1/payments` | Payment | JWT (admin) | Admin |
| `/admin/v1/email` | Notification | JWT (admin) | Admin |
| `/admin/v1/settings` | Administration | JWT (admin) | Admin |
| `/admin/v1/dashboard` | Analytics | JWT (admin) | Admin |
| `/admin/v1/audit-logs` | Administration | JWT (admin) | Admin |
| `/api/v1/mobile/campaigns` | Mobile | API key (`x-api-key`) | Mobile app |
| `/api/v1/mobile/campaigns/:id` | Mobile | API key (`x-api-key`) | Mobile app |
| `/api/v1/campaigns/performance/overview` | Campaign | JWT (user) | Webapp (aggregate stats) |
| `/api/v1/campaigns/:id/performance` | Campaign | JWT (user) | Webapp (campaign performance report) |
| `/api/v1/campaigns/:id/performance/daily` | Campaign | JWT (user) | Webapp (daily performance chart) |
| `POST /api/v1/campaigns/estimate` | Campaign | JWT (user) | Webapp (forward-looking estimates) |
| `POST /api/v1/tracking/impression` | Analytics | None | Mobile app (ad impression tracking) |
| `POST /api/v1/tracking/click` | Analytics | None | Mobile app (ad click tracking) |
| `POST /api/v1/tracking/conversion` | Analytics | None | Third-party (conversion events) |
| `GET /api/v1/tracking/pixel/:campaignId.png` | Analytics | None | Third-party (1x1 pixel tracker) |
| `POST /stripe/webhooks` | Payment | Stripe signature | Stripe |

### 2.3 Middleware Chain

Requests pass through this middleware stack in order:

```
1. Helmet              Security headers (XSS, HSTS, content policy)
2. CORS                Origin whitelist from CORS_ORIGINS env
3. Request ID          UUID correlation tracking (X-Request-Id)
4. Cookie Parser       Parse incoming cookies
5. Body Parser         JSON + URL-encoded (10MB limit)
6. CSRF Protection     Token in cookie + X-CSRF-Token header
7. Request Logger      Winston structured logging
8. Rate Limiter        Per-route limits (see below)
9. Route Handlers      Domain controllers
10. 404 Handler        Unmatched routes
11. Error Handler      Structured error responses with request ID
```

### 2.4 Rate Limiting

| Limiter | Window | Max Requests | Applied To |
|---------|--------|-------------|-----------|
| General | 15 min | 300 | All routes |
| Auth | 15 min | 20 | `/api/v1/auth/*` |
| Admin Auth | 15 min | 30 | `/admin/v1/auth/*` |
| Stripe | 60 sec | 60 | `/api/v1/stripe/*` |
| Forgot Password | 1 hour | 3 | Password reset |
| Email | 1 min | 10 | Email endpoints |

---

## 3. Authentication & Security

### 3.1 Token Architecture

```
Login Request
     |
     v
[Validate Credentials] --> [Generate Token Pair]
     |                              |
     |                     +--------+--------+
     |                     |                 |
     v                     v                 v
 [Set Cookies]       access_token      refresh_token
                    (JWT, 15 min)      (7 days, hashed
                    httpOnly cookie     in DB with device
                                       metadata)
```

**Cookie Names:**
- User: `access_token`, `refresh_token`
- Admin: `admin_access_token`, `admin_refresh_token`
- CSRF: `csrf_token` (readable by JS)

**Token Properties:**
- Signed with separate secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- Refresh tokens are stored hashed in the database with device/IP metadata
- Refresh rotation: old token revoked on each refresh
- All cookies: httpOnly (except CSRF), Secure in production, SameSite=Strict

### 3.2 CSRF Protection

```
1. Server sets csrf_token cookie on first request
2. Frontend reads csrf_token from document.cookie
3. Frontend sends X-CSRF-Token header on POST/PUT/PATCH/DELETE
4. Server validates header matches cookie value
```

Exempted: GET, HEAD, OPTIONS, Stripe webhook endpoint, `/auth/refresh` endpoints, and `/v1/tracking` paths (called by mobile app and third-party pixels).

### 3.3 Two-Factor Authentication (Admin Only)

- TOTP-based (RFC 6238) via `otplib`
- QR code generation for authenticator apps
- Login field: `twoFactorCode`
- Endpoints: `/admin/v1/auth/2fa/setup`, `/2fa/enable`, `/2fa/disable`

### 3.4 Mobile API Key Authentication

The mobile API uses a static API key instead of JWT sessions:

```
Mobile App Request
     |
     v
[Read x-api-key header] --> [Compare to MOBILE_API_KEY env var]
     |                              |
     |                     +--------+--------+
     |                     |                 |
     v                     v                 v
  Match: next()      No match: 401      Key not configured: 401
```

- No user sessions or tokens — stateless per request
- API key set via `MOBILE_API_KEY` environment variable (min 32 chars)
- Rate limited by the general rate limiter (300 req/15 min)
- Only exposes active campaigns — no advertiser-sensitive data (budget, spent, metrics, review)

### 3.5 User Roles

| Role | Access |
|------|--------|
| `ADVERTISER` | Webapp - own campaigns, payments, profile |
| `ADMIN` | Admin panel - manage all users and campaigns |
| `SUPER_ADMIN` | Admin panel - full access including settings |
| Mobile API key | Mobile endpoints - read-only active campaigns |

---

## 4. Database Schema

**ORM:** Prisma 5.22.0
**Engine:** MongoDB 7.0+ (replica set required for transactions)

### 4.1 Core Collections

All collections use ObjectId strings (24-char hex) as primary keys (`@id @map("_id") @db.ObjectId`). There are no auto-increment integers.

```
users                   Advertiser accounts
admin_users             Administrator accounts (with 2FA fields)
campaigns               Ad campaigns with review workflow (+ applications, deposits counters)
campaign_targeting      Targeting rules (location, demographics, interests)
campaign_daily_stats    Daily performance metrics (+ applications, deposits)
conversion_events       Individual tracking events (impressions, clicks, applications, deposits)
payment_methods         Tokenized payment methods (Stripe references)
transactions            Payment transactions
refresh_tokens          Token storage with device metadata
audit_logs              Admin action audit trail
notification_settings   User email/push preferences
settings                System-wide key-value configuration
```

### 4.2 Key Enums

| Enum | Values |
|------|--------|
| CampaignStatus | DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ACTIVE, PAUSED, COMPLETED |
| UserStatus | ACTIVE, SUSPENDED, DELETED |
| UserRole | ADVERTISER, ADMIN, SUPER_ADMIN |
| AdType | SEARCH, DISPLAY, SOCIAL, VIDEO |
| AdFormat | TEXT, IMAGE, VIDEO, CAROUSEL |
| BoostType | STANDARD, PLUS, PREMIUM |
| TransactionStatus | PENDING, SUCCEEDED, FAILED, REFUNDED |

### 4.3 Campaign State Machine

```
DRAFT --> PENDING_REVIEW --> APPROVED --> ACTIVE --> COMPLETED
                    |                       |
                    v                       v
                REJECTED               PAUSED --> ACTIVE
```

- **Advertisers** can: create (DRAFT), submit for review, pause/resume active campaigns
- **Admins** can: approve, reject (with reason), update any status

---

## 5. External Integrations

### 5.1 Stripe (Payments)

| Feature | Implementation |
|---------|---------------|
| Customer Management | 1:1 mapping with users, auto-created on first payment |
| Payment Methods | Added via Stripe Checkout Sessions (setup mode) — no client-side Stripe SDK, card input on Stripe's hosted page; stored as Stripe PM references |
| Checkout Sessions | `POST /api/v1/stripe/checkout-sessions/setup` creates a Checkout Session in setup mode, returns redirect URL |
| Customer Management | `getOrCreateCustomer(userId)` auto-creates Stripe customer on first use, stores `stripeCustomerId` on User model |
| Publishable Key | `GET /api/v1/stripe/config` returns publishable key (kept for debugging, not used by frontends) |
| Payment Intents | Created for campaign budgets, confirmed after review |
| Invoices | Generated for billing, PDF download available |
| Refunds | Processed via admin panel, full or partial |
| Disputes | Listed and managed via admin panel |
| Webhooks | `POST /stripe/webhooks` - signature verified, events: payment_intent.succeeded/failed, charge.refunded, invoice.paid/failed, checkout.session.completed (saves payment method from setup sessions) |

### 5.2 SendGrid (Email)

| Feature | Implementation |
|---------|---------------|
| Transactional Email | Welcome, verify email, password reset |
| Campaign Notifications | Approved, rejected, started, paused, completed, budget low |
| Payment Notifications | Successful, failed, invoice |
| Admin Bulk Send | `/admin/v1/email/bulk` - send to multiple recipients; returns `{ sent, failed, results }` |
| Email Logs | In-memory tracking (last 100 emails), viewable via admin panel |
| Stats | `totalSent`, `totalFailed`, `recentEmails`, `byDay` (aggregated per-day sent/failed counts) |
| Template Categorization | Frontend derives `byTemplate` from email subjects (Verification, Password Reset, Welcome, Campaign, Billing, General) |

---

## 6. Advertiser Webapp

### 6.1 Route Map

```
/                      Landing page (public)
/auth/signin           Sign in
/auth/signup           Sign up
/auth/verify-email     Email verification
/auth/forgot-password  Password reset
/dashboard             Campaign list, bulk actions (protected)
/settings              Profile, notifications, billing, security (protected)
/campaign/new/*        6-step campaign wizard (protected)
  /boost-type          Select boost type
  /ad-format           Choose ad format
  /create-ad           Design the ad
  /targeting           Set targeting rules
  /payment             Payment method
  /review              Review and submit
/campaign/:id          Campaign details with metrics (protected)
/campaign/:id/edit     Edit campaign (draft/rejected only) (protected)
/campaign/:id/performance  Campaign performance report (KPIs, ROI, funnel, chart) (protected)
/campaign/:id/tracking     Conversion tracking setup (pixel generation) (protected)
/stripe-success        Stripe Checkout success callback (auto-closes tab)
```

### 6.2 API Layer Pattern

All API modules follow the same backend DTO mapper pattern:

```typescript
// Backend returns UPPERCASE enums, ObjectId strings
interface BackendCampaignDTO {
  id: string;  // 24-char hex ObjectId (already a string — no String() conversion needed)
  status: 'ACTIVE' | 'DRAFT' | ...;
}

// Frontend uses lowercase strings
function mapCampaign(dto: BackendCampaignDTO): Campaign {
  return {
    id: dto.id,  // IDs are already strings — no String(dto.id) conversion required
    status: dto.status.toLowerCase(),
  };
}
```

### 6.3 Key Features

- Cookie-based auth with automatic CSRF token handling
- Campaign creation wizard with 6-step flow
- Pause/resume active campaigns
- Submit draft campaigns for review
- Payment method management via Stripe Checkout Sessions (no client-side Stripe SDK)
- "Add Card" redirects to Stripe's hosted checkout page; webhook saves card on completion
- Return-from-Stripe detection via URL query params (`?payment_method_added=true`)
- Notification bell dropdown with preferences link
- Profile editing
- Billing methods modal with list/delete/set-default via backend API

---

## 7. Admin Panel

### 7.1 Route Map

```
/login                 Admin login with 2FA support (public)
/                      Dashboard - stats, activity feed (protected)
/users                 User list with search, filters, bulk actions (protected)
/campaigns             Campaign list with approve/reject workflow (protected)
/payments              Stripe overview, transactions, disputes (protected)
/emails                Email logs, stats, bulk send (protected)
/settings              System settings management (protected)
```

### 7.2 API Layer Pattern

All admin API modules transform backend responses to frontend models:

| Module | Backend Path | Key Transformations |
|--------|-------------|-------------------|
| `client.ts` | Base: `http://localhost:3000` | 204 handling, CSRF, session expiry events, `{ success, data }` unwrapping |
| `auth.ts` | `/admin/v1/auth/*` | `twoFactorCode` field, BackendAdminProfile mapper |
| `campaigns.ts` | `/admin/v1/campaigns/*` | BackendCampaignDTO mapper, approve/reject via POST, bulk at `/bulk/status` + `/bulk/delete` |
| `users.ts` | `/admin/v1/users/*` | BackendUserDTO mapper, bulk at `/bulk`, UPPERCASE status |
| `Stripe_payments.ts` | `/admin/v1/payments/*` | Stripe PaymentIntent→StripeTransaction mapper, DisputeInfo→StripeDispute mapper, Stripe Refund mapper, placeholder data for unconfigured Stripe, crash-proof error handling |
| `SendGrid_emails.ts` | `/admin/v1/email/*` | BackendEmailStatsDTO mapper (derives `byTemplate` from subjects, passes `byDay`), bulk send response mapper (`sent/failed` → `successCount/failedCount`), recent email logs mapper |
| `settings.ts` | `/admin/v1/settings` | Update payload: `{ settings: [{key, value}] }` |
| `dashboard.ts` | `/admin/v1/dashboard/*` | Dashboard statistics |

### 7.3 Pagination Format

Backend returns:
```json
{
  "data": [...],
  "meta": { "currentPage": 1, "lastPage": 5, "perPage": 20, "total": 100 },
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." }
}
```

Admin frontend maps to:
```json
{
  "data": [...],
  "pagination": { "page": 1, "totalPages": 5, "limit": 20, "total": 100 }
}
```

---

## 8. Error Handling

### 8.1 API Response Formats

**Success (with data):**
```json
{ "success": true, "data": { ... } }
```

**Success (paginated):**
```json
{ "data": [...], "meta": { ... }, "links": { ... } }
```

**Error:**
```json
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE", "requestId": "uuid" }
```

**204 No Content:** Empty body (handled by frontend clients)

### 8.2 Error Hierarchy

```
AppError (base)
  ├── ValidationError (422)
  ├── UnauthorizedError (401)
  ├── ForbiddenError (403)
  ├── NotFoundError (404)
  ├── ConflictError (409)
  └── RateLimitError (429)
```

---

## 9. Infrastructure

### 9.1 Environment Configuration

All environment variables are validated at startup with Zod schemas (`src/config/environment.ts`).

| Variable | Required | Default | Description |
|----------|---------|---------|-------------|
| `DATABASE_URL` | Yes | - | MongoDB connection string (`mongodb://...`) — must target a replica set for transaction support |
| `JWT_ACCESS_SECRET` | Yes | - | Access token signing key (64+ chars) |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh token signing key (64+ chars) |
| `PORT` | No | 3000 | API server port |
| `NODE_ENV` | No | development | Environment mode |
| `CORS_ORIGINS` | No | localhost:5173,5174 | Allowed CORS origins |
| `STRIPE_SECRET_KEY` | No | - | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | No | - | Stripe webhook signing secret |
| `STRIPE_PUBLISHABLE_KEY` | No | - | Stripe publishable key (exposed to frontend via `/stripe/config`) |
| `SENDGRID_API_KEY` | No | - | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | No | - | Sender email for SendGrid |
| `COOKIE_DOMAIN` | No | localhost | Cookie domain |
| `COOKIE_SECURE` | No | false | Secure cookie flag |
| `MOBILE_API_KEY` | No | - | API key for mobile endpoints (32+ chars) |

### 9.2 Logging

- **Logger:** Winston 3.17.0
- **Format:** Structured JSON with timestamp, level, message, context
- **Request logging:** HTTP method, path, status code, response time, request ID
- **Database logging:** Query logging in development mode via Prisma events

### 9.3 Build & Run

```bash
# API
npm run dev          # Development with hot reload (tsx watch)
npm run build        # TypeScript compile to dist/
npm run start        # Production (node dist/index.js)

# Database (MongoDB — no SQL migrations)
npm run db:push      # Push schema changes to MongoDB (prisma db push)
npm run db:seed      # Load seed data

# Webapp
cd webapp && npm run dev      # Vite dev server (:5173)
cd webapp && npm run build    # Production build

# Admin
cd admin && npm run dev       # Vite dev server (:5174)
cd admin && npm run build     # Production build
```

### 9.4 Testing

| Type | Framework | Location | Command |
|------|-----------|----------|---------|
| Unit + Integration | Vitest 2.1.8 | `tests/` | `npm test` |
| E2E (Webapp) | Playwright 1.42.0 | `webapp/e2e/` | `cd webapp && npm run test:e2e` |
| E2E (Admin) | Playwright | `admin/e2e/` | `cd admin && npm run test:e2e` |
| Coverage | Vitest | - | `npm run test -- --coverage` |

**Test Credentials:**
- Advertiser: `john@example.com` / `Password123!`
- Admin: `admin@myngly.com` / `Admin123!`

### 9.5 Docker

All three components are containerized with multi-stage Dockerfiles and orchestrated via Docker Compose.

**Dockerfiles:**

| File | Base Image | Build Output | Port | Server |
|------|-----------|-------------|------|--------|
| `Dockerfile.api` | node:20-alpine | TypeScript → `dist/` | 3000 | `node dist/index.js` |
| `Dockerfile.webapp` | node:20-alpine | Vite → `dist/` | 5173 | `serve -s dist` |
| `Dockerfile.admin` | node:20-alpine | Vite → `dist/` | 5174 | `serve -s dist` |

All Dockerfiles use multi-stage builds (build stage with devDeps, production stage with minimal footprint). `NODE_ENV=production` is set in all production stages. API re-generates Prisma client in production stage (platform-specific binary).

**Docker Compose (`docker-compose.yml`):**

```
docker compose up
```

| Service | Image | Port | Depends On |
|---------|-------|------|-----------|
| `db` | mongo:7.0 (replica set) | 27017 | - |
| `api` | Dockerfile.api | 3000 | db (healthy) |
| `webapp` | Dockerfile.webapp | 5173 | api (healthy) |
| `admin` | Dockerfile.admin | 5174 | api (healthy) |

**Startup chain:** MongoDB replica set healthcheck → API runs `prisma db push` + starts → API healthcheck → frontends start.

**Environment:**
- `env_file: .env` loads backend secrets from host at runtime (JWT, Stripe, SendGrid, etc.)
- `DATABASE_URL` is overridden to point to `db` container inside the Docker network (`mongodb://db:27017/...?replicaSet=rs0`)
- `VITE_API_URL` is a build arg baked into frontend bundles at build time (defaults: webapp `http://localhost:3000/api`, admin `http://localhost:3000`)
- MongoDB data is persisted in a named volume (`mongo_data`)

**`.dockerignore`:** Excludes node_modules, dist, .git, .env, test files, .claude, and markdown files from build context.

---

## 10. Work Completed

### 10.1 Repository Consolidation

The project was consolidated from separate repositories into a unified monorepo:
- Backend API (previously standalone)
- Advertiser webapp (previously `Myngly_ads_app_1_21`)
- Admin panel (previously `Myngly_ads_admin/ads_internal_admin_1_22`)

### 10.2 Backend Development

- Domain-driven architecture with 8 bounded contexts
- Prisma ORM with MongoDB, full schema pushed via `prisma db push` with seed data
- Cookie-based authentication replacing localStorage tokens
- CSRF protection on all mutating endpoints
- TOTP two-factor authentication for admin users
- Stripe integration: customers, payment intents, invoices, refunds, webhooks
- SendGrid integration: transactional and notification emails with templates
- Rate limiting across all endpoint categories
- Comprehensive error handling with request correlation
- Zod validation on all inputs
- Winston structured logging
- 85%+ unit test coverage (1,010 tests)
- E2E test suite with Playwright

### 10.3 Advertiser Webapp Integration

- Replaced all mock data with live API calls
- Backend DTO mappers for all API modules (UPPERCASE enums to lowercase, ObjectId strings passed through directly)
- Campaign CRUD with proper field name mappings
- 6-step campaign creation wizard connected to API
- Payment method management via Stripe Checkout Sessions (zero client-side Stripe packages)
- "Add Card" calls `POST /v1/stripe/checkout-sessions/setup` → redirects to Stripe hosted page → webhook saves card
- BillingMethodsModal: list/delete/set-default via backend API; add card via Stripe Checkout redirect
- BackendPaymentMethodDTO mapper (flat backend → nested frontend `PaymentMethod` with `.card`)
- Profile editing connected to API
- Cookie-based auth with CSRF token handling
- Sign out via AuthContext (Header + Settings page)
- Notification bell dropdown
- Campaign pause/resume toggle
- Edit guard (only draft/rejected campaigns editable)
- Submit for Review action on draft campaigns
- Bulk actions with Promise.allSettled for partial failure handling
- React 18 StrictMode double-fetch prevention (useRef guards)

### 10.4 Admin Panel Integration

- Fixed API client base URL to include `/api` prefix
- Added 204 No Content response handling
- Fixed auth login field (`twoFactorCode` not `totpCode`)
- Added BackendCampaignDTO mapper (UPPERCASE to lowercase, ObjectId strings passed through)
- Added BackendUserDTO mapper (same pattern)
- Fixed campaign approve/reject to use POST (not PATCH)
- Fixed campaign bulk endpoints (`/bulk/status` + `/bulk/delete`)
- Fixed user bulk endpoint (`/bulk` not `/bulk-action`)
- Fixed all Stripe payment paths (`/admin/v1/payments/` not `/stripe/admin/`)
- Fixed all SendGrid email paths (`/admin/v1/email/` not `/email/`)
- Removed non-existent email endpoints (test email, config status, notification triggers)
- Fixed settings update payload format (`{ settings: [{key, value}] }`)
- Added `draft` status to Campaign type and StatusBadge component
- Updated SendGrid_Emails page to match available backend endpoints

### 10.5 Admin Panel Design & Stability Fixes

- Rewrote SendGrid_Emails page from Tailwind utility classes to CSS modules (Tailwind not configured in admin)
- Removed invoices/payouts tabs from Payments page (no backend endpoints)
- Removed getDashboardLink calls (no backend endpoint)
- Removed dark theme entirely (ThemeContext, ThemeToggle, dark CSS vars, ThemeProvider)
- Increased adminAuthLimiter from 5 to 30 requests per 15 minutes

### 10.6 Payments Page Crash Fixes

Fixed multiple crash-causing issues in the admin Payments screen:

- **Response shape mismatch**: Backend returns raw arrays (Stripe PaymentIntent[], DisputeInfo[]) but frontend expected wrapped objects (`{ transactions: [...] }`, `{ disputes: [...] }`). Fixed by updating API return types.
- **Stripe PaymentIntent → StripeTransaction mapper**: Maps `id→stripePaymentIntentId`, `created` (Unix)→`createdAt` (ISO), Stripe status ("succeeded")→app status ("completed"), `metadata.userId/campaignId`
- **DisputeInfo → StripeDispute mapper**: Maps backend dispute DTO to frontend type (removed non-existent `stripeDisputeId` field)
- **Stripe Refund mapper**: Maps raw Stripe Refund object (`created` Unix timestamp) to frontend type
- **Placeholder data**: API functions return safe defaults (empty balance, zero stats, empty arrays) when Stripe is not configured, preventing crashes
- **Null-safe rendering**: All field access uses `??` fallbacks, empty state messages for tables, `useRef` guard against double-fetch
- **Separated error handling**: Each API function catches independently so partial data can still render

### 10.7 Admin Panel UX Fixes (Emails, Users, Notifications, Dashboard, Settings)

- **Emails screen blank fix**: Added fallback data (EMPTY_STATS, EMPTY_LOGS) in SendGrid_emails API so failed requests return safe defaults instead of throwing. Component now tracks `statsLoading` state separately, showing "Loading..." only while fetching and zeroed stats cards on failure.
- **Add User button**: Wired onClick to display informational toast (users register through the app).
- **Notifications bell**: Replaced non-functional bell button with dropdown showing "No new notifications" and a link to Notification Preferences in Settings. Removed hardcoded badge "3". Added click-outside-to-close behavior.
- **Dashboard recent activity**: Added empty state message ("No recent activity to display") when recentActivity array is empty.
- **Settings notification toggles**: Connected all 3 notification toggles (email, push, weekly reports) to `AdminSettings` state via `handleChange`, replacing non-functional `defaultChecked` with controlled `checked` + `onChange`. Added `emailNotifications`, `pushNotifications`, `weeklyReports` fields to AdminSettings type.
- **Settings Danger Zone buttons**: Wired Clear Cache, Reset Statistics, and Purge All Data buttons to ConfirmDialog with confirmation prompts and toast feedback.

### 10.8 Admin Header Cleanup

- Removed global search box from AdminHeader (non-functional, just UI noise)
- Changed header `justify-content` to `flex-end` to keep actions right-aligned

### 10.9 Webapp Campaign Editing Fix

Fixed EditCampaign page not loading campaign data:

- **Date format mismatch**: Backend returns ISO dates (`"2026-02-03T00:00:00.000Z"`), but HTML `<input type="date">` requires `YYYY-MM-DD`. Added `toDateString()` mapper in `campaigns.ts` that strips the time component. Applied to `startDate`, `endDate`, `createdAt` in both `mapCampaignSummary` and `mapCampaignDetail`.
- **No error recovery page**: EditCampaign showed errors as subtle red text above an empty form, making it look "not loaded." Added dedicated error view with back-to-details link (matching CampaignDetails pattern).
- **Null guard in getById**: API now validates response before passing to mapper, throwing clear error if campaign not found.
- **Defensive null safety**: All form field assignments use `|| ''` fallbacks.

### 10.10 Stripe & SendGrid Integration Fixes (2_9_stripe_and_sendgrid_fixes)

**Webapp - Stripe Elements Integration (later replaced by Checkout Sessions):**
- Originally added `@stripe/stripe-js` and `@stripe/react-stripe-js` with `CardElement`
- Replaced in `2_9_STRIPE_integration_only_API` with Stripe Checkout Sessions (see 10.11)

**Backend - Stripe Config Endpoint:**
- Added `GET /v1/stripe/config` returning `{ publishableKey }` from environment
- Route requires auth but does NOT require Stripe to be fully configured (separate from payment routes)

**Backend - Transaction Filtering:**
- `listTransactions` service now accepts `startDate` and `endDate`, converts to Unix timestamps for Stripe API's `created` filter
- Controller parses `startDate`/`endDate` from query params and passes to service
- Added post-query `status` filtering in controller (Stripe API doesn't support status filter on `paymentIntents.list`)

**Backend - Email Stats Enhancement:**
- `EmailService.getStats()` now computes `byDay` array by grouping `recentEmails` on date
- Added `EmailDayStatsDTO` type and `byDay` field to `EmailStatsDTO`

**Admin - Email Response Mapping:**
- Fixed `sendBulkEmail()` response mapping: backend returns `{ sent, failed, results }`, frontend expected `{ successCount, failedCount, totalRecipients }`
- Added `BackendEmailStatsDTO` interface with `byDay` field
- `mapEmailStats()` now derives `byTemplate` from email subjects using `categorizeEmailTemplate()` (keyword-based: Verification, Password Reset, Welcome, Campaign, Billing, General)
- `getEmailLogs()` handles multiple response shapes (array, `{ recentEmails }`, `{ logs }`)

**Admin - Refund Validation:**
- Added client-side refund amount validation: positive check, max amount check (cannot exceed original transaction)
- Fixed cents conversion: `parseInt` → `Math.round(parseFloat(...) * 100)` for proper decimal handling

### 10.11 Remove Direct Stripe from Frontends - API-Only Architecture (2_9_STRIPE_integration_only_API)

**Goal:** ALL Stripe communication goes through the backend API. Zero direct Stripe connections from any frontend.

**Backend - Stripe Checkout Sessions:**
- New endpoint: `POST /v1/stripe/checkout-sessions/setup` — creates a Stripe Checkout Session in `setup` mode
- `StripeCustomerService.getOrCreateCustomer(userId)` — auto-creates Stripe customer if none exists, stores `stripeCustomerId` on User model
- `StripeCustomerService.createCheckoutSessionForSetup()` — creates session with metadata, returns `{ url, sessionId }`
- Validation schema: `createCheckoutSessionSetupSchema` (optional `successUrl`, `cancelUrl`)

**Backend - Process Checkout Session Endpoint:**
- New endpoint: `POST /v1/stripe/checkout-sessions/:sessionId/process` — explicitly processes a completed Checkout Session
- `StripeCustomerService.processCheckoutSession(sessionId, userId)` — retrieves session from Stripe, extracts payment method, saves to DB, sets as default
- Idempotent: if card already saved (by webhook), returns existing card and ensures it's default
- Validates user ownership via session metadata
- Success URL now includes `{CHECKOUT_SESSION_ID}` template — Stripe substitutes with actual session ID on redirect

**Backend - Webhook: `checkout.session.completed`:**
- Added to `WebhookEventType` union and `StripeWebhookService` handler registry
- Handler flow: verify `mode === 'setup'` → extract `userId` from metadata → retrieve setup intent → retrieve payment method → check duplicates by `stripePaymentMethodId` → check max 10 limit → save via `IPaymentMethodRepository.create()`
- Always sets new card as default (calls `setAsDefault` after creating)

**Backend - Database:**
- Added `stripeCustomerId` field to `User` model in Prisma schema
- Migration: `0002_add_stripe_customer_id_to_users`

**Webapp - Removed Stripe Client SDK:**
- Removed `@stripe/stripe-js` and `@stripe/react-stripe-js` from `package.json` (6 packages removed)
- Removed `AddPaymentMethodRequest` interface, `addPaymentMethod`, `getPublishableKey`, `createSetupIntent` from API layer
- Added `createCheckoutSessionSetup()` and `processCheckoutSession()` API methods
- `BillingMethodsModal`: removed `AddCardForm`, `CardElement`, `loadStripe`, `Elements` — "Add Card" now calls API and redirects to Stripe hosted page; on return, calls `processCheckoutSession` with session ID to explicitly save the card and set as default
- `Payment.tsx`: removed broken raw card number form (PCI violation) — "Add Card" now redirects to Stripe Checkout; on return, calls `processCheckoutSession` to save and set default
- `Settings.tsx`: detects `?payment_method_added=true&session_id=cs_xxx` query params on return from Stripe, passes `sessionId` to `BillingMethodsModal`
- `Payment.tsx`: detects return from Stripe Checkout, extracts `session_id` param, calls process endpoint to save card
- Card save flow: frontend explicitly calls `POST /checkout-sessions/:sessionId/process` on return from Stripe — no longer relies on polling; webhook serves as backup
- Every newly added card is automatically set as default
- `localStorage` preserves campaign wizard data across Stripe redirect (survives full-page navigation)

**Admin Panel:** Already API-only. Zero changes needed. No Stripe packages.

**Files Changed:**

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Added `stripeCustomerId` to User model |
| `prisma/migrations/0002_*/migration.sql` | ALTER TABLE users ADD stripe_customer_id |
| `src/domains/payment/types/stripe.types.ts` | Added `checkout.session.completed` to WebhookEventType |
| `src/domains/payment/services/stripe-customer.service.ts` | Added PrismaClient + IPaymentMethodRepository, `getOrCreateCustomer`, `createCheckoutSessionForSetup` (with `{CHECKOUT_SESSION_ID}` template), `processCheckoutSession` |
| `src/domains/payment/services/stripe-webhook.service.ts` | Added `IPaymentMethodRepository`, `checkout.session.completed` handler, always sets new card as default |
| `src/domains/payment/controllers/stripe.controller.ts` | Added `createCheckoutSessionSetup` and `processCheckoutSession` methods |
| `src/domains/payment/validators/payment.validator.ts` | Added `createCheckoutSessionSetupSchema`, `checkoutSessionIdParamSchema` |
| `src/domains/payment/routes/stripe.routes.ts` | Added `POST /checkout-sessions/setup` and `POST /checkout-sessions/:sessionId/process` routes |
| `src/domains/payment/index.ts` | Wired `prisma` + `paymentMethodRepo` into services |
| `webapp/package.json` | Removed `@stripe/stripe-js`, `@stripe/react-stripe-js` |
| `webapp/src/api/Stripe_payments.ts` | Removed 3 methods + 1 interface, added `createCheckoutSessionSetup` and `processCheckoutSession` |
| `webapp/src/api/index.ts` | Removed `AddPaymentMethodRequest` export |
| `webapp/src/pages/settings/BillingMethodsModal.tsx` | Full rewrite: Stripe Elements → redirect; design aligned; explicit processCheckoutSession call |
| `webapp/src/pages/settings/Settings.module.css` | Added `.emptyState` CSS class |
| `webapp/src/pages/settings/Settings.tsx` | Added return-from-Stripe detection with `sessionId` extraction |
| `webapp/src/pages/campaign/Payment.tsx` | Replaced broken card form with redirect; explicit processCheckoutSession call on return |
| `webapp/src/pages/campaign/Payment.module.css` | Added alert, badge, and state CSS classes |
| `webapp/src/pages/campaign/EditCampaign.tsx` | Removed Payment Method section from budget panel |

### 10.12 Mobile API Endpoints (external_API)

**Goal:** Provide public-facing API endpoints for the Myngly mobile app to consume active campaigns with geographic filtering.

**Architecture:**
- New bounded context: `src/domains/mobile/` with full layered structure (types, interfaces, repositories, services, middleware, validators, controllers, routes, factory)
- API key authentication via `x-api-key` header (no JWT sessions)
- Haversine formula for geo-filtering campaigns by user lat/long within targeting radius
- Lean DTOs that exclude advertiser-only data (budget, spent, metrics, review info)
- In-memory pagination after geo-filtering (active campaigns are a small subset)

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/mobile/campaigns` | List active campaigns with optional filters |
| `GET` | `/api/v1/mobile/campaigns/:id` | Get single campaign detail for ad display |

**Query Parameters (list endpoint):**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int (1-50) | 20 | Items per page |
| `adType` | enum | - | Filter: USER, EVENT, BRAND |
| `adFormat` | enum | - | Filter: BANNER, INTERSTITIAL, PUSH |
| `latitude` | float (-90..90) | - | User location (requires longitude) |
| `longitude` | float (-180..180) | - | User location (requires latitude) |

**Geo-filtering logic:**
- If lat/long provided: campaigns are included only if the user is within the campaign's `targeting.radiusKm`
- Campaigns without geo-targeting (no lat/long in targeting) are always included (they target all locations)
- Uses Haversine formula (`src/domains/mobile/services/haversine.ts`)

**Response DTOs:**
- `MobileCampaignListDTO`: id, name, adType, boostType, adFormat, adText, bannerImage, destinationUrl, startDate, endDate, targeting
- `MobileCampaignDetailDTO`: extends list DTO with `schedule` (startDate, endDate, isCurrentlyActive)
- `MobileTargetingDTO`: locationName, latitude, longitude, radiusKm, ageMin, ageMax, gender, interests, devices, platforms

**Files Created:**

| File | Purpose |
|------|---------|
| `src/domains/mobile/types/mobile.types.ts` | DTOs, filters, pagination types |
| `src/domains/mobile/interfaces/mobile-campaign-repository.interface.ts` | Repository interface |
| `src/domains/mobile/repositories/mobile-campaign.repository.ts` | Prisma queries (ACTIVE + date-range + not deleted) |
| `src/domains/mobile/services/haversine.ts` | Haversine distance function |
| `src/domains/mobile/services/mobile-campaign.transformer.ts` | Entity → DTO mapping (reuses mapEnum) |
| `src/domains/mobile/services/mobile-campaign.service.ts` | Business logic + geo-filtering |
| `src/domains/mobile/middleware/api-key.middleware.ts` | x-api-key header validation |
| `src/domains/mobile/validators/mobile.validator.ts` | Zod schemas (lat/long paired validation) |
| `src/domains/mobile/controllers/mobile-campaign.controller.ts` | Express handlers |
| `src/domains/mobile/routes/mobile.routes.ts` | Route definitions with auth + validation |
| `src/domains/mobile/index.ts` | Domain factory (buildMobileDomain) |
| `src/routes/mobile.routes.ts` | Route mounting with rate limiter |

**Files Modified:**

| File | Change |
|------|--------|
| `src/config/environment.ts` | Added `MOBILE_API_KEY` to Zod schema (optional, min 32 chars) |
| `.env.example` | Added `MOBILE_API_KEY` placeholder |
| `src/routes/index.ts` | Mount `/api/v1/mobile` routes |

### 10.13 Docker Configuration (2_11)

**Goal:** Containerize all three platform components (API, webapp, admin) with Docker and orchestrate the full stack locally with MongoDB.

**Files Created:**

| File | Purpose |
|------|---------|
| `.dockerignore` | Excludes node_modules, dist, .git, .env, test files, .claude from build context |
| `Dockerfile.api` | Multi-stage Node 20 Alpine build: `npm ci` → `prisma generate` → `tsc` → production stage with `--omit=dev` |
| `Dockerfile.webapp` | Multi-stage build: `npm ci` → `vite build` → `serve` static files on port 5173 |
| `Dockerfile.admin` | Same pattern as webapp, port 5174 |
| `docker-compose.yml` | Full stack: MongoDB 7 replica set + API + webapp + admin with healthcheck chain |

**Key decisions:**
- Static server: Node `serve` package (not Nginx) for frontend containers
- Frontend env: `VITE_API_URL` configurable via Docker build args (baked at build time by Vite)
- API startup: `prisma db push` runs before `node dist/index.js` (syncs schema to MongoDB, idempotent)
- Healthcheck chain: MongoDB replica set → API (`/health` endpoint) → frontends
- `env_file: .env` loads host secrets at runtime; `DATABASE_URL` overridden to point to `db` container

---

## 11. Current Status & Known Issues

### 11.1 Completed Fixes (All Committed & Pushed)

| Fix | Commit | Files Changed |
|-----|--------|---------------|
| Admin API alignment (8 modules) | Prior sessions | admin/src/api/* |
| Admin panel design (Tailwind→CSS modules) | e1dd657 | admin emails, payments, settings |
| Dark theme removal | e1dd657 | ThemeContext, ThemeToggle, tokens.css, main.tsx |
| Rate limit increase (5→30) | e1dd657 | rate-limit.middleware.ts |
| Payments crash fixes (mappers+fallbacks) | 876f265 | Stripe_payments.ts, Stripe_Payments.tsx |
| Emails blank screen | 590688b | SendGrid_emails.ts, SendGrid_Emails.tsx |
| Add User button | 590688b | Users.tsx |
| Notifications bell dropdown | 590688b | AdminHeader.tsx, AdminHeader.module.css |
| Dashboard recent activity empty state | 590688b | Dashboard.tsx, Dashboard.module.css |
| Settings notifications toggles | 590688b | Settings.tsx, settings.ts, types/index.ts |
| Settings Danger Zone buttons | 590688b | Settings.tsx |
| Remove admin header search box | ebabd44 | AdminHeader.tsx, AdminHeader.module.css |
| Webapp campaign editing | 48c5498 | campaigns.ts, EditCampaign.tsx |
| Admin emails DTO mapper | a59c140 | SendGrid_emails.ts |
| Stripe Elements integration (replaced by Checkout Sessions) | af6437e | BillingMethodsModal.tsx, Stripe_payments.ts, package.json |
| Stripe config endpoint | af6437e | stripe.controller.ts, stripe.routes.ts |
| Remove direct Stripe from frontends (API-only) | 5fdcbda | 15 files (see 10.11) |
| BillingMethodsModal design alignment with other modals | 040819e | BillingMethodsModal.tsx, Settings.module.css |
| Remove Payment Method from EditCampaign budget panel | a74f8ab | EditCampaign.tsx |
| Fix card not appearing after Stripe Checkout (polling) | db26aca | BillingMethodsModal, Settings, Payment.tsx, Payment.module.css |
| Process checkout session endpoint + always set default | pending | 10 files (see 10.11) |
| Transaction date/status filtering | af6437e | admin-payment.controller.ts, stripe-admin.service.ts |
| Email byDay stats | af6437e | email.service.ts, notification.types.ts |
| Admin email response mapping | af6437e | SendGrid_emails.ts |
| Admin refund validation | af6437e | Stripe_Payments.tsx |
| Mobile API endpoints (active campaigns + geo-filtering) | 07b081b | 15 files (see 10.12) |
| Docker configuration (Dockerfiles + compose) | pending | 5 files (see 10.13) |
| Cross-origin CSRF & cookie fix | 0db954a | csrf.middleware.ts, cors.middleware.ts, token.service.ts, both clients |
| Campaign wizard 3 bugs (image preview, payment, map) | f42ad0c | CreateAd.tsx, Payment.tsx, Targeting.tsx, stripe.routes.ts |
| Admin password visibility toggle | 5e9a0ef | admin Input.module.css |
| Campaign submission error handling | 4688a95 | Review.tsx, campaigns.ts, client.ts |
| Reuse Previous Campaign button | a09cfd6 | Dashboard.tsx, 5 wizard steps |
| Per-ad-type screens (Figma) | 1888ff3 | SearchUser, SearchEvent, BrandDetails + routing |
| Complete Spotlighted User flow (4 screens + API) | 271a758 | 18 files (see status.md Fix 7) |
| Complete Featured Event flow (Event model + API + 2 screens) | 3faac25 | 19 files (see status.md Fix 8) |
| Complete Promote your Brand flow (brand fields + emulators) | 61e6909 | 13 files (see status.md Fix 9) |
| Explicit back navigation in Targeting by adType | df02942 | Targeting.tsx |
| Auto-prefix https:// on destination URLs | a92e65f | CreateAd.tsx, campaigns.ts |
| Preserve wizard data across re-renders in Review | f0143a0 | Review.tsx |
| Switch wizard data sessionStorage → localStorage | 0e6ef09 | 14 wizard files (see status.md Fix 12) |
| Stripe new-tab flow (preserves auth) | 3480c61 | Payment.tsx, StripeSuccess.tsx, App.tsx |
| Fix card not appearing after Stripe add | 992662e | Payment.tsx (processCheckoutSession on tab return) |
| Show actual Stripe error messages | c616009 | Payment.tsx |
| Hardcoded mock events (Event 1/2/3 Myngly) | 44f78d5 | SearchEvent.tsx |
| Image upload on UserAdPreview | 6abffda | UserAdPreview.tsx |
| Image upload on EventPreview | 6abffda | EventPreview.tsx |
| Hardcoded verification code (123456) | 6abffda | auth.service.ts |
| ROI tracking, performance dashboard, campaign UX | 3ee3b14 | 35 files (see 10.14) |
| Restrict conversion tracking to draft/active only | 303527d | Dashboard.tsx, CampaignPerformance.tsx |
| Fix tracking routes path (/v1 → /api/v1) | 45b4ba5 | index.ts, csrf.middleware.ts |
| Live phone preview in EditCampaign ad content tab | f88893b | EditCampaign.tsx, EditCampaign.module.css (see 10.15) |

### 10.15 EditCampaign Live Ad Preview

**Committed:** March 31, 2026 (f88893b)

**Problem:** When editing a campaign's ad content, users saw only form fields with no visual feedback. The creation flow had full phone mockup previews but the edit flow did not.

**Fix:** Added a live phone mockup preview to the "Ad Content" tab that matches the campaign's actual ad type and format. The preview updates in real-time as the user edits.

| Ad Type | Preview Shown |
|---------|---------------|
| USER (Spotlighted User) | Myngly connection card with avatar, name, sponsored badge, ad text, interest tags |
| EVENT (Featured Event) | Events tab with promoted event card, banner image, date, address |
| BRAND + Banner | Calendar app mockup with ad card showing image, text, click-through link |
| BRAND + Interstitial | Full-screen dark overlay with ad image, text, CTA button |
| BRAND + Push | iOS push notification simulation with text and image |

**Layout:** Two-column grid on Ad Content tab (form left, preview right). Targeting and Budget tabs remain single-column. Responsive: collapses to single column below 1024px.

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/EditCampaign.tsx` | Added phone mockup preview conditional on adType/adFormat, blob URL for uploaded images, two-column layout on Ad Content tab |
| `webapp/src/pages/campaign/EditCampaign.module.css` | Added `.contentWithPreview` grid, phone mockup styles for all three ad types, responsive breakpoint |

### 10.14 ROI Tracking, Performance Dashboard & Campaign UX Improvements

**Committed:** March 31, 2026 (3ee3b14)
**35 files changed, 3,589 lines added**

#### Area 1: Campaign Status Toggle Fix

**Problem:** Toggling campaign on/off from dashboard showed "Failed to update campaign status" for DRAFT campaigns (backend state machine prevents DRAFT → ACTIVE).

**Fix:**
- Dashboard toggle now disabled (grayed out) for campaigns not in ACTIVE or PAUSED status
- Backend returns user-friendly error messages per status (e.g., "Cannot activate a Draft campaign. Submit for review first.")
- Frontend catch block extracts and displays actual backend error instead of generic message

| File | Change |
|------|--------|
| `webapp/src/pages/Dashboard.tsx` | Disabled toggle for non-toggleable statuses, show real errors |
| `webapp/src/pages/Dashboard.module.css` | Added `.toggleDisabled` style |
| `src/domains/campaign/services/campaign.service.ts` | Friendly error messages per status |

#### Area 2: Interstitial Ad Full-Screen Preview

**Problem:** Interstitial preview in SelectAdFormat showed a small "Ad Content" box at top instead of full-screen overlay.

**Fix:** Replaced with full-screen dark overlay (rgba(0,0,0,0.85)) covering entire phone mockup with close button, ad creative placeholder, descriptive text, and CTA button.

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/SelectAdFormat.tsx` | Full-screen overlay replacing small box |
| `webapp/src/pages/campaign/Campaign.module.css` | New interstitial overlay CSS classes |

#### Area 3: City Autocomplete (Texas Cities)

**Problem:** City field was free-text allowing invalid entries like "Ajajahah".

**Fix:** Built autocomplete component with 723 Texas cities. Debounced search, keyboard navigation, match highlighting, ARIA accessibility.

| File | Change |
|------|--------|
| `webapp/src/data/texas-cities.ts` | 723 Texas cities sorted alphabetically |
| `webapp/src/components/ui/CityAutocomplete.tsx` | Autocomplete component with dropdown |
| `webapp/src/components/ui/CityAutocomplete.module.css` | Dropdown/item styling |
| `webapp/src/pages/campaign/AudienceTargeting.tsx` | Replaced free-text input with CityAutocomplete |

#### Area 5A: Click/Impression/Conversion Tracking (Backend)

**New tracking endpoints** for the Myngly mobile app and third-party websites to record ad events:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/v1/tracking/impression` | POST | None | Record ad impression |
| `/v1/tracking/click` | POST | None | Record ad click |
| `/v1/tracking/conversion` | POST | None | Record conversion (application/deposit) |
| `/v1/tracking/pixel/:campaignId.png` | GET | None | 1x1 transparent pixel tracker |

**Tracking flow:**
1. Mobile app calls tracking endpoints when ads are displayed/clicked
2. Backend creates `ConversionEvent` record and increments campaign counters
3. Daily stats upserted in `CampaignDailyStats`
4. UTM parameters auto-appended to destination URLs (`utm_source=myngly`, `utm_medium=in_app_ad`, `utm_campaign={id}`)

**Conversion pixel:** Universities place a 1x1 transparent PNG on their "Application Submitted" or "Deposit Paid" pages. When the page loads, the pixel fires and records the conversion.

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `ConversionEvent` model, `applications`/`deposits` fields to Campaign and CampaignDailyStats |
| `src/domains/analytics/services/tracking.service.ts` | TrackingService with event recording + counter updates |
| `src/domains/analytics/controllers/tracking.controller.ts` | HTTP handlers + 1x1 pixel response |
| `src/domains/analytics/validators/tracking.validator.ts` | Zod schemas for tracking payloads |
| `src/domains/analytics/routes/tracking.routes.ts` | Route definitions |
| `src/domains/analytics/utils/utm-builder.ts` | UTM parameter appender |
| `src/infrastructure/middleware/csrf.middleware.ts` | CSRF exemption for tracking paths |

#### Area 5B: Conversion Pixel Setup Page (Frontend)

New page where advertisers generate tracking pixels for their campaigns.

| Feature | Description |
|---------|-------------|
| Campaign selector | Dropdown to pick which campaign |
| Conversion type | Application or Deposit cards |
| Code snippet | Dark code block with copy button |
| Setup instructions | 3-step guide with info box |
| Test button | Send test conversion to verify pixel works |
| Tracking status | Active/not installed per pixel type |

| File | Change |
|------|--------|
| `webapp/src/pages/campaign/ConversionTracking.tsx` | Full pixel setup page |
| `webapp/src/pages/campaign/ConversionTracking.module.css` | Page styling |

#### Area 5C: Campaign Performance Dashboard

New performance report page accessible via "View Report" link on each campaign.

| Section | Content |
|---------|---------|
| KPI Cards | Total Spend, Impressions, Clicks, CTR, Applications, Deposits, ROI |
| ROI Statement | "You spent $X, received Y clicks, Z applications, and W deposits, resulting in an ROI of N%." |
| Conversion Funnel | Impressions → Clicks → Applications → Deposits with percentages |
| Daily Chart | CSS-based bar chart with 7/14/30 day tabs |

**ROI Calculation:** `((deposits * DEFAULT_DEPOSIT_VALUE) - spend) / spend * 100`
- `DEFAULT_DEPOSIT_VALUE` = $5,000 (global default, TODO: make configurable from admin panel)

**Dashboard Enhancement:** Aggregate stats row (Total Spend, Campaigns, Impressions, Clicks, Avg CTR) + Impressions/Clicks/CTR columns in campaign table.

| File | Change |
|------|--------|
| `src/domains/campaign/services/campaign-performance.service.ts` | Performance summary, daily stats, overview |
| `src/domains/campaign/controllers/campaign-performance.controller.ts` | HTTP handlers |
| `webapp/src/pages/campaign/CampaignPerformance.tsx` | Full performance dashboard page |
| `webapp/src/pages/campaign/CampaignPerformance.module.css` | Dashboard styling |
| `webapp/src/api/campaigns.ts` | Performance API methods + interfaces |
| `webapp/src/pages/Dashboard.tsx` | Aggregate stats + performance columns + View Report links |
| `webapp/src/pages/Dashboard.module.css` | Overview grid styling |

#### Area 5D: Forward-Looking Performance Estimates

Estimated performance shown on Review page before campaign submission, similar to Meta/Google Ads.

**Estimation logic** (industry benchmarks, hardcoded initially):

| Ad Format | CPM Range | CTR Range |
|-----------|-----------|-----------|
| Banner | $5-$8 | 0.5-1.5% |
| Interstitial | $10-$15 | 2.0-5.0% |
| Push Notification | $3-$6 | 3.0-8.0% |

Estimates card shows: Estimated Reach, Estimated Clicks, Estimated CTR, Estimated CPC (all as ranges).

| File | Change |
|------|--------|
| `src/domains/campaign/services/campaign-estimator.service.ts` | Pure calculation service |
| `src/domains/campaign/validators/campaign.validator.ts` | Added `estimateSchema` |
| `src/domains/campaign/routes/campaign.routes.ts` | POST `/v1/campaigns/estimate` endpoint |
| `webapp/src/pages/campaign/Review.tsx` | Estimates card between details and payment |
| `webapp/src/pages/campaign/Review.module.css` | Estimates card styling |

### 11.2 Webapp Pages Status

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Landing | `/` | Working | Static page |
| Sign In | `/auth/signin` | Working | Cookie auth + CSRF |
| Sign Up | `/auth/signup` | Working | |
| Verify Email | `/auth/verify-email` | Working | |
| Forgot Password | `/auth/forgot-password` | Working | |
| Dashboard | `/dashboard` | Working | Campaign list, aggregate stats, performance columns (Impressions/Clicks/CTR), View Report links, disabled toggle for DRAFT |
| Campaign Details | `/campaign/:id` | Working | Pause/resume, submit for review, edit guard |
| Edit Campaign | `/campaign/:id/edit` | Working | Live phone preview on Ad Content tab (matches ad type: user/event/brand), date format fix, error page |
| Campaign Creation | `/campaign/new/*` | Working | Multi-path wizard by ad type with city autocomplete (Texas), image upload on previews, forward-looking estimates on Review. User: type→search-user→audience-targeting→boost→user-ad-preview→targeting→payment→review. Event: type→search-event→audience-targeting→event-preview→targeting→payment→review. Brand: type→brand-details→audience-targeting→ad-format→create-ad→targeting→payment→review |
| Performance Report | `/campaign/:id/performance` | Working | KPI cards, ROI statement, conversion funnel, daily chart |
| Conversion Tracking | `/campaign/:id/tracking` | Working | Pixel generation, copy snippet, test verification |
| Stripe Success | `/stripe-success` | Working | Auto-close tab after card added |
| Settings | `/settings` | Working | Profile edit, billing methods (Stripe Checkout in new tab), sign out, notification prefs |

### 11.3 Admin Pages Status

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Login | `/login` | Working | Cookie auth |
| Dashboard | `/` | Working | Stats cards, empty recent activity state |
| Users | `/users` | Working | Table, search, filters, bulk actions, export, detail drawer |
| Campaigns | `/campaigns` | Working | Table, search, filters, approve/reject |
| Payments | `/payments` | Working | Overview/transactions/disputes tabs, date/status filtering, refund validation |
| Emails | `/emails` | Working | Overview stats (byDay + byTemplate), logs table, bulk email with proper response mapping |
| Settings | `/settings` | Working | General, billing, security, notifications, maintenance + danger zone |

### 11.4 Key Architecture Patterns

**Backend→Frontend DTO Mapping Pattern** (used everywhere):
1. Define `BackendXxxDTO` interface matching raw backend response
2. Define frontend `Xxx` interface for component consumption
3. Write `mapXxx(dto)` function to transform (lowercase enums, ObjectId strings passed through directly, date formats, field renames)
4. API functions call `apiClient.get()` → `mapXxx(raw)`

**Crash-proof API Pattern** (payments, emails):
1. Each API function has its own try/catch
2. Catch returns safe default (empty array, zero stats, empty object)
3. Component renders fallback UI when data is placeholder

**Date Handling**:
- Backend stores/returns ISO 8601 strings (`"2026-02-03T00:00:00.000Z"`)
- Frontend `toDateString()` converts to `YYYY-MM-DD` for date inputs
- Display formatting done via `toLocaleDateString()` or `toLocaleString()`

**Auth Flow**:
- Cookie-based sessions (httpOnly, SameSite)
- CSRF token in cookie → `x-csrf-token` header on mutations
- `handleResponse` dispatches `auth:session-expired` on 401
- `ProtectedRoute` redirects to `/auth/signin` if not authenticated

### 11.5 Documentation

Comprehensive documentation maintained across 7+ files:
- `system_architecture.md` - This file (master reference)
- `docs/PROJECT_STRUCTURE.md` - Full project structure reference
- `docs/STRIPE_INTEGRATION.md` - Stripe integration guide
- `docs/SENDGRID_INTEGRATION.md` - SendGrid integration guide
- `docs/RUNBOOK.md` - Operations runbook with configuration details
- `docs/CONTRIB.md` - Contributing guide with API route reference
- `docs/TEST_DOCUMENTATION.md` - Testing documentation
- `admin/Myngly_ads_admin.md` - Admin panel feature tracker

---

## 12. MySQL → MongoDB Migration

**Completed:** March 3, 2026

The project was migrated from MySQL 8.0+ to MongoDB 7.0+. Prisma ORM is retained; only the provider and schema conventions changed.

### 12.1 Summary of Changes

| Area | Before (MySQL) | After (MongoDB) |
|------|---------------|----------------|
| Database engine | MySQL 8.0+ | MongoDB 7.0+ (replica set) |
| Prisma provider | `mysql` | `mongodb` |
| Primary key type | `Int @default(autoincrement())` | `String @id @map("_id") @db.ObjectId @default(auto())` |
| All FK / relation IDs | `Int` | `String @db.ObjectId` |
| Decimal fields | `Decimal` | `Float` (MongoDB Prisma does not support Decimal) |
| BigInt fields | `BigInt` | `Int` (safe for ad metrics) |
| Migration command | `prisma migrate dev` / `prisma migrate deploy` | `prisma db push` (no SQL migration files) |
| `DATABASE_URL` format | `mysql://user:pass@host:3306/db` | `mongodb://host:27017/db?replicaSet=rs0` |
| Docker DB service | `mysql:8.0` on port 3306 | `mongo:7.0` (replica set) on port 27017 |
| Docker volume | `mysql_data` | `mongo_data` |
| Cyclic relations | No special action needed | `onDelete: NoAction, onUpdate: NoAction` required |
| ID handling in frontend | `String(dto.id)` to convert number to string | `dto.id` directly — ObjectId is already a string |
| Bulk operation IDs | `ids.map(Number)` | String IDs sent directly |

### 12.2 Prisma Schema Conventions (MongoDB)

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  // all FK fields also use @db.ObjectId
  campaigns Campaign[]
}

model Campaign {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  userId String @db.ObjectId
  user   User   @relation(fields: [userId], references: [id],
                           onDelete: NoAction, onUpdate: NoAction)
}
```

Key rules:
- Every `@id` field must have `@map("_id") @db.ObjectId`
- Every foreign key scalar must have `@db.ObjectId`
- Cyclic or self-referential relations require `onDelete: NoAction, onUpdate: NoAction`
- `Decimal` → `Float`, `BigInt` → `Int`

### 12.3 Operational Notes

- **Transactions:** MongoDB requires a replica set to support multi-document transactions. The Docker container must be started with `--replSet rs0` and initialized with `rs.initiate()`.
- **No migration history:** Unlike MySQL, there are no `prisma/migrations/` SQL files. Schema is applied with `prisma db push`. To reset: drop the database and re-push.
- **Seeding:** `prisma db seed` works the same; seed scripts must use ObjectId-compatible string IDs.
- **Indexes:** Prisma `@@index` and `@@unique` directives map to MongoDB indexes; compound unique constraints behave identically.
- **`DATABASE_URL` example:**
  ```
  mongodb://localhost:27017/myngly_ads?replicaSet=rs0&authSource=admin
  ```
