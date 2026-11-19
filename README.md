# ترويج | Tarweej — Listings (TRW-007)

Production-oriented **Nx + pnpm** monorepo for the Tarweej marketplace platform.

Repository: https://github.com/manther8-design/Tarweej

## What's included

| Path | Purpose |
|------|---------|
| `apps/api` | NestJS modular monolith (`/api/v1`, Identity, Reference, Configuration, Catalog, Listings, Swagger) |
| `apps/mobile` | Flutter Clean Architecture shell (Riverpod, GoRouter, AR/EN + RTL, categories + listing wizard) |
| `apps/admin` | Next.js admin: API login + categories / listings moderation / settings / flags / roles |
| `apps/web` | Optional public web placeholder package |
| `libs/*` | Thin shared stubs (`contracts`, `config`, `logging`, `database`) |
| `prisma/` | Identity + Reference + Config + Catalog + Listings schema, migrations, seed |
| `docker-compose.yml` | PostgreSQL **5432**, Redis **6379**, MinIO **9000/9001** |

## Prerequisites

- Node.js 22+
- pnpm 11+ (`corepack enable`)
- Docker + Docker Compose
- Flutter stable (for mobile)

## First run

```bash
cp .env.example .env
corepack enable
pnpm install

# Infrastructure
pnpm infra:up
# or: docker compose up -d postgres redis minio

# Database
pnpm db:generate
pnpm db:deploy
pnpm db:seed   # SA reference + catalog + sample listings + admin@tarweej.local

# API
pnpm dev
```

### API endpoints

| URL | Description |
|-----|-------------|
| http://localhost:3000/api/v1 | Platform info |
| http://localhost:3000/api/v1/health/live | Liveness |
| http://localhost:3000/api/v1/health/ready | Readiness (DB) |
| http://localhost:3000/api/v1/docs | Swagger / OpenAPI UI |
| http://localhost:3000/api/v1/listings | Public active listings (paginated) |
| http://localhost:3000/api/v1/listings/:id | Public active listing detail |
| http://localhost:3000/api/v1/listings/:id/views | Increment view counter |
| http://localhost:3000/api/v1/my/listings | Owner create/list/update/submit/media |
| http://localhost:3000/api/v1/admin/listings/pending | Moderation queue (`listings.moderate`) |
| http://localhost:3000/api/v1/admin/listings/:id/approve\|reject | Moderate (audited) |
| http://localhost:3000/api/v1/categories | Active category hierarchy (+ `?lang=`) |
| http://localhost:3000/api/v1/identity/auth/login | Email login |

Object storage defaults to `OBJECT_STORAGE_DRIVER=local` (filesystem under `.data/object-storage`). Set `s3` to use MinIO/AWS via the S3-compatible adapter. Media binaries are never stored in Postgres.

### Admin

```bash
pnpm --filter @tarweej/admin dev
# http://localhost:3001
# Dev login after seed: admin@tarweej.local / Admin123!
# Sample seller: seller@tarweej.local / Seller123!
```

### Flutter

```bash
cd apps/mobile
flutter pub get
flutter gen-l10n
flutter analyze
flutter run
```

Native Android/iOS host folders are not committed in Phase 1. Generate once if needed:

```bash
cd apps/mobile
flutter create --platforms=android,ios,web .
```

## Quality

```bash
pnpm format:check
pnpm lint
pnpm test
pnpm build
```

## Notes

- UUID primary keys use DB `gen_random_uuid()` defaults.
- Listing status machine: Draft → Pending Review → Active/Rejected (+ Pause/Expire/Archive/Delete).
- Object storage: local adapter (default) or S3/MinIO; CDN URLs are stubs until a CDN is wired.
- Never commit `.env` or real secrets.

## Delivery

- Foundation: project store `docs/delivery/TRW-002-foundation.md`
- Identity: project store `docs/delivery/TRW-003-identity.md`
- Listings: project store `docs/delivery/TRW-007-listings.md`
