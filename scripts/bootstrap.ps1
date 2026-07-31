$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
}

corepack enable
pnpm install
pnpm infra:up
pnpm db:generate
Write-Host 'Foundation installed. Run: pnpm db:migrate, then pnpm dev' -ForegroundColor Green
