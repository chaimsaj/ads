# Deploying admin & webapp to Azure

Both SPAs deploy **directly via publish profile** (no GitHub Actions):

```bash
scripts/deploy-spa.sh webapp    # → myngly-ads-webapp   (uses ~/Downloads/myngly-ads-webapp.PublishSettings)
scripts/deploy-spa.sh admin     # → myngly-ads-admin    (uses ~/Downloads/myngly-ads-admin.PublishSettings)
```

The script builds the app, packages `dist/` + a zero-dependency `server.mjs` (SPA fallback) + a minimal
`package.json`, and zip-deploys to the App Service Kudu endpoint using the profile's ZipDeploy credentials.
The profile is read at runtime and never committed. Requires SCM Basic Auth on the App Service.

| App | Azure Web App (Central US) | `VITE_API_URL` (baked at build) |
|-----|----------------------------|--------------------------------|
| webapp | `myngly-ads-webapp` | `…cndwgddyfjf2eqcr.centralus-01…/api` |
| admin  | `myngly-ads-admin`  | `…cndwgddyfjf2eqcr.centralus-01…` |

## ⚠️ One-time App Service setup (per SPA)

A Linux **Node 24** App Service must be told how to run the static host, or client-side deep links 404 on
refresh. In the Portal → each App Service → **Configuration → General settings → Startup Command**:

```
node server.mjs
```

Save (it restarts). After that, `/` and every client route (e.g. `/dashboard`, `/campaigns/123`) serve the
SPA. Without it, Azure serves the folder statically and deep routes 404.

GitHub Actions is not used (Azure's generated OIDC workflows built at the repo root — no root package.json —
and were removed). Disable Actions in repo Settings to turn it fully off.
