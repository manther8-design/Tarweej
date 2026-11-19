-- TRW-005: permissions, role_permissions, audit_entries, settings/flags metadata

-- Role description
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "description" VARCHAR(255);

-- Permissions catalog
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(255),
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_permission_id_fkey"
  FOREIGN KEY ("permission_id") REFERENCES "permissions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature flags / business settings metadata
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "description" VARCHAR(255);

ALTER TABLE "business_settings" ADD COLUMN IF NOT EXISTS "description" VARCHAR(255);
ALTER TABLE "business_settings" ADD COLUMN IF NOT EXISTS "is_secret" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "business_settings_is_secret_idx" ON "business_settings"("is_secret");

-- Append-only audit trail
CREATE TABLE "audit_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "action" VARCHAR(80) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "before_json" JSONB,
    "after_json" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_entries_actor_id_idx" ON "audit_entries"("actor_id");
CREATE INDEX "audit_entries_entity_type_entity_id_idx" ON "audit_entries"("entity_type", "entity_id");
CREATE INDEX "audit_entries_created_at_idx" ON "audit_entries"("created_at");

ALTER TABLE "audit_entries"
  ADD CONSTRAINT "audit_entries_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
