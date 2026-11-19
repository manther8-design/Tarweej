-- TRW-006: Catalog — hierarchical categories + dynamic attributes

CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "listing_type" VARCHAR(40) NOT NULL DEFAULT 'marketplace',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attribute_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "data_type" VARCHAR(40) NOT NULL,
    "unit" VARCHAR(40),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "validation_json" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "category_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "attribute_definition_id" UUID NOT NULL,
    "is_required_override" BOOLEAN,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attribute_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attribute_definition_id" UUID NOT NULL,
    "value" VARCHAR(120) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribute_options_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");
CREATE INDEX "categories_listing_type_is_active_idx" ON "categories"("listing_type", "is_active");
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");
CREATE INDEX "categories_deleted_at_idx" ON "categories"("deleted_at");

CREATE UNIQUE INDEX "attribute_definitions_code_key" ON "attribute_definitions"("code");
CREATE INDEX "attribute_definitions_data_type_idx" ON "attribute_definitions"("data_type");
CREATE INDEX "attribute_definitions_is_active_idx" ON "attribute_definitions"("is_active");

CREATE UNIQUE INDEX "category_attributes_category_id_attribute_definition_id_key" ON "category_attributes"("category_id", "attribute_definition_id");
CREATE INDEX "category_attributes_attribute_definition_id_idx" ON "category_attributes"("attribute_definition_id");
CREATE INDEX "category_attributes_category_id_sort_order_idx" ON "category_attributes"("category_id", "sort_order");

CREATE UNIQUE INDEX "attribute_options_attribute_definition_id_value_key" ON "attribute_options"("attribute_definition_id", "value");
CREATE INDEX "attribute_options_attribute_definition_id_sort_order_idx" ON "attribute_options"("attribute_definition_id", "sort_order");

-- Foreign keys
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_definition_id_fkey" FOREIGN KEY ("attribute_definition_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attribute_options" ADD CONSTRAINT "attribute_options_attribute_definition_id_fkey" FOREIGN KEY ("attribute_definition_id") REFERENCES "attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
