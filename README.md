# ترويج | Tarweej — Notifications & Moderation (TRW-011)

Production-oriented **Nx + pnpm** monorepo for the Tarweej marketplace platform.

Repository: https://github.com/manther8-design/Tarweej

## What's included

| Path | Purpose |
|------|---------|
| `apps/api` | NestJS modular monolith (`/api/v1`, Identity → Engagement + Commercial + Notifications, Swagger) |
| `apps/mobile` | Flutter shell (Riverpod, GoRouter, AR/EN + RTL, listings, search, favorites, chat, notifications, promote/pay) |
| `apps/admin` | Next.js admin: categories, listings moderation, **reports queue**, featured pricing, payment routes, settings, flags, roles |
| `apps/web` | Optional public web placeholder package |
| `libs/*` | Thin shared stubs (`contracts`, `config`, `logging`, `database`) |
| `prisma/` | Full schema through notifications + reports, migrations, seed |
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
| http://localhost:3000/api/v1/notifications | In-app inbox (JWT) |
| http://localhost:3000/api/v1/notifications/unread-count | Unread count (JWT) |
| http://localhost:3000/api/v1/notifications/:id/read | Mark one read (JWT) |
| http://localhost:3000/api/v1/notifications/read-all | Mark all read (JWT) |
| http://localhost:3000/api/v1/notifications/device-tokens | Register/unregister push token (JWT) |
| http://localhost:3000/api/v1/reports | File a listing/user report (JWT) |
| http://localhost:3000/api/v1/admin/reports | Moderation queue (`reports.read`) |
| http://localhost:3000/api/v1/admin/reports/:id/classify\|act\|close | Moderate (audited, `reports.moderate`) |
| http://localhost:3000/api/v1/search/listings | Search listings (text, filters, sort, pagination) |
| http://localhost:3000/api/v1/favorites | Favorites add/list/remove (JWT) |
| http://localhost:3000/api/v1/conversations | Listing-scoped chat + messages + read receipts (JWT) |
| http://localhost:3000/api/v1/promotions/plans | Featured pricing plans |
| http://localhost:3000/api/v1/promotions/purchase | Purchase featured (JWT; owner only) |
| http://localhost:3000/api/v1/payments | Payment history (JWT) |
| http://localhost:3000/api/v1/webhooks/payments/:provider | Signed payment webhooks |
| http://localhost:3000/api/v1/admin/commercial | Pricing rules + payment routes + expiry job |
| http://localhost:3000/api/v1/listings | Public active listings (paginated) |
| http://localhost:3000/api/v1/my/listings | Owner create/list/update/submit/media |
| http://localhost:3000/api/v1/admin/listings/pending | Listing moderation queue |
| http://localhost:3000/api/v1/categories | Active category hierarchy (+ `?lang=`) |
| http://localhost:3000/api/v1/identity/auth/login | Email login |

Object storage defaults to `OBJECT_STORAGE_DRIVER=local` (filesystem under `.data/object-storage`). Set `s3` to use MinIO/AWS via the S3-compatible adapter. Media binaries are never stored in Postgres.

### Admin

```bash
pnpm --filter @tarweej/admin dev
# http://localhost:3001
# Dev login after seed: admin@tarweej.local / Admin123!
# Sample seller: seller@tarweej.local / Seller123!
# Reports queue: /reports
```

### Flutter

```bash
cd apps/mobile
flutter pub get
flutter gen-l10n
flutter run
# Home → Notifications inbox; listing detail → Report listing
```

## Tests

```bash
pnpm test          # API unit + integration (needs DATABASE_URL / seed)
pnpm build
```

## License

UNLICENSED — private project.
