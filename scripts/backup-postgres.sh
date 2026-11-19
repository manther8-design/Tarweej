#!/usr/bin/env bash
# Logical backup of Tarweej PostgreSQL (single-region).
# Usage:
#   DATABASE_URL=postgresql://... ./scripts/backup-postgres.sh
#   # or with docker compose service:
#   ./scripts/backup-postgres.sh --compose
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${BACKUP_DIR:-${ROOT}/.data/backups}"
mkdir -p "${OUT_DIR}"
OUT_FILE="${OUT_DIR}/tarweej-postgres-${STAMP}.sql.gz"

if [[ "${1:-}" == "--compose" ]]; then
  echo "Backing up via docker compose service postgres → ${OUT_FILE}"
  docker compose -f "${ROOT}/docker-compose.yml" exec -T postgres \
    pg_dump -U tarweej -d tarweej --no-owner --format=plain \
    | gzip -c > "${OUT_FILE}"
else
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is required (or pass --compose)" >&2
    exit 1
  fi
  echo "Backing up via pg_dump → ${OUT_FILE}"
  pg_dump "${DATABASE_URL}" --no-owner --format=plain | gzip -c > "${OUT_FILE}"
fi

# Optional retention: keep last N files (default 14)
KEEP="${BACKUP_KEEP:-14}"
mapfile -t FILES < <(ls -1t "${OUT_DIR}"/tarweej-postgres-*.sql.gz 2>/dev/null || true)
if ((${#FILES[@]} > KEEP)); then
  for old in "${FILES[@]:KEEP}"; do
    rm -f "${old}"
  done
fi

echo "OK ${OUT_FILE}"
ls -lh "${OUT_FILE}"
