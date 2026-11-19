# Infrastructure — Deployment (single-region v1)

Tarweej ships as a **modular monolith** in one region. Multi-region active-active is out of scope.

## Artifacts

| File | Purpose |
|------|---------|
| [`docker-compose.prod.yml`](./docker-compose.prod.yml) | Prod-oriented Compose: postgres, redis, api (env-driven secrets) |
| [`env.production.example`](./env.production.example) | Required production env keys (no real secrets) |
| [`deploy.sh`](./deploy.sh) | Idempotent pull → migrate → rolling restart helper |

## Topology

```
Internet → TLS terminator / reverse proxy → api:3000
                ├─ postgres (private network)
                ├─ redis (private network)
                └─ object storage (S3-compatible; not in this compose by default)
```

Workers (featured expiry, notifications) currently run **in-process** with the API. Split to a dedicated worker process later without changing domain modules.

## Prerequisites

1. Copy `env.production.example` → a secrets store / `.env.production` (never commit).
2. Strong unique `JWT_*` secrets (≥32 chars); never reuse `.env.example` placeholders.
3. Real `SMS_PROVIDER` (or explicit `ALLOW_MOCK_PROVIDERS=true` break-glass).
4. Object storage credentials via env (`OBJECT_STORAGE_DRIVER=s3`, …).
5. Backups configured — see `docs/ops/backup-restore.md`.

## Deploy flow

```bash
# From repo root, with production env file available:
./infrastructure/deployment/deploy.sh
```

Manual equivalent:

```bash
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production pull
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production up -d postgres redis
# wait for healthy
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production run --rm api pnpm db:deploy
docker compose -f infrastructure/deployment/docker-compose.prod.yml --env-file .env.production up -d api
curl -fsS https://$API_HOST/api/v1/health/ready
```

**Do not** run `pnpm db:seed` in production (seed refuses unless `ALLOW_PROD_SEED=true`).

## Rollback

1. Redeploy previous image tag.
2. Do **not** reverse Prisma migrations on shared prod unless reviewed — prefer forward fixes.
3. Restore DB from backup only for disaster recovery (`docs/ops/backup-restore.md`).

## Full runbook

See [`docs/ops/deploy-runbook.md`](../../docs/ops/deploy-runbook.md).
