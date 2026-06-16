# Myngly Ads Admin - Development Status

**Date:** February 4, 2026 (originally January 22, 2026)

## Overview

Complete implementation of Phase 2 for the Myngly Ads Admin panel. Originally a standalone full-stack app with its own Node.js backend, the admin panel is now fully integrated with the Unified API (`/admin/v1/*` endpoints). The standalone `Node_API/` backend is no longer used.

---

## Completed Sub-Phases

### Sub-Phase 2.0: Node.js Backend API

**Location:** `Node_API/`

**Features:**
- Express server running on port 3001
- JWT authentication with bcrypt password hashing
- Zod validation middleware
- In-memory JSON store with file persistence
- CORS enabled for frontend integration

**API Endpoints (Unified API -- replaces standalone Node_API):**

> **Updated 2026-02-04:** All endpoints now use the unified API at `http://localhost:3000/api`. The admin panel API client modules append `/admin/v1/` prefixes.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/v1/auth/login | Login with email/password/twoFactorCode |
| POST | /admin/v1/auth/logout | Logout (clear cookies) |
| GET | /admin/v1/auth/profile | Get current admin profile |
| GET | /admin/v1/dashboard/stats | Dashboard statistics |
| GET | /admin/v1/users | List users (paginated) |
| GET | /admin/v1/users/:id | Get user by ID |
| PUT | /admin/v1/users/:id | Update user |
| DELETE | /admin/v1/users/:id | Delete user |
| PATCH | /admin/v1/users/:id/status | Change user status (UPPERCASE) |
| POST | /admin/v1/users/bulk | Bulk activate/suspend/delete |
| GET | /admin/v1/campaigns | List campaigns (paginated) |
| GET | /admin/v1/campaigns/:id | Get campaign by ID |
| DELETE | /admin/v1/campaigns/:id | Delete campaign |
| PATCH | /admin/v1/campaigns/:id/status | Change campaign status (UPPERCASE) |
| POST | /admin/v1/campaigns/:id/approve | Approve campaign (POST, not PATCH) |
| POST | /admin/v1/campaigns/:id/reject | Reject campaign (POST, not PATCH) |
| POST | /admin/v1/campaigns/bulk/delete | Bulk delete campaigns |
| POST | /admin/v1/campaigns/bulk/status | Bulk status change |
| GET | /admin/v1/settings | Get admin settings |
| PUT | /admin/v1/settings | Update settings ({ settings: [{key, value}] }) |
| GET | /admin/v1/payments/* | Stripe payment admin endpoints |
| GET/POST | /admin/v1/email/* | SendGrid email admin endpoints |

**Tech Stack:**
- Express 4.18
- JSON Web Token (jsonwebtoken)
- bcryptjs for password hashing
- Zod for validation
- TypeScript with tsx for development

---

### Sub-Phase 2.1: Foundation (API Client + Authentication)

**New Files:**
- `src/api/client.ts` - HTTP client with cookie auth, CSRF, and 204 No Content handling (base URL: `http://localhost:3000/api`)
- `src/api/auth.ts` - Login (sends `twoFactorCode`, not `totpCode`) / logout / profile API calls with `BackendAdminProfile` mapper
- `src/context/AuthContext.tsx` - Auth state management (user, token, isAuthenticated)
- `src/components/layout/ProtectedRoute.tsx` - Route guard component
- `src/pages/auth/Login.tsx` - Login page with form validation
- `src/utils/validation.ts` - Zod schemas for forms

**Modifications:**
- `src/App.tsx` - Added AuthProvider, /login route, protected admin routes
- `src/components/layout/AdminHeader.tsx` - Shows real user, logout functionality
- `src/components/layout/Sidebar.tsx` - Wired logout button
- `src/types/index.ts` - Added AdminUser, ApiResponse, ApiError types

---

### Sub-Phase 2.2: Toast Notifications + Confirmation Dialogs

**New Files:**
- `src/context/ToastContext.tsx` - Toast state management
- `src/components/ui/Toast.tsx` - Toast notification component with variants (success, error, warning, info)
- `src/components/ui/Modal.tsx` - Portal-based modal component
- `src/components/ui/ConfirmDialog.tsx` - Confirmation dialog for destructive actions

**Modifications:**
- `src/main.tsx` - Added ToastProvider
- Settings page now uses toast notifications instead of alert()

---

### Sub-Phase 2.3: API Integration

**New Files:**
- `src/api/dashboard.ts` - Dashboard stats API
- `src/api/users.ts` - Users CRUD API with `BackendUserDTO` mapper (numeric to string IDs, UPPERCASE to lowercase statuses); bulk at `/admin/v1/users/bulk`
- `src/api/campaigns.ts` - Campaigns CRUD with `BackendCampaignDTO` mapper; approve/reject use POST (not PATCH); bulk at `/admin/v1/campaigns/bulk/delete` and `/admin/v1/campaigns/bulk/status`
- `src/api/settings.ts` - Settings API; update uses `{ settings: [{key, value}] }` format; `BackendSetting` mapper
- `src/hooks/useFetch.ts` - Generic data fetching hook
- `src/hooks/useUsers.ts` - Users data + mutations
- `src/hooks/useCampaigns.ts` - Campaigns data + mutations
- `src/hooks/usePagination.ts` - Pagination state management
- `src/hooks/useDebounce.ts` - Debounced search
- `src/components/ui/Pagination.tsx` - Pagination controls

**Modifications:**
- `src/pages/dashboard/Dashboard.tsx` - Fetches real stats, loading/error states
- `src/pages/users/Users.tsx` - Full API integration with useUsers hook
- `src/pages/campaigns/Campaigns.tsx` - Full API integration with useCampaigns hook
- `src/pages/settings/Settings.tsx` - Fetch/save settings via API
- `src/types/index.ts` - Added PaginatedResponse, PaginationParams

---

### Sub-Phase 2.4: Detail Views

**New Files:**
- `src/pages/users/UserDetail.tsx` - User detail modal with edit form and activity tabs
- `src/pages/campaigns/CampaignDetail.tsx` - Campaign detail modal with analytics
- `src/components/ui/Tabs.tsx` - Tab navigation component

**Modifications:**
- `src/pages/users/Users.tsx` - Added "View" action to open detail modal
- `src/pages/campaigns/Campaigns.tsx` - Added "View" action to open detail modal

---

### Sub-Phase 2.5: Export + Formatters

**New Files:**
- `src/utils/export.ts` - CSV export functions (exportUsersToCSV, exportCampaignsToCSV)
- `src/utils/formatters.ts` - Date/currency/number formatting utilities

**Modifications:**
- `src/pages/users/Users.tsx` - Wired export button
- `src/pages/campaigns/Campaigns.tsx` - Wired export button

---

### Sub-Phase 2.6: RBAC + Dark Mode

**New Files:**
- `src/utils/permissions.ts` - Permission constants and helper functions
- `src/hooks/usePermissions.ts` - Permission checking hook
- `src/context/ThemeContext.tsx` - Theme state management (light/dark/system)
- `src/components/ui/ThemeToggle.tsx` - Theme switcher component

**Modifications:**
- `src/main.tsx` - Added ThemeProvider
- `src/components/layout/AdminHeader.tsx` - Added ThemeToggle
- `src/components/layout/Sidebar.tsx` - Filter navigation by permissions
- `src/pages/users/Users.tsx` - Hide actions based on permissions
- `src/pages/campaigns/Campaigns.tsx` - Hide actions based on permissions
- `src/pages/settings/Settings.tsx` - Restrict access by permission
- `src/styles/tokens.css` - Added dark theme CSS variables

---

## Project Structure

> **Updated 2026-02-04:** The standalone `Node_API/` backend is no longer used. The admin panel now connects directly to the unified API at `http://localhost:3000/api`.

```
admin/
├── src/                         # Frontend React App
│   ├── api/                    # API client modules with backend DTO mappers
│   │   ├── client.ts          # HTTP client (base: http://localhost:3000/api)
│   │   ├── auth.ts            # Login (twoFactorCode), profile mapper
│   │   ├── campaigns.ts       # BackendCampaignDTO mapper; POST approve/reject
│   │   ├── users.ts           # BackendUserDTO mapper; bulk at /bulk
│   │   ├── dashboard.ts       # Dashboard stats
│   │   ├── settings.ts        # Settings with {settings:[{key,value}]} format
│   │   ├── Stripe_payments.ts # All /admin/v1/payments/ paths
│   │   ├── SendGrid_emails.ts # /admin/v1/email/ paths (no test/config)
│   │   └── pagination.ts      # Paginated response helpers
│   ├── components/
│   │   ├── layout/             # AdminHeader, Sidebar, ProtectedRoute
│   │   └── ui/                 # Reusable UI components (Badge supports 'draft')
│   ├── context/                # Auth (2FA), Toast, Theme providers
│   ├── hooks/                  # Custom hooks
│   ├── pages/                  # Page components
│   ├── styles/                 # CSS tokens and themes
│   ├── types/                  # TypeScript types (Campaign status includes 'draft')
│   └── utils/                  # Utilities (export, formatters, permissions, validation)
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Running the Application

### Unified API (required -- runs from repository root)
```bash
npm install
npm run dev
```
API runs on http://localhost:3000

### Admin Panel Frontend
```bash
cd admin
npm install
npm run dev
```
App runs on http://localhost:5174

### Test Credentials
- **Email:** admin@myngly.com
- **Password:** Admin123!

---

## Key Features

1. **Authentication**
   - JWT-based authentication
   - Protected routes with automatic redirect
   - Role-based access control (RBAC)

2. **User Management**
   - List, search, filter users
   - View/edit user details
   - Bulk actions (activate, suspend, delete)
   - CSV export

3. **Campaign Management**
   - List, search, filter campaigns
   - Approve/reject pending campaigns
   - View campaign analytics
   - CSV export

4. **Dashboard**
   - Real-time statistics
   - User/campaign/revenue metrics
   - Growth indicators

5. **Settings**
   - Platform settings management
   - Save/load from API

6. **UI/UX**
   - Dark mode support (light/dark/system)
   - Toast notifications
   - Confirmation dialogs
   - Loading skeletons
   - Pagination

---

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite 7
- CSS Modules
- Lucide React (icons)
- Zod (validation)

### Backend (Unified API -- shared with advertiser webapp)
- Node.js
- Express
- TypeScript
- Prisma ORM (MySQL)
- JWT (httpOnly cookies)
- bcryptjs
- Zod

---

## Next Steps (Future Phases)

- [x] Database integration (MySQL via Prisma in unified API) ✅
- [x] Email notifications (SendGrid integration) ✅
- [x] API rate limiting (unified API middleware) ✅
- [ ] Real-time notifications (WebSocket)
- [ ] File uploads for user avatars
- [ ] Advanced analytics dashboard
- [ ] Audit log UI
- [ ] Unit and E2E tests
