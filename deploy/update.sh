#!/usr/bin/env bash
# Kéo code mới của repo này và spec-gate, build lại rồi khởi động lại. Chạy trên server: ./deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=deploy/.env.prod
set -a; . "./$ENV_FILE"; set +a
for dir in . "${SPEC_GATE_DIR:-../spec-gate}"; do
  echo "== git pull trong $dir"
  git -C "$dir" pull --ff-only
done
COMPOSE=(docker compose --env-file "$ENV_FILE" -f compose.yaml -f deploy/compose.prod.yaml)
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps
docker image prune -f >/dev/null
