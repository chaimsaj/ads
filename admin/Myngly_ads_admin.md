# Myngly Ads Admin Panel - Project Documentation

**Date**: February 4, 2026
**Status**: Phase 2 Complete - Fully integrated with Unified API
**Branch**: Advertiser_final_repo_3_2_API_only_ordenado

---

## Project Overview

This React application is an **administrative panel** for the Myngly Ads platform. It provides a dashboard for managing users, campaigns, and platform settings. The design follows the same graphic style as the Myngly Advertiser Web Panel.

### Tech Stack
- **React 19** with TypeScript
- **Vite 7** for build tooling
- **React Router DOM v7** for routing
- **Lucide React** for icons
- **CSS Modules** for scoped styling

---

## Progress Completed

### Phase 1 - Core Admin Panel ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Project Setup | ✅ Complete | Vite + React + TypeScript initialized |
| Design Tokens | ✅ Complete | Same tokens as advertiser panel (Teal/Cyan theme) |
| UI Components | ✅ Complete | Button, Input, Card, Badge (with `draft` status), Table |
| Layout Components | ✅ Complete | Sidebar, AdminHeader, AdminLayout |
| Dashboard | ✅ Complete | Stats cards, recent activity, quick stats |
| Users Tab | ✅ Complete | User table with filtering, sorting, bulk actions |
| Campaigns Tab | ✅ Complete | Campaign management with approval workflow |
| Settings Tab | ✅ Complete | General, Billing, Security, Notifications, Maintenance |

### Phase 2 - Unified API Integration ✅

| Feature | Status | Description |
|---------|--------|-------------|
| API Client | ✅ Complete | Base URL `http://localhost:3000/api`; cookie auth, CSRF, 204 handling |
| Auth API | ✅ Complete | Login with `twoFactorCode` field; `BackendAdminProfile` mapper |
| Campaigns API | ✅ Complete | `BackendCampaignDTO` mapper; approve/reject POST; bulk at `/bulk/delete` and `/bulk/status` |
| Users API | ✅ Complete | `BackendUserDTO` mapper; bulk at `/admin/v1/users/bulk` |
| Payments API | ✅ Complete | All paths under `/admin/v1/payments/` |
| Email API | ✅ Complete | Paths under `/admin/v1/email/`; test email and config status removed |
| Settings API | ✅ Complete | Update uses `{ settings: [{key, value}] }` format |
| Status Types | ✅ Complete | Campaign status includes `draft`; Badge supports all 7 statuses |

---

## Screens Implemented

| Screen | Route | Status | Features |
|--------|-------|--------|----------|
| Login | `/login` | ✅ Complete | Admin login with 2FA (TOTP) support |
| Dashboard | `/` | ✅ Complete | Stats overview, activity feed, quick stats |
| Users | `/users` | ✅ Complete | User table, search, filters, bulk actions |
| User Detail | `/users/:id` | ✅ Complete | User detail with edit and activity tabs |
| Campaigns | `/campaigns` | ✅ Complete | Campaign table, approve/reject (POST), filters, draft status |
| Campaign Detail | `/campaigns/:id` | ✅ Complete | Campaign detail with analytics |
| Payments | `/payments` | ✅ Complete | Stripe payment management (via `/admin/v1/payments/`) |
| Emails | `/emails` | ✅ Complete | Email logs and bulk send (test email tab removed) |
| Settings | `/settings` | ✅ Complete | 5 settings sections; update uses `{ settings: [{key, value}] }` format |

---

## Project Structure

```
admin/
├── src/
│   ├── api/                          # API client modules (all use backend DTO mappers)
│   │   ├── client.ts                # HTTP client (base URL: http://localhost:3000/api; 204 handling, CSRF)
│   │   ├── auth.ts                  # Login (twoFactorCode field); BackendAdminProfile mapper
│   │   ├── campaigns.ts            # BackendCampaignDTO + mapCampaign; approve/reject POST; bulk endpoints
│   │   ├── users.ts                # BackendUserDTO + mapUser; bulk at /admin/v1/users/bulk
│   │   ├── dashboard.ts            # Dashboard stats API
│   │   ├── settings.ts             # Settings with { settings: [{key, value}] } format
│   │   ├── Stripe_payments.ts      # Stripe admin (all /admin/v1/payments/ paths)
│   │   ├── SendGrid_emails.ts      # Email admin (all /admin/v1/email/ paths; no test/config endpoints)
│   │   ├── pagination.ts           # Paginated response helpers
│   │   └── index.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx      # Main layout wrapper with sidebar
│   │   │   ├── AdminHeader.tsx      # Top header with search, notifications
│   │   │   ├── Sidebar.tsx          # Navigation sidebar (collapsible)
│   │   │   ├── ProtectedRoute.tsx   # Route guard component
│   │   │   └── *.module.css
│   │   └── ui/
│   │       ├── Button.tsx           # Primary/secondary/outline/ghost/danger
│   │       ├── Input.tsx            # Form input with label/error/hint
│   │       ├── Card.tsx             # Container card with header/title/content
│   │       ├── Badge.tsx            # Status badges with dot indicator (includes 'draft' variant)
│   │       ├── Table.tsx            # Sortable, selectable data table
│   │       ├── Modal.tsx            # Portal-based modal
│   │       ├── Pagination.tsx       # Pagination controls
│   │       ├── Tabs.tsx             # Tab navigation
│   │       ├── Toast.tsx            # Toast notifications
│   │       ├── ConfirmDialog.tsx    # Confirmation dialogs
│   │       ├── ThemeToggle.tsx      # Theme switcher
│   │       └── *.module.css
│   ├── context/
│   │   ├── AuthContext.tsx          # Auth state with 2FA support
│   │   ├── ThemeContext.tsx         # Theme state (light/dark/system)
│   │   └── ToastContext.tsx         # Toast state management
│   ├── hooks/
│   │   ├── useCampaigns.ts         # Campaigns data + mutations
│   │   ├── useUsers.ts             # Users data + mutations
│   │   ├── useFetch.ts             # Generic data fetching
│   │   ├── usePagination.ts        # Pagination state
│   │   ├── usePermissions.ts       # Permission checking
│   │   └── useDebounce.ts          # Debounced search
│   ├── pages/
│   │   ├── auth/Login.tsx           # Admin login with 2FA
│   │   ├── dashboard/Dashboard.tsx  # Main dashboard with stats
│   │   ├── users/Users.tsx          # User management table
│   │   ├── users/UserDetail.tsx     # User detail modal
│   │   ├── campaigns/Campaigns.tsx  # Campaign management table
│   │   ├── campaigns/CampaignDetail.tsx # Campaign detail modal
│   │   ├── payments/Stripe_Payments.tsx # Stripe payment management
│   │   ├── emails/SendGrid_Emails.tsx   # Email logs + bulk send (no test tab)
│   │   ├── settings/Settings.tsx    # Admin settings page
│   │   └── index.ts
│   ├── styles/
│   │   └── tokens.css               # Design system CSS variables (light + dark)
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces (Campaign status includes 'draft')
│   ├── utils/
│   │   ├── export.ts               # CSV export functions
│   │   ├── formatters.ts           # Date/currency/number formatting
│   │   ├── permissions.ts          # Permission constants
│   │   └── validation.ts           # Zod schemas
│   ├── App.tsx                      # Router configuration
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
├── Myngly_ads_admin.md              # This file
└── package.json
```

---

## Design Tokens

Using the same design system as the advertiser panel:

### Colors
```css
/* Primary - Teal */
--color-primary-900: #07393c;
--color-primary-800: #2c666e;
--color-primary-700: #2d666f;

/* Secondary - Cyan */
--color-secondary-100: #eefcff;
--color-secondary-400: #90ddf0;

/* Status */
--color-success: #34a853;
--color-warning: #ffc003;
--color-error: #eb4335;
--color-info: #4285f4;
```

### Typography
```css
--font-primary: 'Inter', sans-serif;
--text-base: 14px;
--text-md: 16px;
--text-lg: 18px;
```

---

## Features by Tab

### Dashboard
- **Stats Cards**: Total Users, Active Campaigns, Revenue, Pending Approvals
- **Trend Indicators**: Percentage change with up/down arrows
- **Recent Activity**: Timeline of user registrations, campaigns, payments
- **Quick Stats**: Additional metrics in sidebar

### Users Tab
- **Data Table**: Sortable columns (Name, Role, Status, Campaigns, Spend, Joined)
- **Search**: Filter by name or email
- **Filters**: Status (active/inactive/suspended), Role (admin/user/advertiser)
- **Bulk Actions**: Activate, Suspend, Delete selected users
- **Pagination Ready**: Structure supports pagination (mock data for now)

### Campaigns Tab
- **Data Table**: ID, Name, Status, Format, Budget, Spent, CTR, Created
- **Budget Progress Bar**: Visual indicator of spend vs budget
- **Approval Workflow**: Approve/Reject buttons for campaigns in review
- **Filters**: Status, Ad Format
- **Bulk Actions**: Activate, Pause, Delete

### Settings Tab
- **General**: Site name, support email, default currency
- **Billing**: Min/max budget, commission rate
- **Security**: Auto-approve toggle, 2FA info
- **Notifications**: Email, push, weekly reports toggles
- **Maintenance**: Maintenance mode toggle, danger zone actions

---

## Running the Project

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Completed in Phase 2

### API Integration ✅
- [x] Connected to unified Node.js backend (Express + Prisma)
- [x] Admin authentication with 2FA (TOTP) support
- [x] Real-time data fetching for dashboard stats
- [x] CRUD operations for users and campaigns
- [x] Stripe payment management integration
- [x] SendGrid email management integration
- [x] Backend DTO mappers for all API responses

### Additional Features ✅
- [x] User detail view/modal
- [x] Campaign detail view with analytics charts
- [x] Export functionality (CSV)
- [x] Pagination for large datasets
- [x] Role-based access control (RBAC)
- [x] Dark mode support

### Enhanced UI ✅
- [x] Toast notifications for actions
- [x] Confirmation dialogs for destructive actions
- [x] Theme toggle (light/dark/system)

## Next Steps (Phase 3)

### Remaining Features
- [ ] Audit log / activity history UI
- [ ] Skeleton loading states
- [ ] Error boundary and error states
- [ ] Mobile responsive improvements
- [ ] Campaign moderation queue
- [ ] User verification workflow
- [ ] Financial reports and analytics
- [ ] System health monitoring
- [ ] Email template management

---

## API Endpoints (Unified API)

All endpoints are called from the admin panel API client (base URL: `http://localhost:3000/api`).

```typescript
// Auth
POST /admin/v1/auth/login       // { email, password, twoFactorCode? }
POST /admin/v1/auth/logout
GET  /admin/v1/auth/profile     // Returns BackendAdminProfile (string ObjectId)

// Dashboard
GET  /admin/v1/dashboard/stats

// Users
GET    /admin/v1/users                  // Paginated, filterable
GET    /admin/v1/users/:id
PUT    /admin/v1/users/:id
DELETE /admin/v1/users/:id
PATCH  /admin/v1/users/:id/status       // { status: "ACTIVE"|"SUSPENDED"|... }
POST   /admin/v1/users/bulk             // { action, ids: string[] }

// Campaigns
GET    /admin/v1/campaigns              // Paginated, filterable (status sent UPPERCASE)
GET    /admin/v1/campaigns/:id
DELETE /admin/v1/campaigns/:id
PATCH  /admin/v1/campaigns/:id/status   // { status: "ACTIVE"|"PAUSED"|... }
POST   /admin/v1/campaigns/:id/approve  // POST (not PATCH)
POST   /admin/v1/campaigns/:id/reject   // POST { reason }
POST   /admin/v1/campaigns/bulk/delete  // { ids: string[] }
POST   /admin/v1/campaigns/bulk/status  // { ids: string[], status: "ACTIVE"|"PAUSED" }

// Payments (Stripe)
GET    /admin/v1/payments/balance
GET    /admin/v1/payments/stats
GET    /admin/v1/payments/transactions
GET    /admin/v1/payments/transactions/:id
GET    /admin/v1/payments/transactions/:id/refunds
GET    /admin/v1/payments/transactions/:id/refund-status
POST   /admin/v1/payments/refunds
GET    /admin/v1/payments/refunds/:id
GET    /admin/v1/payments/disputes
GET    /admin/v1/payments/disputes/:id
GET    /admin/v1/payments/customers/search
GET    /admin/v1/payments/payouts
GET    /admin/v1/payments/invoices
GET    /admin/v1/payments/invoices/:id
POST   /admin/v1/payments/invoices/:id/void
GET    /admin/v1/payments/dashboard-link/:type/:id
GET    /admin/v1/payments/webhooks/:eventId
POST   /admin/v1/payments/webhooks/:eventId/retry

// Email (SendGrid)
POST   /admin/v1/email/bulk             // Send bulk emails
GET    /admin/v1/email/recent           // Get recent email logs
GET    /admin/v1/email/stats            // Get email statistics

// Settings
GET    /admin/v1/settings               // Returns BackendSetting[]
PUT    /admin/v1/settings               // { settings: [{key, value}] }
```

---

## Notes

- Fully integrated with unified API (no mock data)
- Same design tokens as advertiser panel for consistency
- All API modules use backend DTO mappers (UPPERCASE to lowercase statuses; IDs are string ObjectIds returned directly from backend)
- Campaign status type includes 'draft' (7 total statuses: active, paused, scheduled, completed, review, rejected, draft)
- Badge component supports all status variants including 'draft'
- TypeScript strict mode enabled
- CSS Modules for style isolation
