# ترويج | Tarweej — Config & Admin RBAC (TRW-005)

Production-oriented **Nx + pnpm** monorepo for the Tarweej marketplace platform.

Repository: https://github.com/manther8-design/Tarweej

## What's included

| Path | Purpose |
|------|---------|
| `apps/api` | NestJS modular monolith (`/api/v1`, Identity, Reference, Configuration, Swagger) |
| `apps/mobile` | Flutter Clean Architecture shell (Riverpod, GoRouter, AR/EN + RTL) |
| `apps/admin` | Next.js admin: API login + settings / flags / roles |
| `apps/web` | Optional public web placeholder package |
| `libs/*` | Thin shared stubs (`contracts`, `config`, `logging`, `database`) |
| `prisma/` | Identity + Reference + permissions/audit/settings schema, migrations, seed |
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
pnpm db:seed   # SA reference + roles/permissions + admin@tarweej.local (dev only)

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
| http://localhost:3000/api/v1/configuration/settings | Public non-secret settings |
| http://localhost:3000/api/v1/configuration/feature-flags | Public feature flags |
| http://localhost:3000/api/v1/admin/configuration/… | Admin settings/flags (permission-guarded) |
| http://localhost:3000/api/v1/admin/rbac/… | Roles, permissions, assign/revoke |
| http://localhost:3000/api/v1/admin/audit/entries | Audit trail |
| http://localhost:3000/api/v1/reference/countries | Active countries (+ associations) |
| http://localhost:3000/api/v1/admin/reference/… | Admin reference CRUD (Bearer + `super_admin`) |
| http://localhost:3000/api/v1/identity/auth/login | Email login |

### Admin

```bash
pnpm --filter @tarweej/admin dev
# http://localhost:3001
# Dev login after seed: admin@tarweej.local / Admin123!
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
