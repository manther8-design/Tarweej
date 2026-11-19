-- TRW-004: complete Reference Data domain
-- locales, dialing_codes, country associations, hierarchical regions, city flags,
-- and partial unique indexes for one primary association per country.

-- Locales
CREATE TABLE "locales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "language_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "locales_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "locales_code_key" ON "locales"("code");
CREATE INDEX "locales_language_id_idx" ON "locales"("language_id");

ALTER TABLE "locales"
  ADD CONSTRAINT "locales_language_id_fkey"
  FOREIGN KEY ("language_id") REFERENCES "languages"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Dialing codes
CREATE TABLE "dialing_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(8) NOT NULL,
    "label" VARCHAR(120),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dialing_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dialing_codes_code_key" ON "dialing_codes"("code");

-- Country ↔ Locale
CREATE TABLE "country_locales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "locale_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "country_locales_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "country_locales_country_id_locale_id_key" ON "country_locales"("country_id", "locale_id");
CREATE INDEX "country_locales_locale_id_idx" ON "country_locales"("locale_id");

ALTER TABLE "country_locales"
  ADD CONSTRAINT "country_locales_country_id_fkey"
  FOREIGN KEY ("country_id") REFERENCES "countries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "country_locales"
  ADD CONSTRAINT "country_locales_locale_id_fkey"
  FOREIGN KEY ("locale_id") REFERENCES "locales"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Country ↔ Dialing code
CREATE TABLE "country_dialing_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "dialing_code_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "country_dialing_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "country_dialing_codes_country_id_dialing_code_id_key"
  ON "country_dialing_codes"("country_id", "dialing_code_id");
CREATE INDEX "country_dialing_codes_dialing_code_id_idx" ON "country_dialing_codes"("dialing_code_id");

ALTER TABLE "country_dialing_codes"
  ADD CONSTRAINT "country_dialing_codes_country_id_fkey"
  FOREIGN KEY ("country_id") REFERENCES "countries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "country_dialing_codes"
  ADD CONSTRAINT "country_dialing_codes_dialing_code_id_fkey"
  FOREIGN KEY ("dialing_code_id") REFERENCES "dialing_codes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Hierarchical regions
ALTER TABLE "regions" ADD COLUMN "parent_id" UUID;
ALTER TABLE "regions" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "regions" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "regions" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "regions_parent_id_idx" ON "regions"("parent_id");
CREATE INDEX "regions_country_id_is_active_idx" ON "regions"("country_id", "is_active");

ALTER TABLE "regions"
  ADD CONSTRAINT "regions_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "regions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Cities
ALTER TABLE "cities" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "cities" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "cities" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "cities_region_id_idx";
CREATE INDEX "cities_region_id_is_active_idx" ON "cities"("region_id", "is_active");

-- One primary association per country (SoT invariants)
CREATE UNIQUE INDEX "country_languages_one_primary_idx"
  ON "country_languages" ("country_id") WHERE "is_primary" = true;

CREATE UNIQUE INDEX "country_locales_one_primary_idx"
  ON "country_locales" ("country_id") WHERE "is_primary" = true;

CREATE UNIQUE INDEX "country_currencies_one_primary_idx"
  ON "country_currencies" ("country_id") WHERE "is_primary" = true;

CREATE UNIQUE INDEX "country_time_zones_one_primary_idx"
  ON "country_time_zones" ("country_id") WHERE "is_primary" = true;

CREATE UNIQUE INDEX "country_dialing_codes_one_primary_idx"
  ON "country_dialing_codes" ("country_id") WHERE "is_primary" = true;
