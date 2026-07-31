# ADR-046: Monorepo Strategy

## Status
Accepted

## Decision
Tarweej uses a single repository with pnpm workspaces and Nx task orchestration. The NestJS API is managed as an Nx project. Flutter remains in the same repository but uses Flutter tooling directly because Nx is not its native build system.

## Consequences
The repository has one source of truth, shared CI, consistent governance, and an explicit boundary between TypeScript and Flutter toolchains.
