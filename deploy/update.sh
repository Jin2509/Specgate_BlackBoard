#!/usr/bin/env bash
# Pulls this repository, rebuilds and restarts the stack on the server: ./deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=deploy/.env.prod
set -a; . "./$ENV_FILE"; set +a
git pull --ff-only
COMPOSE=(docker compose --env-file "$ENV_FILE" -f compose.yaml -f deploy/compose.prod.yaml)
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps
docker image prune -f >/dev/null
