-- TRW-010: commercial payments, featured pricing, promotions, provider routes

CREATE TABLE "featured_pricing_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "placement" VARCHAR(40) NOT NULL DEFAULT 'home',
    "price_per_hour" DECIMAL(18,4) NOT NULL,
    "max_slots" INTEGER NOT NULL DEFAULT 7,
    "default_duration_hours" INTEGER NOT NULL DEFAULT 24,
    "min_duration_hours" INTEGER NOT NULL DEFAULT 1,
    "max_duration_hours" INTEGER NOT NULL DEFAULT 168,
    "rank_weight" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "featured_pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "purpose" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "status" VARCHAR(40) NOT NULL DEFAULT 'pending',
    "provider_code" VARCHAR(40) NOT NULL,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "provider_reference" VARCHAR(255),
    "country_id" UUID,
    "failure_reason" VARCHAR(500),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "featured_promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "pricing_rule_id" UUID NOT NULL,
    "placement" VARCHAR(40) NOT NULL,
    "status" VARCHAR(40) NOT NULL DEFAULT 'scheduled',
    "rank_weight" INTEGER NOT NULL DEFAULT 100,
    "duration_hours" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "featured_promotions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_id" UUID NOT NULL,
    "provider_status" VARCHAR(40) NOT NULL,
    "raw_request_meta" JSONB,
    "raw_response_meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_code" VARCHAR(40) NOT NULL,
    "provider_event_id" VARCHAR(255) NOT NULL,
    "payment_id" UUID,
    "signature_valid" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_provider_routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" UUID NOT NULL,
    "provider_code" VARCHAR(40) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_provider_routes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "featured_pricing_rules_country_id_placement_currency_code_key" ON "featured_pricing_rules"("country_id", "placement", "currency_code");
CREATE INDEX "featured_pricing_rules_country_id_is_active_idx" ON "featured_pricing_rules"("country_id", "is_active");
CREATE INDEX "featured_pricing_rules_placement_is_active_idx" ON "featured_pricing_rules"("placement", "is_active");

CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at" DESC);
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at" DESC);
CREATE INDEX "payments_provider_code_provider_reference_idx" ON "payments"("provider_code", "provider_reference");

CREATE UNIQUE INDEX "featured_promotions_payment_id_key" ON "featured_promotions"("payment_id");
CREATE INDEX "featured_promotions_listing_id_status_idx" ON "featured_promotions"("listing_id", "status");
CREATE INDEX "featured_promotions_status_ends_at_idx" ON "featured_promotions"("status", "ends_at");
CREATE INDEX "featured_promotions_status_placement_starts_at_ends_at_idx" ON "featured_promotions"("status", "placement", "starts_at", "ends_at");
CREATE INDEX "featured_promotions_pricing_rule_id_idx" ON "featured_promotions"("pricing_rule_id");

CREATE INDEX "payment_attempts_payment_id_created_at_idx" ON "payment_attempts"("payment_id", "created_at");

CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider_event_id");
CREATE INDEX "webhook_events_payment_id_idx" ON "webhook_events"("payment_id");
CREATE INDEX "webhook_events_provider_code_created_at_idx" ON "webhook_events"("provider_code", "created_at");

CREATE UNIQUE INDEX "payment_provider_routes_country_id_provider_code_key" ON "payment_provider_routes"("country_id", "provider_code");
CREATE INDEX "payment_provider_routes_country_id_is_active_priority_idx" ON "payment_provider_routes"("country_id", "is_active", "priority");

ALTER TABLE "featured_pricing_rules" ADD CONSTRAINT "featured_pricing_rules_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "featured_promotions" ADD CONSTRAINT "featured_promotions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "featured_promotions" ADD CONSTRAINT "featured_promotions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "featured_promotions" ADD CONSTRAINT "featured_promotions_pricing_rule_id_fkey" FOREIGN KEY ("pricing_rule_id") REFERENCES "featured_pricing_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_provider_routes" ADD CONSTRAINT "payment_provider_routes_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
