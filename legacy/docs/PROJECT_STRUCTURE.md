# Project Structure

## Branch: `Advertiser_final_repo_3_2_API_only_ordenado`

**Repository:** `chaimsaj/admin_panel_claude`
**Date:** 2026-02-04

---

## Repository Structure

```
/
├── src/                          # Node.js API (Express + Prisma)
├── prisma/                       # Database schema and seed (MongoDB)
│   ├── schema.prisma             # Prisma data model (MongoDB provider)
│   └── seed.ts                   # Development seed data
├── tests/                        # API tests (unit + integration)
├── docs/                         # All documentation
├── package.json                  # API dependencies
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Test config
│
├── webapp/                       # Advertiser-facing React webapp
│   ├── src/                      # React source (Vite + TypeScript)
│   ├── e2e/                      # Playwright E2E tests
│   ├── public/                   # Static assets
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.ts            # Vite build config
│   └── playwright.config.ts      # E2E test config
│
└── admin/                        # Admin panel React webapp
    ├── src/                      # React source (Vite + TypeScript)
    ├── package.json              # Frontend dependencies
    └── vite.config.ts            # Vite build config
```

---

## API-Only Architecture

All React webapps operate exclusively through the Unified API. No frontend page renders data without first fetching it from the API.

### API Endpoints Used by Frontends

| Webapp | Endpoint Pattern | Auth |
|--------|-----------------|------|
| Advertiser Webapp | `/api/v1/*` (42 public endpoints) | Cookie-based + CSRF |
| Admin Panel | `/admin/v1/*` (50 admin endpoints including `/admin/v1/payments/*` and `/admin/v1/email/*`) | Cookie-based + CSRF + admin role |

---

## Component Details

### 1. Unified API (`/` root)

**Tech Stack:** Node.js, Express, TypeScript, Prisma ORM, MongoDB
**Architecture:** Domain-driven design

| Domain | Description |
|--------|-------------|
| `src/domains/identity/` | Authentication, authorization, 2FA, JWT tokens |
| `src/domains/campaign/` | Campaign CRUD, review, export, admin management |
| `src/domains/payment/` | Stripe payments, webhooks, invoices, refunds |
| `src/domains/notification/` | SendGrid email templates and notifications |
| `src/domains/analytics/` | Dashboard analytics and reporting |
| `src/domains/administration/` | Audit logs, system settings |
| `src/domains/platform/` | Ad formats, boost types |
| `src/domains/user/` | User profiles, notification settings, admin management |

**Infrastructure:**
- `src/infrastructure/auth/` - Crypto services
- `src/infrastructure/database/` - Prisma client (MongoDB)
- `src/infrastructure/errors/` - Error classes (AppError, NotFound, Forbidden, etc.)
- `src/infrastructure/http/` - Response helpers, error handler, validation middleware
- `src/infrastructure/logging/` - Logger and request logging
- `src/infrastructure/middleware/` - CORS, CSRF, rate limiting
- `src/infrastructure/utils/enum-mapper.ts` - Maps Prisma enum names (e.g. `ACTIVE`) to `@map()` values (e.g. `active`) expected by frontends

**Tests:** Unit tests per domain + E2E journey tests (`tests/e2e/`)

---

### 2. Advertiser Webapp (`/webapp/`)

**Tech Stack:** React, TypeScript, Vite, CSS Modules
**Purpose:** Advertiser-facing app for creating and managing ad campaigns

| Page | File | Description |
|------|------|-------------|
| Landing Page | `src/pages/LandingPage.tsx` | Public landing page |
| Dashboard | `src/pages/Dashboard.tsx` | Advertiser dashboard |
| Sign In | `src/pages/auth/SignIn.tsx` | Login |
| Sign Up | `src/pages/auth/SignUp.tsx` | Registration |
| Forgot Password | `src/pages/auth/ForgotPassword.tsx` | Password reset |
| Verify Email | `src/pages/auth/VerifyEmail.tsx` | Email verification |
| Select Ad Type | `src/pages/campaign/SelectAdType.tsx` | Campaign wizard step |
| Select Ad Format | `src/pages/campaign/SelectAdFormat.tsx` | Campaign wizard step |
| Select Boost Type | `src/pages/campaign/SelectBoostType.tsx` | Campaign wizard step |
| Create Ad | `src/pages/campaign/CreateAd.tsx` | Ad creation |
| Targeting | `src/pages/campaign/Targeting.tsx` | Audience targeting |
| Review | `src/pages/campaign/Review.tsx` | Campaign review |
| Payment | `src/pages/campaign/Payment.tsx` | Stripe payment |
| Campaign Details | `src/pages/campaign/CampaignDetails.tsx` | Campaign view with status-aware pause/resume/edit |
| Edit Campaign | `src/pages/campaign/EditCampaign.tsx` | Campaign editing (draft/rejected only) |
| Settings | `src/pages/settings/Settings.tsx` | User settings with sign-out via AuthContext |

**UI Components:** Button, Card, Badge, Input, SelectionCard, Skeleton
**Badge Variants:** `active`, `paused`, `scheduled`, `completed`, `review`, `draft`, `rejected`, `default`
**API Layer:** `src/api/` (client, campaigns, user, SendGrid, Stripe integrations)
- `campaigns.ts` - `CampaignSummary.status` supports all 7 statuses; backend DTO mappers
- `Stripe_payments.ts` - `BackendPaymentMethodDTO` mapper transforms flat backend fields (`cardType`, `lastFour`, `expiryMonth`, `expiryYear`) into nested `PaymentMethod.card` object
**Hooks:** `src/hooks/` (useCurrentUser)
**Context:** AuthContext (provides `logout()` used by Header and Settings for sign-out)
**State:** Campaign wizard uses `sessionStorage` for multi-step persistence
**Tests:** Unit tests + Playwright E2E (`e2e/`)

#### Campaign Status Business Rules

| Status | Can Edit? | Pause/Resume Button | Notes |
|--------|-----------|---------------------|-------|
| `draft` | Yes | Hidden | Pre-submission state |
| `rejected` | Yes | Hidden | Admin rejected; advertiser can revise |
| `review` | No | Hidden | Awaiting admin approval |
| `active` | No | Pause Campaign | Running campaign |
| `scheduled` | No | Pause Campaign | Future start date |
| `paused` | No | Resume Campaign | Temporarily halted |
| `completed` | No | Hidden | Campaign finished |

#### Header Features

- **Notification Bell** (dashboard variant): Dropdown with "No new notifications" message and link to Notification Preferences. Click-outside closes dropdown.
- **User Menu**: Profile, Settings, Sign Out. Sign Out calls `logout()` from AuthContext.
- **Mobile Menu**: Responsive hamburger menu with all navigation links.

#### Billing Methods Modal

- Lists saved payment methods via `stripePaymentsApi.getPaymentMethods()` (mapped from backend DTO)
- Each card displays brand, last four digits, expiry, and default badge
- Set Default and Remove actions available per card
- "Add New Card" shows a Stripe Elements integration stub (coming soon)

---

### 3. Admin Panel (`/admin/`)

**Tech Stack:** React 19, TypeScript, Vite 7, CSS Modules
**Purpose:** Unified admin panel for managing the advertising platform
**Package name:** `myngly-admin-panel`

| Route | Page | File | Description |
|-------|------|------|-------------|
| `/login` | Login | `src/pages/auth/Login.tsx` | Admin login with 2FA (TOTP) support |
| `/` | Dashboard | `src/pages/dashboard/Dashboard.tsx` | Admin dashboard |
| `/users` | Users | `src/pages/users/Users.tsx` | User management |
| `/users/:id` | User Detail | `src/pages/users/UserDetail.tsx` | User detail view |
| `/campaigns` | Campaigns | `src/pages/campaigns/Campaigns.tsx` | Campaign management |
| `/campaigns/:id` | Campaign Detail | `src/pages/campaigns/CampaignDetail.tsx` | Campaign detail view |
| `/payments` | Payments | `src/pages/payments/Stripe_Payments.tsx` | Stripe payment management |
| `/emails` | Emails | `src/pages/emails/SendGrid_Emails.tsx` | SendGrid email management (logs, stats, bulk send) |
| `/settings` | Settings | `src/pages/settings/Settings.tsx` | Admin settings |

**UI Components:** Button, Card, Badge (with `draft` status variant), Input, Table, Modal, Pagination, Tabs, Toast, ConfirmDialog, ThemeToggle
**Hooks:** useCampaigns, useDebounce, useFetch, usePagination, usePermissions, useUsers
**Context:** AuthContext (with 2FA), ThemeContext, ToastContext
**API Layer:** `src/api/` -- All modules use backend DTO mappers:
- `client.ts` -- Base URL defaults to `http://localhost:3000/api`; handles 204 No Content, CSRF tokens, and session expiry
- `auth.ts` -- Login sends `twoFactorCode` (not `totpCode`); `BackendAdminProfile` mapper (backend returns string ObjectIds directly)
- `campaigns.ts` -- `BackendCampaignDTO` interface and `mapCampaign` mapper (UPPERCASE to lowercase statuses; IDs are string ObjectIds from backend); approve/reject use POST; bulk endpoints at `/admin/v1/campaigns/bulk/delete` and `/admin/v1/campaigns/bulk/status`
- `users.ts` -- `BackendUserDTO` interface and `mapUser` mapper (same pattern); bulk endpoint at `/admin/v1/users/bulk`
- `Stripe_payments.ts` -- All paths under `/admin/v1/payments/` (not `/stripe/admin/`)
- `SendGrid_emails.ts` -- Paths under `/admin/v1/email/` (not `/email/`); only bulk send, logs (`/recent`), and stats endpoints (test email and config status removed -- no backend support)
- `settings.ts` -- Update payload uses `{ settings: [{key, value}] }` format; `BackendSetting` mapper
- `dashboard.ts` -- Dashboard stats API
**Utilities:** export, formatters, permissions, validation

---

## How to Run

### API (root)
```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

### Advertiser Webapp
```bash
cd webapp
npm install
npm run dev
```

### Admin Panel
```bash
cd admin
npm install
npm run dev
```

Login: `admin@myngly.com` / `Admin123!`

---

## File Counts

| Component | Files | TSX Pages | Status |
|-----------|-------|-----------|--------|
| Unified API (root) | 246 | - | Active |
| Advertiser Webapp | 63 | 21 | Active |
| Admin Panel | 91 | 9 | Active |
| Root docs & config | ~10 | - | Active |
