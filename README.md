# Tarweej Platform — TRW-001 Foundation v1.0.1

Production foundation for **ترويج | Tarweej**, a multi-product marketplace platform.

Official repository: `https://github.com/manther8-design/Tarweej`

## Included

- Nx + pnpm monorepo orchestration
- NestJS 11 API with API versioning, validation, Helmet, CORS, Swagger, and health probes
- Prisma 7 with PostgreSQL driver adapter
- PostgreSQL and Redis through Docker Compose
- Flutter application shell using Riverpod and GoRouter
- ESLint, Prettier, Husky, Commitlint, and GitHub Actions
- Environment validation and production-oriented configuration

## Requirements

- Node.js 22+
- pnpm 11+
- Docker Desktop
- Flutter stable
- Git

## First Run

```bash
git clone https://github.com/manther8-design/Tarweej.git
cd Tarweej
cp .env.example .env
corepack enable
pnpm install
pnpm infra:up
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Liveness: `http://localhost:3000/api/health/live`
- Readiness: `http://localhost:3000/api/health/ready`

## Flutter

```bash
cd apps/mobile
flutter pub get
flutter run
```

The native Android/iOS host folders are intentionally not committed in this first delivery. Generate them once using:

```bash
cd apps/mobile
flutter create --platforms=android,ios .
```

Then review the generated platform identifiers before committing.

## Quality Commands

```bash
pnpm format:check
pnpm lint
pnpm build
pnpm test
```

## Recommended Initial Git Flow

```bash
git checkout -b feature/trw-001-foundation
git add .
git commit -m "feat(foundation): establish Tarweej monorepo"
git push -u origin feature/trw-001-foundation
```

Open a pull request into `develop`, then promote accepted releases to `main`.

## Security Notes

- Never commit `.env` or production credentials.
- Replace all development passwords outside local environments.
- Enable GitHub branch protection and secret scanning.
- Use managed secrets in staging and production.


## Applying v1.0.1 to the Existing Repository

Extract this package beside your local Git repository, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-update.ps1 `
  -RepositoryPath "C:\path\to\Tarweej"
```

Alternatively, copy the package contents over the repository manually while preserving
the repository's `.git` folder and local `.env`.

Then validate and commit:

```powershell
corepack enable
corepack prepare pnpm@11.18.0 --activate
pnpm install
pnpm db:generate
pnpm lint
pnpm test
pnpm build
git status
git add .
git commit -m "fix(foundation): harden TRW-001 baseline"
git push
```

See `docs/TRW-001-ACCEPTANCE.md` for the complete acceptance checklist.
