# ترويج | Tarweej — Production Readiness (TRW-013)

Production-oriented **Nx + pnpm** monorepo for the Tarweej marketplace platform.

Repository: https://github.com/manther8-design/Tarweej

## What's included

| Path | Purpose |
|------|---------|
| `apps/api` | NestJS modular monolith (`/api/v1`, Identity → Admin ops, Swagger in non-prod) |
| `apps/mobile` | Flutter shell (Riverpod, GoRouter, AR/EN + RTL) |
| `apps/admin` | Next.js admin ops surfaces |
| `apps/web` | Optional public web placeholder package |
| `libs/*` | Thin shared stubs (`contracts`, `config`, `logging`, `database`) |
| `prisma/` | Schema, migrations, **dev-only** seed |
| `docker-compose.yml` | Local PostgreSQL **5432**, Redis **6379**, MinIO **9000/9001** |
| `infrastructure/monitoring` | Prometheus scrape + log shipper hooks |
| `infrastructure/deployment` | Prod-oriented Compose, env template, deploy helper |
| `docs/ops/` | Deploy runbook, backup/restore, retention, hardening |

## Prerequisites

- Node.js 22+
- pnpm 11+ (`corepack enable`)
- Docker + Docker Compose
- Flutter stable (for mobile)

## First run (local / dev)

```bash
cp .env.example .env
corepack enable
pnpm install

pnpm infra:up
pnpm db:generate
pnpm db:deploy
pnpm db:seed   # DEV ONLY — refuses NODE_ENV=production

pnpm dev
```

### API endpoints

| URL | Description |
|-----|-------------|
| http://localhost:3000/api/v1 | Platform info |
| http://localhost:3000/api/v1/health/live | Liveness |
| http://localhost:3000/api/v1/health/ready | Readiness (**DB + Redis**; 503 if either down) |
| http://localhost:3000/api/v1/metrics | Prometheus text metrics |
| http://localhost:3000/api/v1/docs | Swagger (disabled in production by default) |

Object storage defaults to `OBJECT_STORAGE_DRIVER=local`. Set `s3` for MinIO/AWS.

### Admin

```bash
pnpm --filter @tarweej/admin dev
# http://localhost:3001
# Dev login after seed: admin@tarweej.local / Admin123!
```

## Production (single-region)

See:

- [`docs/ops/deploy-runbook.md`](docs/ops/deploy-runbook.md)
- [`docs/ops/backup-restore.md`](docs/ops/backup-restore.md)
- [`docs/ops/data-retention.md`](docs/ops/data-retention.md)
- [`docs/ops/security-hardening.md`](docs/ops/security-hardening.md)
- [`infrastructure/deployment/`](infrastructure/deployment/)

```bash
# After filling secrets (never commit):
cp infrastructure/deployment/env.production.example .env.production
ENV_FILE=.env.production ./infrastructure/deployment/deploy.sh
```

Do **not** seed production. Do **not** reuse `.env.example` JWT / DB passwords.

## Tests

```bash
pnpm ops:secret-scan
pnpm test
pnpm build
```

## License

UNLICENSED — private project.
