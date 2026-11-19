# Infrastructure — Monitoring

Single-region v1 observability hooks for Tarweej. Not a full observability stack — wire these into your existing Prometheus / log shipper.

## API surfaces

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health/live` | Process liveness (always 200 if up) |
| `GET /api/v1/health/ready` | Readiness — **PostgreSQL + Redis** (503 if either fails) |
| `GET /api/v1/metrics` | Prometheus text exposition (process + dependency gauges) |

Load balancers / orchestrators should:

- Use **live** for restart decisions
- Use **ready** for traffic admission
- Scrape **metrics** every 15–30s

## Prometheus

Example scrape config: [`prometheus.yml`](./prometheus.yml).

```bash
# Optional local stack (Prometheus only; API must already be running)
docker compose -f infrastructure/monitoring/docker-compose.monitoring.yml up -d
```

## Structured logs

Production defaults to JSON logs (`LOG_FORMAT=json` or `NODE_ENV=production`).

Every request carries:

- `x-correlation-id` / `x-request-id` (echoed on responses; accepted from inbound headers)
- Request start/end lines with method, path, status, durationMs, correlationId

Ship stdout/stderr via your platform agent (Fluent Bit, Vector, CloudWatch, etc.). Example Vector snippet: [`vector.example.toml`](./vector.example.toml).

## Alerts (suggested)

| Signal | Severity |
|--------|----------|
| `tarweej_dependency_up{dependency="postgres"} == 0` for 2m | critical |
| `tarweej_dependency_up{dependency="redis"} == 0` for 5m | critical |
| Ready probe failing | critical |
| 5xx rate > 2% for 10m | warning |
| Auth 429 spike | warning (possible abuse) |
