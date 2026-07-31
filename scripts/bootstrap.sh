#!/usr/bin/env sh
set -eu
[ -f .env ] || cp .env.example .env
corepack enable
pnpm install
pnpm infra:up
pnpm db:generate
echo 'Foundation installed. Run: pnpm db:migrate, then pnpm dev'
