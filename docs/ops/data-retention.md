# Data retention, deletion & export — Tarweej

Binding principles (PRD §10 / requirements §34–36):

- Soft-delete recoverable business entities where appropriate.
- **Never hard-delete** financial (`payments*`) or audit trail rows.
- UTC storage; UUID PKs.

## Retention (v1 defaults)

| Data class | Retention | Notes |
|------------|-----------|-------|
| Active / paused listings | Indefinite while account active | Soft-delete → `deleted_at` |
| Soft-deleted listings | ≥ 90 days | Then eligible for archival job (not auto-purged in v1) |
| Chat messages | Account lifetime | Soft-hide only; no hard delete in v1 |
| Notifications | 180 days recommended | Delivery log may trim earlier |
| Payment + webhook events | **Indefinite** | Immutable trail |
| Audit entries | **Indefinite** | Admin/config/listing status changes |
| OTP codes | TTL seconds (config) | Already expiring |
| Sessions / refresh tokens | Until revoke or refresh TTL | Rotation on use |
| Backups | 14 daily logical dumps (configurable) | Off-box copy recommended |
| Object storage media | Align with listing lifecycle | Orphan GC is a future job |

Adjust via admin config / ops runbooks — do not hardcode client-side.

## Deletion / account closure

1. User requests deletion → mark profile anonymized + soft-delete listings.
2. Conversations remain for the counterparty with redacted peer identity where required by law.
3. Payments/audit stay with opaque user id or tombstone reference — **no CASCADE hard delete**.
4. Export (below) offered before irreversible anonymization where regulations require.

## Export

Provide on request (admin tooling / support runbook for v1):

- Profile fields
- Listings (JSON)
- Favorites ids
- Chat transcripts for threads the user participates in
- Payment history (amounts, status, timestamps — never PAN; none stored)

Format: JSON download; deliver over authenticated admin or support channel. Automated self-serve export UI is a later enhancement.

## Logging & PII

- Structured logs must not include passwords, OTP codes, JWT secrets, or card data.
- Correlation IDs are safe to retain with log retention (30–90 days typical).
