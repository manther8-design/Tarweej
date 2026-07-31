# Branching Strategy

- `main`: production-ready releases only.
- `develop`: integration branch for accepted work.
- `feature/trw-###-name`: scoped feature delivery.
- `release/x.y.z`: stabilization before production.
- `hotfix/x.y.z`: urgent production corrections.

All changes should enter through pull requests. Direct pushes to `main` should be blocked by branch protection.
