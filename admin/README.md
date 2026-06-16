# Myngly Admin Panel (Consolidated)

Unified admin panel for the Myngly advertising platform. Consolidates `ads_internal_admin_1_22` and `Myngly_ads_admin` into a single codebase.

## Tech Stack

- React 19, TypeScript, Vite 7
- CSS Modules with design tokens
- Cookie-based auth with CSRF protection
- lucide-react icons

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Admin login with 2FA (TOTP) support |
| `/` | Dashboard | Admin dashboard with stats and activity |
| `/users` | Users | User management with detail views |
| `/campaigns` | Campaigns | Campaign management with detail views |
| `/payments` | Payments | Stripe payment management (transactions, invoices, disputes, payouts, refunds) |
| `/emails` | Emails | SendGrid email management (logs, stats, test/bulk send) |
| `/settings` | Settings | Admin platform settings |

## Getting Started

```bash
npm install
npm run dev
```

Requires the API server running on port 3000:

```bash
# From repo root
npm run dev
```

## Login

| Email | Password | Role |
|-------|----------|------|
| `admin@myngly.com` | `Admin123!` | Super Admin |

## Features

- **2FA Login** - TOTP authenticator app support (shows code input when admin has 2FA enabled)
- **Password toggle** - Show/hide password on login form
- **Dark/light theme** - Toggle via ThemeContext
- **Role-based permissions** - super_admin, admin, moderator, viewer
- **Cookie-based auth** - httpOnly cookies with CSRF protection
- **Stripe integration** - Balance, transactions, refunds, invoices, disputes, payouts
- **SendGrid integration** - Email logs, stats, test emails, bulk emails

## Project Structure

```
src/
├── api/              # API client modules (auth, campaigns, users, settings, Stripe, SendGrid)
├── components/
│   ├── layout/       # AdminLayout, Sidebar, AdminHeader, ProtectedRoute
│   └── ui/           # Reusable UI components (Button, Card, Input, Table, Modal, etc.)
├── context/          # AuthContext, ThemeContext, ToastContext
├── hooks/            # Custom hooks (useCampaigns, useUsers, usePagination, etc.)
├── pages/            # Route pages organized by feature
│   ├── auth/         # Login
│   ├── dashboard/    # Dashboard
│   ├── users/        # Users + UserDetail
│   ├── campaigns/    # Campaigns + CampaignDetail
│   ├── payments/     # Stripe Payments
│   ├── emails/       # SendGrid Emails
│   └── settings/     # Settings
├── styles/           # Design tokens (CSS custom properties)
├── types/            # TypeScript interfaces
└── utils/            # Formatters, validation, permissions, export
```

## Build

```bash
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build
```
