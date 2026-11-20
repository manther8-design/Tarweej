# Changelog

## 0.16.0 — TRW-016 Flutter Web CORS

- Nest API CORS: non-production allows `localhost` / `127.0.0.1` on any port (Flutter Chrome random ports)
- Production still uses exact `CORS_ORIGINS` allow-list only (no wildcard)
- Preflight `OPTIONS` + `Content-Type: application/json` headers documented in enableCors
- Flutter default `API_BASE_URL` remains `http://localhost:3000/api/v1`; documented `--dart-define` in README

## 0.15.0 — TRW-015 Full UI System

- Aligned Flutter/web/admin to Mansour HTML prototype: royal blue `#0f4c81`/`#1d4ed8` + orange `#f97316`, dual-tone logo, Cairo/Tajawal
- Web sticky header (city/search/favorites/messages/Post Ad) + category chips + featured orange cards
- Flutter: bottom nav shell (home / sections / sell / messages / account); section vertical hubs + placeholders
- Flutter: account hub with AR/EN + light/dark preferences; listing seller/share/similar; create preview + featured upsell
- Public web storefront (`apps/web`): home, sections, listing detail, dashboard/login shells on Nest search APIs
- Admin visual tokens aligned to Tarweej ink/teal + Cairo/Outfit
- Listing detail API includes public `owner { id, displayName }` for seller UI

## 0.14.0 — TRW-014 Flutter Marketplace UX

- AdForest-class home: brand hero «ترويج», search, category strip, featured rail, photo listing grid from search API
- Shared listing cards / detail gallery + favorites / search / my-listings / categories polish (RTL Arabic)
- Seed sample media via picsum CDN + local object-storage PNG; media proxy placeholder fallback
- Guest browse for home / search / categories / listing detail

## 0.13.0 — TRW-013 Production Readiness

- Health readiness now requires PostgreSQL **and** Redis (HTTP 503 when either is down)
- Structured JSON logs in production + `x-correlation-id` / `x-request-id` middleware
- HTTP request logging interceptor; Prometheus text metrics at `/api/v1/metrics`
- Auth HTTP rate limits (Redis) on register/login/refresh/google/otp; OTP limits unchanged
- Production env validation rejects placeholder JWT secrets and `SMS_PROVIDER=mock`
- Seed refuses `NODE_ENV=production` unless `ALLOW_PROD_SEED=true`
- Swagger disabled by default in production (`ENABLE_SWAGGER=true` to override)
- `infrastructure/monitoring` + `infrastructure/deployment` scaffolding (Compose, Prometheus, deploy.sh)
- Ops docs: backup/restore, retention/export, deploy runbook, security hardening
- Backup/restore scripts; CI secret-scan gate; Dockerfile healthcheck + prisma schema in image

## 0.12.0 — TRW-012 Admin Dashboard

- Admin ops overview KPIs: users, listings by status, payments, open reports, featured active
- `GET /api/v1/admin/dashboard/overview` (`dashboard.read`) with recent audit strip
- Audit browser API pagination/filters (`action`, `offset`) + Admin `/audit` UI
- Users list + role assign/revoke surfaces: `GET /api/v1/admin/rbac/users` + Admin `/users`
- Payments/featured ops: `GET /api/v1/admin/commercial/payments|promotions` + Admin `/payments`
- Reference countries admin page; shell nav unified across ops queues
- RBAC: `dashboard.read`, `payments.read` for moderator + super_admin
- Integration tests for dashboard KPIs, users list, payments/promotions admin lists

## 0.11.0 — TRW-011 Notifications & Moderation

- Prisma: `notifications`, `device_tokens`, `reports` (listing and/or user targets; audited resolutions)
- NestJS notifications module: inbox list/unread/mark-read/mark-all + device token register; FCM push port stub
- Domain hooks: listing approve/reject, payment success/fail, featured expiry, new chat message
- Reports: `POST /api/v1/reports`; admin queue classify / act (hide listing) / close with reason + audit
- RBAC: `reports.read`, `reports.moderate` granted to moderator + super_admin
- Flutter: notifications inbox; report action on listing detail (AR/EN)
- Admin: reports moderation queue page
- Integration tests for notifications + reports workflow

## 0.10.0 — TRW-010 Payments & Featured Ads

- Prisma: `featured_pricing_rules`, `featured_promotions`, `payments`, `payment_attempts`, `webhook_events`, `payment_provider_routes`
- NestJS commercial module: payment gateway port + mock adapter (HMAC webhooks, idempotency), country routing, purchase → Paid → activate featured, expiry job
- APIs: `/api/v1/promotions`, `/api/v1/payments`, `/api/v1/webhooks/payments/:provider`, `/api/v1/admin/commercial`
- Never trust client-only payment success; sandbox `mock-complete` synthesizes a signed webhook
- Flutter: promote listing + payment result screens (mock provider)
- Admin: featured pricing + payment routes page
- Integration tests for purchase, webhook verify/idempotency, activation, expiry

## 0.9.0 — TRW-009 Favorites & Chat

- Prisma: `favorites` (unique user+listing), `conversations` (listing-scoped buyer/seller), `messages` with `read_at`
- NestJS engagement module: `GET/POST/DELETE /api/v1/favorites`, `GET/POST /api/v1/conversations` (+ messages + read)
- Deny favoriting own listing; favorites list marks expired/deleted/unavailable gracefully
- Chat authorization: only participants can read/send; HTTP-first with `ChatRealtimePort` + WebSocket path stub `/api/v1/ws/chat`
- Flutter: favorites list, chat list/thread, listing detail favorite + contact seller (AR/EN)
- Integration tests for favorites + conversations

## 0.8.0 — TRW-008 Search

- NestJS search domain: `GET /api/v1/search/listings` with text (title/description FTS + trigram), category/city/country/price/featured filters, dynamic attribute filters (`attrs` JSON), sort, pagination
- `SearchEngine` port with Postgres implementation (OpenSearch-ready); optional Redis cache for hot queries
- Prisma/SQL indexes: FTS `search_vector`, pg_trgm on title/description, filter/sort helpers on listings + attribute values
- Flutter: search UI with filters wired to API (AR/EN)
- CI: Redis service for backend job; search integration tests

## 0.7.0 — TRW-007 Listings

- Prisma: `listings`, `listing_media`, `listing_attribute_values`, `listing_status_histories`, `listing_views` with UUID PKs and status machine
- NestJS listings APIs: public active list/get + view counter; owner CRUD under `/api/v1/my/listings` with attribute validation + media upload; admin moderation approve/reject (RBAC + audit)
- Object storage port: local filesystem adapter (default) + S3/MinIO-compatible adapter; media metadata only in Postgres
- Seed: listing permissions, sample active + pending listings, `seller@tarweej.local`
- Flutter: create listing wizard (category → fields → media stub → review), my listings, listing detail
- Admin Next.js: pending listings moderation queue
- Integration tests for create/submit/media/moderation/views/RBAC

## 0.6.0 — TRW-006 Categories & Dynamic Attributes

- Prisma: hierarchical `categories`, `attribute_definitions`, `category_attributes`, `attribute_options`; soft-delete + `is_active` + `sort_order`
- NestJS catalog APIs: public `GET /api/v1/categories` tree + category attributes; admin CRUD under `/api/v1/admin/categories` with RBAC + audit
- Seed: Marketplace → Electronics → Phones (+ brand/storage/condition/warranty attributes)
- Flutter: home + categories browse wired to live catalog API (no hardcoded categories)
- Admin Next.js: categories list/create/edit + attribute attach/detach
- Integration tests for hierarchy, attributes, permissions, cycle guard, audit

## 0.5.0 — TRW-005 Config & Admin RBAC

- Prisma: permissions, role_permissions, audit_entries; settings/flags metadata (`description`, `is_secret`)
- NestJS configuration APIs: public non-secret settings + feature flags; admin CRUD with permission guards
- RBAC admin APIs: roles/permissions overview, assign/revoke roles; append-only audit for sensitive mutations
- Seed: core permissions, role grants, sample settings/flags, local `admin@tarweej.local`
- Next.js admin: real API login, settings / feature flags / roles overview pages
- Integration tests for public reads, permission enforcement, audit trail

## 0.4.0 — TRW-004 Reference Data

- Complete Prisma reference models: locales, dialing_codes, country associations, hierarchical regions, city flags, translation strings
- Partial unique indexes enforcing one primary language/locale/currency/TZ/dialing per country
- NestJS public `/api/v1/reference/...` reads + admin `/api/v1/admin/reference/...` CRUD with RBAC
- SA-focused seed: AR/EN locales, SAR, +966, regions/cities + translations
- Flutter country selection wired to live reference API (AR/EN RTL)
- Integration tests for public reads, admin RBAC, hierarchy, primary constraints

## 0.3.0 — TRW-003 Identity

- NestJS Identity domain: email register/login, JWT access/refresh rotation, logout revoke
- Phone OTP with SMS provider port + mock adapter; Google auth adapter stub
- Device sessions list/revoke; RBAC roles from DB; Swagger under `/api/v1/identity/...`
- Prisma migration for OTP challenges + session metadata
- Flutter auth screens, session storage, GoRouter guards, profile shell (AR/EN)

## 0.2.0 — TRW-002 Foundation

- Expand Prisma schema: Identity, Reference, roles, feature flags, business settings
- Initial migration + dev seed (languages/countries/currencies/roles)
- NestJS `/api/v1` health + Swagger; Identity/Reference/Configuration module scaffolds
- Next.js admin login placeholder; optional `apps/web` package
- Shared libs stubs; MinIO in docker-compose; Flutter Clean Architecture + AR/EN RTL
- CI: API install/migrate/lint/test/build + Flutter analyze/test

## 0.1.1 — TRW-001 baseline harden

- Initial Nest/Flutter/Prisma monorepo stub on `main`
