# Operations Runbook

> **Generated from:** `package.json` and `.env.example`
> **Last Updated:** 2026-02-04

## Deployment Procedures

### Prerequisites

- Node.js >= 20.0.0
- MongoDB 7.0+ (replica set)
- Environment variables configured
- SSL certificate (production)

### Production Deployment

#### 1. Build Application

```bash
# Install dependencies
npm ci --production=false

# Generate Prisma client
npm run db:generate

# Compile TypeScript
npm run build

# Run type check (CI gate)
npm run typecheck
```

#### 2. Push Schema

```bash
# Apply schema changes to database
npx prisma db push
```

#### 3. Start Server

```bash
# Set production environment
export NODE_ENV=production

# Start application
npm run start
```

#### 4. Health Check

```bash
curl http://localhost:3000/health
# Expected: {"success":true,"data":{"status":"ok",...}}
```

### Environment Variables (Production)

| Variable | Production Value |
|----------|------------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (or load balancer port) |
| `DATABASE_URL` | Production MongoDB connection string |
| `JWT_ACCESS_SECRET` | Unique 64+ char secret |
| `JWT_REFRESH_SECRET` | Unique 64+ char secret |
| `CORS_ORIGINS` | Production webapp domains |
| `COOKIE_SECURE` | `true` |
| `COOKIE_DOMAIN` | Production domain |

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run db:generate && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## Monitoring and Alerts

### Health Endpoint

**URL:** `GET /health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-28T12:00:00.000Z",
    "version": "1.0.0"
  }
}
```

**Alert if:**
- Status code != 200
- `data.status` != "ok"
- Response time > 5s

### Key Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|----------|
| Response time (p95) | > 500ms | > 2000ms |
| Error rate (5xx) | > 1% | > 5% |
| Memory usage | > 70% | > 90% |
| CPU usage | > 70% | > 90% |
| Database connections | > 80% pool | > 95% pool |

### Log Locations

- **Application logs:** Winston output (stdout/stderr)
- **Request logs:** Structured JSON with request ID
- **Error logs:** Stack traces with context

### Log Format

```json
{
  "level": "info",
  "message": "Request completed",
  "requestId": "uuid",
  "method": "POST",
  "path": "/api/v1/auth/login",
  "statusCode": 200,
  "duration": 45
}
```

---

## Common Issues and Fixes

### 1. Database Connection Failed

**Symptoms:**
- Server fails to start
- "Can't reach database server" error

**Resolution:**
```bash
# Check database is running
mongosh --eval "db.runCommand({ ping: 1 })"

# Verify DATABASE_URL format
# mongodb://user:password@host:27017/database?replicaSet=rs0&directConnection=true

# Test connection
npx prisma db pull
```

### 2. JWT Token Invalid

**Symptoms:**
- 401 Unauthorized on authenticated routes
- "Invalid or expired access token" error

**Resolution:**
```bash
# Verify JWT secrets match between instances
echo $JWT_ACCESS_SECRET | wc -c  # Should be 64+

# Check token expiry
# Access tokens: 15m default
# Refresh tokens: 7d default

# Clear browser cookies and re-login
```

### 3. CSRF Token Invalid

**Symptoms:**
- 403 Forbidden on POST/PUT/DELETE
- "Invalid CSRF token" error

**Resolution:**
```bash
# Ensure client sends:
# 1. Cookie: csrf_token=<value>
# 2. Header: X-Csrf-Token: <same-value>

# Get CSRF token via GET request first
curl -c cookies.txt http://localhost:3000/health
```

### 4. Rate Limit Exceeded

**Symptoms:**
- 429 Too Many Requests
- "Too many requests" error

**Resolution:**
```bash
# Rate limits:
# - General: 100 req/15min
# - Auth: 10 req/15min
# - Admin auth: 5 req/15min
# - Forgot password: 3 req/60min
# - Email: 10 req/1min

# Wait for window to reset or check for abuse
```

### 5. Stripe Webhook Failing

**Symptoms:**
- Webhook events not processed
- "No Stripe configuration" error

**Resolution:**
```bash
# Verify Stripe environment variables
echo $STRIPE_SECRET_KEY
echo $STRIPE_WEBHOOK_SECRET

# Test webhook signature
stripe listen --forward-to localhost:3000/api/v1/stripe/webhooks
```

### 6. Memory Leak / High Memory Usage

**Symptoms:**
- Memory grows over time
- OOM kills

**Resolution:**
```bash
# Check for unclosed connections
# Review Prisma connection pool settings

# Restart with memory limit
NODE_OPTIONS="--max-old-space-size=512" npm run start
```

---

## Rollback Procedures

### Application Rollback

```bash
# 1. Stop current deployment
pm2 stop myngly-ads-api  # or kill process

# 2. Checkout previous version
git checkout <previous-tag>

# 3. Reinstall dependencies
npm ci

# 4. Rebuild
npm run db:generate
npm run build

# 5. Restart
npm run start
```

### Database Rollback

**WARNING:** Data loss may occur. Backup first.

```bash
# Reset database (dev only — drops all collections and re-pushes schema)
npx prisma db push --force-reset

# Production: Restore from backup
mongorestore --uri "mongodb://localhost:27017/myngly_ads?replicaSet=rs0" --drop ./backup/
```

### Configuration Rollback

```bash
# Revert environment variables
# Use secrets manager version history or backup .env

# Restart application to pick up changes
pm2 restart myngly-ads-api
```

---

## Security Checklist

- [ ] `NODE_ENV=production` set
- [ ] `COOKIE_SECURE=true` for HTTPS
- [ ] JWT secrets are unique and 64+ chars
- [ ] Database credentials rotated
- [ ] Stripe keys are production keys
- [ ] CORS_ORIGINS limited to production domains
- [ ] Rate limiting enabled
- [ ] CSRF protection active
- [ ] Helmet security headers enabled

---

## Frontend Configuration

### Advertiser Webapp (`webapp/`)

**Environment:**
```env
VITE_API_URL=http://localhost:3000/api
```

**Production:**
```env
VITE_API_URL=https://api.myngly.com/api
```

**Key Files:**
- `src/api/client.ts` — API client with cookie auth and CSRF
- `src/api/campaigns.ts` — Campaign CRUD with backend DTO mappers (statuses: active, paused, scheduled, completed, review, draft, rejected)
- `src/api/Stripe_payments.ts` — Stripe payment API with BackendPaymentMethodDTO mapper
- `src/context/AuthContext.tsx` — Auth state; provides `logout()` used by Header and Settings
- `src/components/layout/Header.tsx` — Dashboard header with notification dropdown and sign-out via AuthContext
- `src/pages/settings/Settings.tsx` — Settings page with sign-out via AuthContext
- `src/pages/settings/BillingMethodsModal.tsx` — Billing methods modal (add-card shows Stripe Elements stub)

### Admin Panel (`admin/`)

**Environment:**
```env
VITE_API_URL=http://localhost:3000/api
```

> **Note (2026-02-04):** The admin panel API client defaults to `http://localhost:3000/api` (not `/admin/v1`). All admin endpoints are reached via the `/admin/v1/` path prefix appended by each API module (e.g., `apiClient.get('/admin/v1/campaigns')`).

**Production:**
```env
VITE_API_URL=https://api.myngly.com/api
```

**Key Files:**
- `src/api/client.ts` — API client with cookie auth, CSRF tokens, and 204 No Content handling. Base URL defaults to `http://localhost:3000/api`.
- `src/api/auth.ts` — Login sends `twoFactorCode` field (not `totpCode`); `BackendAdminProfile` mapper converts numeric IDs to strings
- `src/api/campaigns.ts` — `BackendCampaignDTO` + `mapCampaign` mapper (UPPERCASE to lowercase statuses); approve/reject use POST; bulk endpoints at `/admin/v1/campaigns/bulk/delete` and `/admin/v1/campaigns/bulk/status`
- `src/api/users.ts` — `BackendUserDTO` + `mapUser` mapper; bulk endpoint at `/admin/v1/users/bulk` (not `/bulk-action`)
- `src/api/Stripe_payments.ts` — All paths under `/admin/v1/payments/` (not `/stripe/admin/`)
- `src/api/SendGrid_emails.ts` — Paths under `/admin/v1/email/` (not `/email/`); test email and config status endpoints removed
- `src/api/settings.ts` — Update payload uses `{ settings: [{key, value}] }` format
- `src/context/AuthContext.tsx` — Auth state with 2FA support
- `src/pages/auth/Login.tsx` — Login with 2FA UI

### Cookie-Based Authentication

Both frontends now use httpOnly cookies for authentication:

1. **Login:** Server sets `access_token` and `refresh_token` cookies
2. **Requests:** Browser automatically sends cookies with `credentials: 'include'`
3. **CSRF:** Client reads `csrf_token` cookie and sends as `X-CSRF-Token` header
4. **Logout:** Server clears cookies

### CSRF Token Flow

```
1. GET /health → Server sets csrf_token cookie
2. Client reads csrf_token from document.cookie
3. POST/PUT/PATCH/DELETE → Client sends X-CSRF-Token header
4. Server validates token matches cookie
```

### 2FA Flow (Admin Only)

```
1. POST /admin/v1/auth/login { email, password }
   -> { requiresTwoFactor: true, pendingEmail: "..." }

2. UI shows 2FA code input

3. POST /admin/v1/auth/login { email, password, twoFactorCode }
   -> { user: {...} } + cookies set
```

> **Note (2026-02-04):** The login field is `twoFactorCode` (not `totpCode`). The admin `auth.ts` API client maps the UI's `totpCode` parameter to `twoFactorCode` in the request body.

### Breaking Changes from Migration

- All existing sessions invalidated (tokens were in localStorage)
- Users must log in again after deployment
- Frontend requires unified API (no longer works with old APIs)

---

## Contacts

| Role | Contact |
|------|---------|
| On-call Engineer | TBD |
| Database Admin | TBD |
| Security Team | TBD |
