#!/usr/bin/env bash
# Single-region deploy helper for Tarweej API + dependencies.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT}/infrastructure/deployment/docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-${ROOT}/.env.production}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  echo "Copy infrastructure/deployment/env.production.example and fill secrets." >&2
  exit 1
fi

# Refuse obvious demo placeholders before touching the cluster.
if grep -E 'dev-access-secret-change-me|dev-refresh-secret-change-me|tarweej_dev_password|Admin123!' "${ENV_FILE}" >/dev/null 2>&1; then
  echo "Refusing deploy: ${ENV_FILE} still contains development/demo placeholders." >&2
  exit 1
fi

cd "${ROOT}"
echo "==> Building API image"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" build api

echo "==> Starting data plane"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d postgres redis

echo "==> Waiting for postgres healthy"
for i in $(seq 1 60); do
  if docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T postgres \
    pg_isready -U "${POSTGRES_USER:-tarweej}" -d "${POSTGRES_DB:-tarweej}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [[ "${i}" -eq 60 ]]; then
    echo "Timed out waiting for postgres" >&2
    exit 1
  fi
done

echo "==> Applying migrations (seed is intentionally not run)"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm --entrypoint \
  ./node_modules/.bin/prisma api migrate deploy --schema=./prisma/schema.prisma

echo "==> Starting API"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d api

echo "==> Ready probe"
API_PORT="${API_PUBLISH_PORT:-3000}"
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${API_PORT}/api/v1/health/ready" >/dev/null 2>&1; then
    echo "Deploy OK — /api/v1/health/ready is green"
    exit 0
  fi
  sleep 3
done

echo "API did not become ready in time" >&2
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs --tail=80 api >&2 || true
exit 1
