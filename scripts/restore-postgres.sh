#!/usr/bin/env bash
# Restore Tarweej PostgreSQL from a gzipped plain SQL dump.
# DANGEROUS: overwrites target database contents.
#
# Usage:
#   DATABASE_URL=postgresql://... ./scripts/restore-postgres.sh path/to/dump.sql.gz
#   ./scripts/restore-postgres.sh --compose path/to/dump.sql.gz
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=0
if [[ "${1:-}" == "--compose" ]]; then
  COMPOSE=1
  shift
fi

DUMP="${1:-}"
if [[ -z "${DUMP}" || ! -f "${DUMP}" ]]; then
  echo "Usage: $0 [--compose] <dump.sql.gz>" >&2
  exit 1
fi

CONFIRM="${RESTORE_CONFIRM:-}"
if [[ "${CONFIRM}" != "YES" ]]; then
  echo "Refusing restore without RESTORE_CONFIRM=YES" >&2
  exit 1
fi

echo "Restoring ${DUMP} …"
if [[ "${COMPOSE}" -eq 1 ]]; then
  gunzip -c "${DUMP}" | docker compose -f "${ROOT}/docker-compose.yml" exec -T postgres \
    psql -U tarweej -d tarweej -v ON_ERROR_STOP=1
else
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is required when not using --compose" >&2
    exit 1
  fi
  gunzip -c "${DUMP}" | psql "${DATABASE_URL}" -v ON_ERROR_STOP=1
fi

echo "Restore complete. Re-run migrations if needed: pnpm db:deploy"
echo "Verify: curl -fsS \$API/api/v1/health/ready"
