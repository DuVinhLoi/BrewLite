#!/usr/bin/env bash
set -euo pipefail
cd /opt/brewlite
[[ ${RELEASE_SHA:-} =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release SHA'; exit 1; }
[[ ${REGISTRY_IMAGE:-} =~ ^ghcr.io/[a-z0-9._/-]+$ ]] || { echo 'Invalid registry image'; exit 1; }
compose=(docker compose --env-file .env -f docker-compose.production.yml)
# VPS .env and registry login are provisioned privately by the operator.
"${compose[@]}" pull
"${compose[@]}" up -d --wait db
# Additive migrations only. Failure stops before replacing application containers.
"${compose[@]}" run --rm --no-deps api npm run prisma:migrate
"${compose[@]}" up -d --wait --wait-timeout 180 api web
curl --fail --silent --show-error --connect-timeout 5 --max-time 10 --retry 6 --retry-max-time 120 --retry-connrefused --retry-delay 5 http://127.0.0.1:4000/health
curl --fail --silent --show-error --connect-timeout 5 --max-time 10 --retry 6 --retry-max-time 120 --retry-connrefused --retry-delay 5 http://127.0.0.1:3000/ >/dev/null
printf '%s\n' "$RELEASE_SHA" > current-release.txt