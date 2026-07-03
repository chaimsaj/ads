# Deploying admin & webapp to Azure Web Apps

Both front-ends are static Vite SPAs deployed to their **own** Azure Web App (Linux, **Node 24**) via
GitHub Actions on push to `master`:

| App | Directory | Azure Web App | Workflow | Publish-profile secret |
|-----|-----------|---------------|----------|------------------------|
| Advertiser | `webapp/` | `myngly-ads-webapp` | [deploy-webapp-azure.yml](../.github/workflows/deploy-webapp-azure.yml) | `AZURE_WEBAPP_PUBLISH_PROFILE` |
| Admin | `admin/` | `myngly-ads-admin` | [deploy-admin-azure.yml](../.github/workflows/deploy-admin-azure.yml) | `AZURE_ADMIN_PUBLISH_PROFILE` |

They deploy independently (each workflow triggers only on its own folder's changes), per the app-independence rule.

## How it works

A Node App Service must run a process that listens on `$PORT` — it does not serve static files by itself
like IIS. So each workflow:
1. `npm ci` + `npm run build` (Node 24) → `dist/`.
2. Assembles a deploy package = `dist/` + a **zero-dependency** `server.mjs` (Node `http` static server
   with **SPA fallback** to `index.html`, correct MIME types, immutable caching for hashed assets,
   `no-cache` for `index.html`, and a path-traversal guard) + a minimal `package.json` (`start: node server.mjs`).
3. Deploys with `azure/webapps-deploy@v3` (publish profile), startup command `node server.mjs`.

The SPA fallback is essential: without it, refreshing a client-side route (e.g. `/campaigns/123`) 404s.

## One-time setup (per app)

1. **Publish profile secret** — Azure Portal → the App Service → **Get publish profile**; add it to GitHub
   (Settings → Secrets and variables → Actions) under the secret name in the table above. Enable SCM Basic
   Auth publishing on the App Service if disabled.
2. **Stack** — Node 24 LTS (Linux).
3. **`VITE_API_URL`** — baked into the bundle at build time from each app's committed `.env.production`;
   it must point at the Ads API host (`myngly-ads-api…azurewebsites.net`). These are public values, not
   secrets. To change the API URL, edit `.env.production` and redeploy.

## Notes

- Triggers on `master`; day-to-day work is on `develop`, so the workflows must be **merged to `master`**
  for the push trigger to fire (`workflow_dispatch` also needs them on the default branch).
- No runtime environment variables/secrets are needed on the App Services for the SPAs — everything is
  static. Only the API service needs server-side app settings.
