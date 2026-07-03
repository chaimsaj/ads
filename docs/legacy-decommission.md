# Legacy API decommission — `myngly-ads-api` ("Unified API")

**Date:** 2026-07-03 · **Action:** the `legacy/` directory was removed from the repository.
This document is the permanent record of what it was, why it was safe to remove, and the
out-of-band actions that must still be completed. The full source remains recoverable from git
history (it was 300 tracked files; `git revert`/`git checkout <sha>^ -- legacy` restores it).

---

## 1. What it was

A single Node.js/Express + TypeScript + Prisma (over MongoDB Atlas) monolith — the "Unified API"
that both front-ends (`webapp`, `admin`) and the Myngly mobile app historically talked to. Cookie/CSRF
auth (httpOnly JWT cookies + double-submit CSRF), separate `User`/`AdminUser` identity tables, admin
TOTP 2FA, Stripe payments, SendGrid email. Deploy history: Google App Engine Flex → Azure (ACR +
App Service containers). Port 3000 local / 80 in container.

## 2. Why it was safe to remove (repository evidence)

- **Front-ends fully decoupled.** `grep -rn "legacy"` across `webapp/src` and `admin/src` → zero
  matches. No imports, shared modules, or relative-path escapes into `legacy/`.
- **Front-ends moved to the microservices contract, not legacy.** Both api clients use
  `Authorization: Bearer <JWT>` (localStorage tokens) and call `/api/v1/ads-advertiser` /
  `/api/v1/ads-admin` (`webapp|admin/src/api/client.ts:3,69`). Legacy is cookie/CSRF and mounts
  `/api/v1`, `/admin/v1`, `/api/v1/mobile`, `/api/v1/tracking` — it has **no** `ads-advertiser` /
  `ads-admin` routes. Against legacy those calls would 404; the front-ends unambiguously talk to the
  `myngly-microservices` Ads gateway.
- **No active CI depends on it.** The only workflow in the repo is `legacy/.github/workflows/
  deploy-to-azure.yml`; GitHub only runs workflows under the **root** `.github/workflows/` (there is
  none), so that file is dormant/orphaned. No root config, vite config, or app `package.json`
  references `legacy`.
- **Feature parity** is covered by the `myngly-microservices` Ads service:

  | Legacy domain / feature | Microservices home (`myngly-microservices/src/Services/Myngly.Ads/Features/`) |
  |---|---|
  | identity (advertiser + admin auth, refresh, reset) | Identity (AdvertiserAuth / AdminAuth) |
  | campaigns (CRUD, lifecycle, duplicate, bulk, CSV) | Campaigns |
  | ad platform config (formats / boost types) | Reference, AdsConfig |
  | events (promotable mobile-app events) | Reference (EventSearch) |
  | mobile ad serving + Haversine geo-radius | Serving (AdMobile, geo/platform/demographic filters) |
  | tracking (impression/click/conversion + 1×1 pixel) | Tracking + Serving (signed pixel, postback) |
  | payments (Stripe customers/intents/checkout/refunds/webhook) | Payments (StripePaymentService, StripeWebhookModule) |
  | email (SendGrid, bulk, stats) | Emails (IEmailSender, templates, email_logs) |
  | users (list/suspend/activate/bulk/delete) + profile | AdminUsers, Profile |
  | audit log | Audit |
  | system settings | Settings |
  | dashboard analytics | Dashboard, Performance, Activity |

  The microservices version is a **superset** in several places (the legacy `resetPassword` threw
  "Not implemented", its email verification code was hard-coded `123456`, and avatar upload had no
  multer middleware mounted — all properly implemented in the microservices).

## 3. Out-of-band actions still required (cannot be verified from the repo)

1. **🔴 Rotate/revoke committed secrets.** `legacy/Dockerfile`, `legacy/notes.txt`, and
   `legacy/.env.test` hard-coded live-looking credentials: a MongoDB Atlas connection string with
   password, both JWT secrets, Stripe test keys, and a SendGrid API key. Deleting the folder removes
   them from HEAD but **not from git history** — rotate them regardless of this deletion.
2. **Confirm the production Azure host.** `webapp|admin/.env.production` →
   `myngly-ads-api-…eastus-01.azurewebsites.net`. The front-end contract is the microservices one, so
   that host must already serve the microservices gateway (or production would be 404-broken). Verify
   by hitting `{host}/api/v1/ads-admin/...` or checking the Azure resource, then retire the legacy
   Azure App Service / container image if still deployed.
3. **Confirm data migration.** The legacy MongoDB `myngly_ads` DB is separate from the microservices
   databases (`myngly-ads`, `myngly-users`, …). Deleting the source does **not** touch that data.
   Confirm no un-migrated production data remains before decommissioning the legacy DB/cluster.

## 4. Parity items worth a second look (not blockers)

- **Admin TOTP 2FA** (legacy `two-factor.service.ts`, otplib/qrcode) — re-implement in the Ads
  AdminAuth if two-factor admin login is a requirement (verify whether the admin UI still expects it).
- **System settings as business rules** (`commission_rate`, `auto_approve_campaigns`,
  `min/max_campaign_budget`, `maintenance_mode`, `max_campaigns_per_user`) — confirm the equivalents
  exist/behave the same in the Ads Settings feature.
- **Externally-embedded tracking-pixel URLs** — if any third party embedded the legacy
  `/api/v1/tracking/pixel/:id` URL, point it at the new signed pixel endpoint or add a redirect.

## 5. Reference

The legacy source (full route surface, 15 Prisma models, services, and Vitest/Playwright E2E tests
that document the historical behavior) is preserved in git history under the pre-deletion commit if a
detailed behavioral spec is ever needed during parity verification.
