# ترويج | Tarweej — Reference Data (TRW-004)

Production-oriented **Nx + pnpm** monorepo for the Tarweej marketplace platform.

Repository: https://github.com/manther8-design/Tarweej

## What's included

| Path | Purpose |
|------|---------|
| `apps/api` | NestJS modular monolith shell (`/api/v1`, health, Swagger, config, logging) |
| `apps/mobile` | Flutter Clean Architecture shell (Riverpod, GoRouter, AR/EN + RTL) |
| `apps/admin` | Next.js admin shell (login placeholder only) |
| `apps/web` | Optional public web placeholder package |
| `libs/*` | Thin shared stubs (`contracts`, `config`, `logging`, `database`) |
| `prisma/` | Identity + Reference + roles/settings schema, migration, seed |
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
pnpm db:seed   # SA-focused reference + roles (dev only)

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
| http://localhost:3000/api/v1/reference/countries | Active countries (+ associations) |
| http://localhost:3000/api/v1/reference/regions?countryId=… | Active regions |
| http://localhost:3000/api/v1/reference/cities?countryId=… | Active cities |
| http://localhost:3000/api/v1/reference/languages | Active languages |
| http://localhost:3000/api/v1/reference/currencies | Active currencies |
| http://localhost:3000/api/v1/admin/reference/… | Admin CRUD (Bearer + `super_admin`) |
| http://localhost:3000/api/v1/identity/auth/register | Email registration |
| http://localhost:3000/api/v1/identity/auth/login | Email login |
| http://localhost:3000/api/v1/identity/me | Current user (Bearer) |

### Admin

```bash
pnpm --filter @tarweej/admin dev
# http://localhost:3001  ·  /login placeholder
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
- Object storage locally is MinIO (S3-compatible); production uses the same adapter later.
- Identity domain (email/password, OTP mock SMS, Google adapter stub, sessions, RBAC) is implemented in TRW-003.
- Never commit `.env` or real secrets.

## Delivery

- Foundation: project store `docs/delivery/TRW-002-foundation.md`
- Identity: project store `docs/delivery/TRW-003-identity.md`
