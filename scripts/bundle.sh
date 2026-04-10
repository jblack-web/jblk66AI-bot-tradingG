#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# bundle.sh – Create a single deployable archive of jblk66AI
#
# Usage:
#   bash scripts/bundle.sh            # produces jblk66ai-deploy.tar.gz
#   bash scripts/bundle.sh v1.2.3     # produces jblk66ai-v1.2.3-deploy.tar.gz
#
# The archive is self-contained: copy it to any Linux server, extract, fill in
# your .env, and follow DEPLOY.md to go live.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-deploy}"
ARCHIVE="jblk66ai-${VERSION}.tar.gz"

cd "$REPO_ROOT"

echo "▶  Building frontend (if not already built)..."
if [ -d "backend/public" ] && [ "$(ls -A backend/public 2>/dev/null)" ]; then
  echo "   backend/public already exists – skipping React build."
elif command -v npm &>/dev/null && [ -f "frontend/package.json" ]; then
  if (cd frontend && npm install --silent && npm run build --silent); then
    mkdir -p backend/public
    cp -r frontend/build/. backend/public/
    echo "   Frontend built → backend/public/"
  else
    echo "   ⚠  Frontend build failed – continuing without pre-built assets."
    echo "      The server will build/serve frontend at runtime via docker-compose."
  fi
else
  echo "   ⚠  frontend/package.json not found or npm unavailable – skipping build."
fi

echo "▶  Creating archive: $ARCHIVE"
TMPFILE="$(mktemp /tmp/jblk66ai-XXXXXX.tar.gz)"
tar \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*/node_modules' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='npm-debug.log*' \
  --exclude='.DS_Store' \
  --exclude='dist/' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/build' \
  --exclude='backend/node_modules' \
  -czf "$TMPFILE" \
  .
mv "$TMPFILE" "$ARCHIVE"

echo ""
echo "✅  Archive ready: ${REPO_ROOT}/${ARCHIVE}"
echo ""
echo "Next steps:"
echo "  1. Copy the archive to your server:"
echo "       scp ${ARCHIVE} user@your-server:/opt/jblk66ai/"
echo "  2. On the server, extract and deploy:"
echo "       tar -xzf ${ARCHIVE} -C /opt/jblk66ai && cd /opt/jblk66ai"
echo "       cp envs/.env.prod .env   # edit .env with your real values"
echo "       docker compose up -d --build"
echo "  3. Seed admin (first time only):"
echo "       docker compose exec backend node scripts/setup-admin.js"
echo ""
echo "See DEPLOY.md for full instructions."
