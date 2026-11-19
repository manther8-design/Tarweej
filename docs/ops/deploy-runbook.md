# Deploy runbook — Tarweej (single-region)

## Architecture reminder

Modular monolith: one NestJS API process (+ in-process jobs), PostgreSQL, Redis, S3-compatible media. **Not** multi-region active-active.

## Pre-flight

1. CI green on the release commit (lint, test, build, secret scan).
2. Production secrets loaded from a secret manager — **not** `.env.example` placeholders.
3. `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` ≥ 32 chars and distinct.
4. `SMS_PROVIDER` is a real adapter (or documented break-glass `ALLOW_MOCK_PROVIDERS=true`).
5. Backup taken (or verified within RPO window) — `docs/ops/backup-restore.md`.
6. Change window + rollback owner identified.

## Deploy

Preferred:

```bash
ENV_FILE=/secure/path/.env.production ./infrastructure/deployment/deploy.sh
```

Manual:

```bash
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production build api
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production up -d postgres redis
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production run --rm --entrypoint \
  ./node_modules/.bin/prisma api migrate deploy --schema=./prisma/schema.prisma
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production up -d api
```

**Never** run `pnpm db:seed` in production (seed exits unless `ALLOW_PROD_SEED=true`).

## Post-deploy verification

```bash
curl -fsS https://$API_HOST/api/v1/health/live
curl -fsS https://$API_HOST/api/v1/health/ready   # must include redis+database connected
curl -fsS https://$API_HOST/api/v1/metrics | head
# Auth smoke (expect 401/400, not 5xx):
curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://$API_HOST/api/v1/identity/auth/login \
  -H 'content-type: application/json' -d '{}'
```

Admin / Flutter against the new API base URL.

## Rollback

1. Redeploy previous image tag (`IMAGE_TAG=…`).
2. Prefer forward-fix migrations; do not down-migrate shared prod without DBA review.
3. If data corruption: restore from backup to a new instance, cut DNS after verification.

## Probes & scaling notes

| Probe | Path | Use |
|-------|------|-----|
| Liveness | `/api/v1/health/live` | Restart unhealthy processes |
| Readiness | `/api/v1/health/ready` | Remove from LB if DB/Redis down |
| Metrics | `/api/v1/metrics` | Prometheus scrape |

Horizontal scale: multiple API replicas behind LB are fine for v1 **stateless** HTTP; sticky sessions not required. Redis and Postgres remain single-primary in this topology.
