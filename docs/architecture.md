# Architecture — `admin` & `webapp`

Both front-ends are React 19 + TypeScript built with Vite 7, routed with React Router v7, styled with CSS Modules over a `tokens.css` design-token layer, and authenticated against the unified API with httpOnly cookies + CSRF. They share the same toolchain (identical `tsconfig.app.json` and ESLint flat config) and the same folder taxonomy.

## Shared folder taxonomy

```
src/
├── api/          # HTTP client + per-resource API modules
├── components/
│   ├── layout/   # App shell (header, sidebar/footer, route guards)
│   └── ui/       # Reusable primitives (Button, Card, Input, Badge, …)
├── context/      # React context providers (auth, toast, …)
├── hooks/        # Custom hooks
├── pages/        # Route components, grouped by feature, with barrel index.ts
├── styles/       # tokens.css (design tokens)
├── types/        # Shared TypeScript types
└── utils/        # Formatters, validation, helpers
```

---

## `admin` — back-office panel

Stack: React 19, React Router v7, `lucide-react`, `zod`. No test setup.

**Routing** ([admin/src/App.tsx](../admin/src/App.tsx)) uses the layout-route pattern: a public `/login`, then everything else nested under `<ProtectedRoute>` → `<AdminLayout>`.

| Route | Page |
|-------|------|
| `/login` | Login (2FA / TOTP supported) |
| `/` | Dashboard |
| `/users`, `/users/:id` | Users + detail |
| `/campaigns`, `/campaigns/:id` | Campaigns + detail (approve/reject) |
| `/payments` | Stripe payments |
| `/emails` | SendGrid emails |
| `/settings` | Platform settings |

**Providers** are wired in [admin/src/main.tsx](../admin/src/main.tsx): `AuthProvider` → `ToastProvider` → `App` + `ToastContainer`.

**Auth** ([admin/src/context/AuthContext.tsx](../admin/src/context/AuthContext.tsx)) loads the profile on mount and transparently retries via `authApi.refresh()` on failure.

**API** ([admin/src/api/client.ts](../admin/src/api/client.ts)): base URL defaults to `http://localhost:3000` (override with `VITE_API_URL`); handles CSRF headers and 204 responses. Resource modules: `auth`, `campaigns`, `users`, `dashboard`, `settings`, `Stripe_payments`, `SendGrid_emails`, plus `pagination` helpers. Modules map backend DTOs (UPPERCASE statuses → lowercase) to UI types.

---

## `webapp` — advertiser app

Stack: React 19, React Router v7, `lucide-react`, `leaflet` + `react-leaflet` (location targeting). Tests: Vitest unit + Playwright e2e.

**Routing** ([webapp/src/App.tsx](../webapp/src/App.tsx)) wraps protected pages individually in `<ProtectedRoute>`. The core is a multi-step campaign-creation wizard.

| Group | Routes |
|-------|--------|
| Public | `/`, `/stripe-success` |
| Auth | `/auth/signin`, `/auth/signup`, `/auth/verify-email`, `/auth/forgot-password` |
| App | `/dashboard`, `/settings` |
| Campaign wizard | `/campaign/new` → `…/search-user`, `…/search-event`, `…/brand-details`, `…/audience-targeting`, `…/boost-type`, `…/ad-format`, `…/create-ad`, `…/targeting`, `…/payment`, `…/review`, previews |
| Campaign management | `/campaign/:id`, `…/edit`, `…/performance`, `…/tracking` |

**Providers**: `AuthProvider` wraps the routes inside `App.tsx` (the entry [webapp/src/main.tsx](../webapp/src/main.tsx) only mounts `App`).

**API** ([webapp/src/api/client.ts](../webapp/src/api/client.ts)): base URL defaults to `http://localhost:3000/api`. The client tracks auth state and transparently refreshes the token on a `401`, then retries the original request; it also surfaces field-level validation details from error responses. Resource modules: `auth`, `users`, `user`, `campaigns`, `events`, `Stripe_payments`, `SendGrid_emails`.

**Testing**: unit tests co-located as `*.test.tsx` (config in [webapp/vitest.config.ts](../webapp/vitest.config.ts), 80% coverage thresholds); e2e specs in [webapp/e2e](../webapp/e2e) ([webapp/playwright.config.ts](../webapp/playwright.config.ts)).

---

## Design system

Each app ships its own `tokens.css` (CSS custom properties: colors, typography, spacing, shadows, transitions) consumed by component-scoped `*.module.css`. **Note:** the two token files and several "shared" primitives (e.g. `Button`, the API client) have diverged between the apps — see [structure-validation.md](structure-validation.md). They are not yet a single shared library.
