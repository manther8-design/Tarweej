# Changelog

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
