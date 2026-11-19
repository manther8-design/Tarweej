# Changelog

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
