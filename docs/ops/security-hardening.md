# Security & ops hardening — single-region v1

## Secrets

- All secrets via environment / secret manager (see `infrastructure/deployment/env.production.example`).
- `.env.example` and seed passwords (`admin@tarweej.local` / `Admin123!`) are **dev only**.
- Production boot **rejects** placeholder JWT secrets and `SMS_PROVIDER=mock` (unless `ALLOW_MOCK_PROVIDERS=true`).
- Seed refuses `NODE_ENV=production` unless `ALLOW_PROD_SEED=true`.
- CI runs `scripts/ci-secret-scan.sh` to block obvious credential commits and demo passwords in prod compose/Dockerfile.

## Transport & headers

- Terminate TLS at the edge (Cloud LB / nginx / Caddy).
- API enables `helmet()`, CORS allow-list via `CORS_ORIGINS`.
- Correlation IDs: accept/propagate `x-correlation-id` / `x-request-id`.

## Rate limits

| Surface | Mechanism | Defaults |
|---------|-----------|----------|
| OTP request | Redis counters in `OtpService` | `OTP_RATE_LIMIT_MAX=3` / `OTP_RATE_LIMIT_WINDOW_SECONDS=60` |
| Auth HTTP (register/login/refresh/google/otp) | `AuthRateLimitMiddleware` | `AUTH_RATE_LIMIT_MAX=30` / window 60s per IP+route |
| Payments webhooks | HMAC signature + idempotency keys | N/A |

Tune via env; tighten for public launch markets.

## API surface

- Swagger/OpenAPI UI **disabled** when `NODE_ENV=production` unless `ENABLE_SWAGGER=true`.
- ValidationPipe: whitelist + forbid non-whitelisted.
- RBAC enforced server-side on admin routes (unchanged from prior phases).
- No card PAN storage; webhook signatures required (TRW-010).

## Runtime

- Container runs as non-root `tarweej` user.
- Postgres/Redis ports stay on private networks in prod compose (not published).
- Readiness fails closed if Postgres **or** Redis is unreachable.

## Logging

- JSON logs in production; no secrets/OTP/passwords in log fields.
- Audit module remains system of record for sensitive admin/listing/payment actions.
