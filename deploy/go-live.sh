#!/usr/bin/env bash
# One-shot deploy for admin-dev.pollus.tech.
# Run with sudo:  sudo bash deploy/go-live.sh
set -euo pipefail

APP_DIR="/var/www/pollus_main_servers/admin-dev.pollus.tech"
DOMAIN="admin-dev.pollus.tech"
CONF_SRC="$APP_DIR/deploy/$DOMAIN.nginx"
CONF_DST="/etc/nginx/sites-available/$DOMAIN"
ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
EMAIL="javier@valyd.id"

echo "==> Building the SPA (if not already built)…"
if [ ! -f "$APP_DIR/dist/index.html" ]; then
  ( cd "$APP_DIR" && npm run build )
fi

echo "==> Installing nginx site…"
cp "$CONF_SRC" "$CONF_DST"
ln -sfn "$CONF_DST" "$ENABLED"

echo "==> Testing nginx config…"
nginx -t
systemctl reload nginx

echo "==> Obtaining/installing TLS certificate via certbot…"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "==> Reloading nginx…"
nginx -t && systemctl reload nginx

echo ""
echo "✅ Done. https://$DOMAIN should now be live."
echo "   (Admin API is served by the existing dev-pollus backend on :8001.)"
