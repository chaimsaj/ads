#!/usr/bin/env bash
# Direct publish-profile deploy of a SPA to its Azure Web App (no GitHub Actions).
#
# Usage:  scripts/deploy-spa.sh <admin|webapp> [path-to-.PublishSettings]
# Default profile path: ~/Downloads/myngly-ads-<app>.PublishSettings
#
# It builds the app, packages dist/ + a zero-dependency static server (SPA fallback),
# and zip-deploys to the App Service's Kudu endpoint using the profile's ZipDeploy
# credentials. The publish profile is read at runtime and never committed.
set -euo pipefail
cd "$(dirname "$0")/.."

APP_DIR="${1:?usage: deploy-spa.sh <admin|webapp> [profile]}"
case "$APP_DIR" in admin|webapp) ;; *) echo "app must be 'admin' or 'webapp'"; exit 1;; esac
APP="myngly-ads-$APP_DIR"
PROFILE="${2:-$HOME/Downloads/$APP.PublishSettings}"
[ -f "$PROFILE" ] || { echo "Publish profile not found: $PROFILE"; exit 1; }

# Parse the ZipDeploy entry (no password is printed).
attr() { grep -o " $1=\"[^\"]*\"" | head -1 | sed 's/.*="//; s/"$//'; }
BLOCK="$(tr '<' '\n' < "$PROFILE" | grep 'publishMethod="ZipDeploy"')"
SCMHOST="$(printf '%s' "$BLOCK" | attr publishUrl)"; SCMHOST="${SCMHOST%%:*}"
USER="$(printf '%s' "$BLOCK" | attr userName)"
PASS="$(printf '%s' "$BLOCK" | attr userPWD)"
APPURL="https://${SCMHOST/.scm./.}"

echo "→ Building $APP_DIR ..."
( cd "$APP_DIR" && npm ci && npm run build )

echo "→ Packaging (dist + static SPA host) ..."
rm -rf out && mkdir -p out/dist
cp -r "$APP_DIR/dist/." out/dist/
cat > out/package.json <<'JSON'
{ "name": "myngly-spa-host", "private": true, "type": "module", "scripts": { "start": "node server.mjs" } }
JSON
cat > out/server.mjs <<'EOF'
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const ROOT = join(process.cwd(), 'dist');
const PORT = process.env.PORT || 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.map': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = normalize(join(ROOT, pathname));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
    let ext = extname(filePath); let isFile = false;
    try { isFile = (await stat(filePath)).isFile(); } catch { /* SPA fallback */ }
    if (!isFile) { filePath = join(ROOT, 'index.html'); ext = '.html'; }
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(body);
  } catch { if (!res.headersSent) res.writeHead(500); res.end('Internal Server Error'); }
}).listen(PORT, () => console.log(`SPA host listening on ${PORT}`));
EOF
( cd out && zip -r -q app.zip . )

echo "→ Deploying to $APP (zip deploy) ..."
code=$(curl -sS -X POST -u "$USER:$PASS" --data-binary @out/app.zip \
  "https://$SCMHOST/api/zipdeploy" -H "Content-Type: application/zip" \
  -w "%{http_code}" -o /tmp/deploy-$APP.log --max-time 300 || true)
echo "   Kudu responded: HTTP $code"
[ "$code" = "200" ] || { echo "   Deploy failed — see /tmp/deploy-$APP.log"; cat "/tmp/deploy-$APP.log"; exit 1; }
echo "→ Done: $APPURL"
