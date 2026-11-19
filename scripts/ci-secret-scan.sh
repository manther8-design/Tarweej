#!/usr/bin/env bash
# Lightweight CI gate: fail if tracked files contain known demo/prod-unsafe secrets.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

# Patterns that must never appear outside .env.example / docs that explicitly show placeholders.
# We scan tracked text files and exclude example templates + delivery docs that document the seed.
PATTERN='(AWS_SECRET_ACCESS_KEY\s*=\s*AKIA|BEGIN RSA PRIVATE KEY|sk_live_[0-9a-zA-Z]{16,}|ghp_[0-9a-zA-Z]{20,})'

HITS="$(git grep -nE "${PATTERN}" -- . \
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
