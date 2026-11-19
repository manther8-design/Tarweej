-- Tarweej Phase 1 foundation migration
-- Enables gen_random_uuid() via pgcrypto (safe on PG 13+; also present in PG catalog).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Identity
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(320),
    "phone_e164" VARCHAR(20),
    "password_hash" VARCHAR(255),
    "account_type" VARCHAR(40) NOT NULL DEFAULT 'regular',
    "status" VARCHAR(40) NOT NULL DEFAULT 'active',
    "country_id" UUID,
    "preferred_language_code" VARCHAR(16),
    "display_name" VARCHAR(160),
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_e164_key" ON "users"("phone_e164");
CREATE INDEX "users_country_id_idx" ON "users"("country_id");
CREATE INDEX "users_status_idx" ON "users"("status");

CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "device_label" VARCHAR(160),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

CREATE TABLE "user_oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "provider_subject" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_oauth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_oauth_accounts_user_id_idx" ON "user_oauth_accounts"("user_id");
CREATE UNIQUE INDEX "user_oauth_accounts_provider_provider_subject_key" ON "user_oauth_accounts"("provider", "provider_subject");

CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

CREATE TABLE "user_role_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_role_assignments_role_id_idx" ON "user_role_assignments"("role_id");
CREATE UNIQUE INDEX "user_role_assignments_user_id_role_id_key" ON "user_role_assignments"("user_id", "role_id");

-- Reference
CREATE TABLE "languages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(16) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "is_rtl" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

CREATE TABLE "countries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "iso2" CHAR(2) NOT NULL,
    "iso3" CHAR(3) NOT NULL,
    "dialing_code" VARCHAR(8) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "countries_iso2_key" ON "countries"("iso2");
CREATE UNIQUE INDEX "countries_iso3_key" ON "countries"("iso3");

CREATE TABLE "currencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(8) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "minor_units" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

CREATE TABLE "time_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "iana_name" VARCHAR(64) NOT NULL,
    CONSTRAINT "time_zones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "time_zones_iana_name_key" ON "time_zones"("iana_name");

CREATE TABLE "country_languages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "language_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "country_languages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "country_languages_language_id_idx" ON "country_languages"("language_id");
CREATE UNIQUE INDEX "country_languages_country_id_language_id_key" ON "country_languages"("country_id", "language_id");

CREATE TABLE "country_currencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "currency_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "country_currencies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "country_currencies_currency_id_idx" ON "country_currencies"("currency_id");
CREATE UNIQUE INDEX "country_currencies_country_id_currency_id_key" ON "country_currencies"("country_id", "currency_id");

CREATE TABLE "country_time_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "time_zone_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "country_time_zones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "country_time_zones_time_zone_id_idx" ON "country_time_zones"("time_zone_id");
CREATE UNIQUE INDEX "country_time_zones_country_id_time_zone_id_key" ON "country_time_zones"("country_id", "time_zone_id");

CREATE TABLE "regions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regions_country_id_code_key" ON "regions"("country_id", "code");

CREATE TABLE "cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "region_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cities_region_id_idx" ON "cities"("region_id");

CREATE TABLE "translation_strings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" UUID NOT NULL,
    "language_code" VARCHAR(16) NOT NULL,
    "field_name" VARCHAR(64) NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "translation_strings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "translation_strings_entity_type_entity_id_idx" ON "translation_strings"("entity_type", "entity_id");
CREATE UNIQUE INDEX "translation_strings_entity_type_entity_id_language_code_field_name_key" ON "translation_strings"("entity_type", "entity_id", "language_code", "field_name");

-- Configuration
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(120) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rules_json" JSONB,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

CREATE TABLE "business_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(120) NOT NULL,
    "value_json" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_settings_key_key" ON "business_settings"("key");

-- Foreign keys (ordered after all tables exist)
ALTER TABLE "users" ADD CONSTRAINT "users_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "country_languages" ADD CONSTRAINT "country_languages_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "country_languages" ADD CONSTRAINT "country_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "country_currencies" ADD CONSTRAINT "country_currencies_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "country_currencies" ADD CONSTRAINT "country_currencies_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "country_time_zones" ADD CONSTRAINT "country_time_zones_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "country_time_zones" ADD CONSTRAINT "country_time_zones_time_zone_id_fkey" FOREIGN KEY ("time_zone_id") REFERENCES "time_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cities" ADD CONSTRAINT "cities_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
