# Myngly Ads Platform

Advertising platform with a Node.js API, advertiser webapp, and admin panel.

## Repository Structure

```
/
├── src/              # Node.js Express API (TypeScript, Prisma)
├── prisma/           # Database schema, migrations, seed
├── tests/            # API tests (unit + integration)
├── webapp/           # Advertiser React webapp (Vite)
├── admin/            # Admin panel React webapp (Vite)
├── docs/             # All documentation
└── package.json      # API dependencies & scripts
```

## Quick Start

### 1. API Server

```bash
npm install
cp .env.example .env          # Configure database, Stripe, SendGrid keys
npx prisma generate
npx prisma db push
npx prisma db seed             # Load test data
npm run dev                    # Starts on port 3000
```

### 2. Advertiser Webapp

```bash
cd webapp
npm install
npm run dev                    # Starts on port 5173
```

### 3. Admin Panel

```bash
cd admin
npm install
npm run dev                    # Starts on port 5174
```

## Test Credentials

| Webapp | Email | Password | Role |
|--------|-------|----------|------|
| Advertiser Webapp | `john@example.com` | `Password123!` | Advertiser |
| Admin Panel | `admin@myngly.com` | `Admin123!` | Super Admin |

## Tech Stack

- **API**: Node.js, Express, TypeScript, Prisma ORM, MongoDB 7.0+
- **Auth**: Cookie-based sessions with CSRF protection
- **Payments**: Stripe (webhooks, invoices, refunds)
- **Email**: SendGrid (templates, bulk, logs)
- **Frontends**: React 19, TypeScript, Vite 7, CSS Modules
- **Testing**: Vitest (unit/integration), Playwright (E2E)

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) | Full repository structure and component details |
| [docs/STRIPE_INTEGRATION.md](./docs/STRIPE_INTEGRATION.md) | Stripe payment integration guide |
| [docs/SENDGRID_INTEGRATION.md](./docs/SENDGRID_INTEGRATION.md) | SendGrid email integration guide |
| [docs/TEST_DOCUMENTATION.md](./docs/TEST_DOCUMENTATION.md) | Comprehensive test documentation |
| [docs/RUNBOOK.md](./docs/RUNBOOK.md) | Operations runbook |
| [docs/TDD_DOCUMENTATION.md](./docs/TDD_DOCUMENTATION.md) | TDD documentation |
| [docs/CONTRIB.md](./docs/CONTRIB.md) | Contribution guidelines |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API in development mode |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint source code |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with test data |
