#!/usr/bin/env bash
# Lightweight CI gate: fail if tracked files contain known demo/prod-unsafe secrets.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

# Patterns are assembled so this script does not match itself under git grep.
P1='AWS_SECRET_ACCESS_KEY[[:space:]]*=[[:space:]]*AKIA'
P2='BEGIN RSA PRIVATE KEY'
P3='sk_live_[0-9a-zA-Z]{16,}'
P4='ghp_[0-9a-zA-Z]{20,}'
PATTERN="${P1}|${P2}|${P3}|${P4}"

HITS="$(git grep -nE "${PATTERN}" -- . \
  ':(exclude)scripts/ci-secret-scan.sh' \
  ':(exclude).env.example' \
  ':(exclude)infrastructure/deployment/env.production.example' \
  ':(exclude)**/*.md' \
  ':(exclude)pnpm-lock.yaml' || true)"

if [[ -n "${HITS}" ]]; then
  echo "Secret scan failed — possible committed credentials:" >&2
  echo "${HITS}" >&2
  exit 1
fi

# Ensure production compose does not hardcode local demo passwords.
if git grep -n 'tarweej_dev_password\|Admin123!\|dev-access-secret-change-me' -- \
  infrastructure/deployment/docker-compose.prod.yml Dockerfile.api 2>/dev/null; then
  echo "Secret scan failed — demo credentials in production paths" >&2
  exit 1
fi

echo "Secret scan OK"
