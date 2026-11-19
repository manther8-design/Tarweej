# Backup & restore — Tarweej (single-region)

## Scope

- **In scope:** PostgreSQL logical backups, Redis AOF notes, object-storage media retention.
- **Out of scope:** Multi-region replication, PITR vendor wiring (document your cloud provider separately).

## PostgreSQL

### Backup

```bash
# Against local compose
./scripts/backup-postgres.sh --compose

# Against any DATABASE_URL
DATABASE_URL='postgresql://…' BACKUP_DIR=/var/backups/tarweej ./scripts/backup-postgres.sh
```

Defaults:

| Variable | Default | Meaning |
|----------|---------|---------|
| `BACKUP_DIR` | `.data/backups` | Output directory |
| `BACKUP_KEEP` | `14` | Keep newest N dumps |

Schedule daily (cron / cloud scheduler) and copy off-box (S3/GCS with object lock if available).

### Restore (disaster only)

```bash
RESTORE_CONFIRM=YES ./scripts/restore-postgres.sh --compose .data/backups/tarweej-postgres-….sql.gz
# then:
pnpm db:deploy   # or prisma migrate deploy in the release pipeline
curl -fsS https://$API_HOST/api/v1/health/ready
```

Rules:

1. Never restore over a healthy primary without an incident ticket / approval.
2. Financial and audit rows are part of the dump — do not selectively hard-delete them after restore.
3. After restore, invalidate Redis cache (restart Redis or `FLUSHDB` on the app logical DB) so search/config caches cannot serve stale keys.

## Redis

Redis is **cache + rate-limit + queue** state, not system of record.

- Compose enables AOF for local durability.
- Production: treat Redis as ephemeral; rely on Postgres rebuild for correctness after total Redis loss.
- Optional: nightly RDB snapshot to object storage if you want faster warm cache.

## Object storage (media)

- Bytes live in S3-compatible storage; Postgres holds metadata + CDN URLs.
- Enable bucket versioning + lifecycle rules (see retention policy).
- Back up bucket inventory / cross-region copy per your cloud provider — not automated in-repo for v1.

## Verification checklist

- [ ] Latest dump age < 24h
- [ ] Quarterly restore drill to a scratch database
- [ ] Ready probe green after drill
- [ ] Sample listing media URL still resolves
