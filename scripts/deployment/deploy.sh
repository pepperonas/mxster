#!/bin/bash
# Deploy mxster to mxster.celox.io
#
#   ./scripts/deployment/deploy.sh          # API, then web app
#   ./scripts/deployment/deploy.sh api      # only the FastAPI backend
#   ./scripts/deployment/deploy.sh web      # only the PWA
#
# The API's secrets live only in /opt/mxster-api/.env on the VPS (see
# server/.env.example); this script never writes them. nginx changes are a
# one-time manual step (server/deploy/nginx-locations.conf).

set -euo pipefail

APP_NAME="mxster"
VPS_HOST="root@69.62.121.168"
VPS_ROOT="/var/www/html/$APP_NAME"
API_ROOT="/opt/mxster-api"
TARGET="${1:-all}"

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PWA_DIR="$PROJECT_ROOT/pwa"
SERVER_DIR="$PROJECT_ROOT/server"

deploy_api() {
  echo "🧪 Backend-Tests …"
  (cd "$SERVER_DIR" && .venv/bin/python -m pytest -q)

  echo "📤 Backend hochladen …"
  rsync -a --delete \
    --exclude='.venv/' --exclude='data/' --exclude='.env' --exclude='__pycache__/' \
    --exclude='.pytest_cache/' --exclude='tests/' \
    "$SERVER_DIR/" "$VPS_HOST:$API_ROOT/"

  ssh "$VPS_HOST" "set -e
    id mxster >/dev/null 2>&1 || useradd --system --home-dir $API_ROOT --shell /usr/sbin/nologin mxster
    mkdir -p $API_ROOT/data
    chown -R root:mxster $API_ROOT && chmod -R g-w,o-rwx $API_ROOT
    chown mxster:mxster $API_ROOT/data && chmod 750 $API_ROOT/data
    test -f $API_ROOT/.env || { echo '❌ $API_ROOT/.env fehlt (siehe server/.env.example)'; exit 1; }
    chown root:mxster $API_ROOT/.env && chmod 640 $API_ROOT/.env
    test -x $API_ROOT/.venv/bin/python || python3 -m venv $API_ROOT/.venv
    $API_ROOT/.venv/bin/pip install -q --upgrade pip
    $API_ROOT/.venv/bin/pip install -q -r $API_ROOT/requirements.txt
    chown -R root:mxster $API_ROOT/.venv && chmod -R o-rwx $API_ROOT/.venv
    install -m 644 $API_ROOT/deploy/mxster-api.service /etc/systemd/system/mxster-api.service
    systemctl daemon-reload
    systemctl enable --quiet mxster-api
    systemctl restart mxster-api
    for i in 1 2 3 4 5 6 7 8 9 10; do curl -sf http://127.0.0.1:4274/api/health >/dev/null && break; sleep 1; done
    curl -sf http://127.0.0.1:4274/api/health && echo
  "
  echo "✅ API läuft"
}

deploy_web() {
  echo "🧪 PWA-Tests …"
  (cd "$PWA_DIR" && npx tsc --noEmit && npx vitest run --reporter=dot)

  echo "📦 Production-Build …"
  (cd "$PWA_DIR" && npm run build)

  echo "📤 Web-App hochladen (audio/ bleibt unangetastet) …"
  ssh "$VPS_HOST" "mkdir -p /tmp/$APP_NAME-deploy"
  rsync -a --delete --exclude='audio/' "$PWA_DIR/dist/" "$VPS_HOST:/tmp/$APP_NAME-deploy/"
  ssh "$VPS_HOST" "set -e
    mkdir -p $VPS_ROOT
    # Swap everything except the MP3s
    find $VPS_ROOT -mindepth 1 -maxdepth 1 ! -name audio -exec rm -rf {} +
    cp -r /tmp/$APP_NAME-deploy/. $VPS_ROOT/
    chown -R www-data:www-data $VPS_ROOT
    find $VPS_ROOT -path $VPS_ROOT/audio -prune -o -type d -exec chmod 755 {} + -o -type f -exec chmod 644 {} +
    rm -rf /tmp/$APP_NAME-deploy
  "
  echo "✅ Web-App live"
}

case "$TARGET" in
  api) deploy_api ;;
  web) deploy_web ;;
  all) deploy_api; deploy_web ;;
  *) echo "Usage: $0 [all|api|web]"; exit 1 ;;
esac

echo "🌐 https://mxster.celox.io"
