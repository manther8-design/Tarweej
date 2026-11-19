-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "user_agent" VARCHAR(512),
ADD COLUMN IF NOT EXISTS "ip_address" VARCHAR(64),
ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE IF NOT EXISTS "phone_otp_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_e164" VARCHAR(20) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "purpose" VARCHAR(40) NOT NULL DEFAULT 'login',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "last_sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "phone_otp_challenges_phone_e164_purpose_idx" ON "phone_otp_challenges"("phone_e164", "purpose");
CREATE INDEX IF NOT EXISTS "phone_otp_challenges_expires_at_idx" ON "phone_otp_challenges"("expires_at");
