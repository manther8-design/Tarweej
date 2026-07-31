# TRW-001 Foundation — Acceptance Criteria

TRW-001 is accepted only after all items below pass.

## Repository

- [ ] The project is committed to `main` or merged through a pull request.
- [ ] `.env` is not committed.
- [ ] GitHub Actions starts successfully.

## Backend

- [ ] `pnpm install` completes.
- [ ] `pnpm db:generate` completes.
- [ ] `pnpm lint` completes.
- [ ] `pnpm test` completes.
- [ ] `pnpm build` completes.
- [ ] `pnpm dev` starts the API.
- [ ] `/api/health/live` returns HTTP 200.
- [ ] `/api/health/ready` returns HTTP 200 while PostgreSQL is running.
- [ ] `/docs` opens Swagger UI.

## Infrastructure

- [ ] `docker compose config` validates.
- [ ] PostgreSQL becomes healthy.
- [ ] Redis becomes healthy.
- [ ] Data survives container restart through named volumes.

## Flutter

- [ ] `flutter pub get` completes in `apps/mobile`.
- [ ] `flutter analyze` completes.
- [ ] `flutter test` completes.
- [ ] The application displays the Tarweej brand.

## Security

- [ ] Development credentials are not reused in staging or production.
- [ ] Branch protection is enabled for `main`.
- [ ] Secret scanning is enabled in GitHub.
