-- TRW-008: search indexes (trigram + FTS + filter/sort helpers)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search vector (title weighted higher than description)
ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS "listings_search_vector_idx"
  ON "listings" USING GIN ("search_vector");

CREATE INDEX IF NOT EXISTS "listings_title_trgm_idx"
  ON "listings" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "listings_description_trgm_idx"
  ON "listings" USING GIN ("description" gin_trgm_ops);

-- Filter / sort helpers (also expressed in Prisma schema)
CREATE INDEX IF NOT EXISTS "listings_city_id_status_idx"
  ON "listings" ("city_id", "status");

CREATE INDEX IF NOT EXISTS "listings_status_price_amount_idx"
  ON "listings" ("status", "price_amount");

CREATE INDEX IF NOT EXISTS "listings_status_featured_published_idx"
  ON "listings" ("status", "is_featured_cached", "published_at" DESC);

CREATE INDEX IF NOT EXISTS "listings_status_view_count_idx"
  ON "listings" ("status", "view_count" DESC);

CREATE INDEX IF NOT EXISTS "listing_attribute_values_attr_text_idx"
  ON "listing_attribute_values" ("attribute_definition_id", "value_text");

CREATE INDEX IF NOT EXISTS "listing_attribute_values_attr_number_idx"
  ON "listing_attribute_values" ("attribute_definition_id", "value_number");

CREATE INDEX IF NOT EXISTS "listing_attribute_values_attr_bool_idx"
  ON "listing_attribute_values" ("attribute_definition_id", "value_bool");
