# Contributing Guide

> **Generated from:** `package.json` and `.env.example`
> **Last Updated:** 2026-01-28

## Prerequisites

- Node.js >= 20.0.0
- MongoDB 7.0+ (replica set)
- pnpm/npm/yarn

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd myngly-ads-api
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `development`, `production`, `test` |
| `PORT` | Yes | Server port | `3000` |
| `DATABASE_URL` | Yes | MongoDB connection string | `mongodb://localhost:27017/myngly_ads?replicaSet=rs0&directConnection=true` |
| `JWT_ACCESS_SECRET` | Yes | Access token signing secret (64+ chars) | Generate with crypto |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret (64+ chars) | Generate with crypto |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token TTL | `15m` (default) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL | `7d` (default) |
| `CORS_ORIGINS` | No | Allowed origins (comma-separated) | `http://localhost:5173,http://localhost:5174` |
| `STRIPE_SECRET_KEY` | No | Stripe API secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key | `pk_test_...` |
| `SENDGRID_API_KEY` | No | SendGrid API key | `SG....` |
| `SENDGRID_FROM_EMAIL` | No | Email sender address | `noreply@myngly.com` |
| `SENDGRID_FROM_NAME` | No | Email sender name | `Myngly Ads` |
| `APP_URL` | No | Advertiser webapp URL | `http://localhost:5173` |
| `ADMIN_URL` | No | Admin panel URL | `http://localhost:5174` |
| `COOKIE_DOMAIN` | No | Cookie domain | `localhost` |
| `COOKIE_SECURE` | No | Secure cookie flag | `false` (dev), `true` (prod) |

**Generate JWT secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates collections)
npm run db:push

# Seed database (optional)
npm run db:seed
```

## Development Workflow

### Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000` with hot reload.

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix    # Auto-fix issues

# Formatting
npm run format:check
npm run format      # Auto-format
```

### Testing

```bash
# Run all tests
npm run test

# Watch mode (re-runs on changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

**Test Coverage Target:** 80%+ for lines, branches, functions, statements.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Run production server (requires build first) |
| `npm run lint` | Run ESLint on src/ and tests/ |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | TypeScript type checking without emit |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with initial data |

## Project Structure

```
src/
├── app.ts                    # Express app configuration
├── index.ts                  # Server entry point
├── config/                   # Environment config
├── domains/                  # Business domains (DDD)
│   ├── identity/             # Auth, users, tokens
│   ├── campaign/             # Campaign management
│   ├── payment/              # Stripe integration
│   ├── notification/         # Email services
│   ├── analytics/            # Dashboard stats
│   ├── administration/       # Audit logs, settings
│   ├── platform/             # Ad formats, boost types
│   └── user/                 # User profiles
├── infrastructure/           # Cross-cutting concerns
│   ├── auth/                 # Crypto services
│   ├── database/             # Prisma client
│   ├── errors/               # Custom error classes
│   ├── http/                 # Middleware, handlers
│   ├── logging/              # Winston logger
│   └── middleware/           # CSRF, rate limiting, CORS
├── routes/                   # Route composition
└── shared/                   # Constants, types
tests/
├── e2e/                      # End-to-end tests
├── helpers/                  # Test utilities
└── setup.ts                  # Test configuration
```

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

<optional body>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**Examples:**

```bash
git commit -m "feat: Add password reset endpoint"
git commit -m "fix: Handle null campaign targeting"
git commit -m "refactor: Extract rate limiter middleware"
```

## API Routes

| Prefix | Description | Auth |
|--------|-------------|------|
| `/health` | Health check | None |
| `/api/v1/auth` | User authentication | Rate limited |
| `/api/v1/campaigns` | Campaign CRUD | JWT required |
| `/api/v1/user` | User profile | JWT required |
| `/api/v1/user/payment-methods` | Payment methods | JWT required |
| `/api/v1/stripe` | Stripe operations | JWT required |
| `/admin/v1/auth` | Admin authentication (login sends `twoFactorCode`) | Rate limited |
| `/admin/v1/users` | User management (bulk at `/admin/v1/users/bulk`) | Admin JWT |
| `/admin/v1/campaigns` | Campaign review (approve/reject use POST; bulk at `/admin/v1/campaigns/bulk/*`) | Admin JWT |
| `/admin/v1/payments` | Stripe payment admin (balance, transactions, refunds, disputes, invoices, payouts) | Admin JWT |
| `/admin/v1/email` | SendGrid email admin (bulk send, recent logs, stats) | Admin JWT |
| `/admin/v1/settings` | Platform settings (update uses `{ settings: [{key, value}] }`) | Admin JWT |
| `/admin/v1/audit-logs` | Audit logs | Admin JWT |
| `/admin/v1/dashboard` | Analytics | Admin JWT |
