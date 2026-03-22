/*
  Warnings:

  - You are about to drop the column `is_active` on the `p2p_offers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "p2p_dispute_status" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER_WIN', 'RESOLVED_SELLER_WIN', 'RESOLVED_SPLIT', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'P2P_TRADE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'P2P_TRADE_MATCHED';
ALTER TYPE "NotificationType" ADD VALUE 'P2P_PAYMENT_SENT';
ALTER TYPE "NotificationType" ADD VALUE 'P2P_TRADE_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'P2P_TRADE_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'P2P_TRADE_TIMEOUT';

-- DropIndex
DROP INDEX "p2p_offers_fiat_currency_is_active_priority_idx";

-- DropIndex
DROP INDEX "p2p_offers_payment_method_fiat_currency_is_active_idx";

-- AlterTable
ALTER TABLE "p2p_offers" DROP COLUMN "is_active",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "fiat_currencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiat_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p2p_buyer_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" UUID NOT NULL,
    "payment_method" "p2p_payment_method_type" NOT NULL,
    "fiat_currency" VARCHAR(10) NOT NULL,
    "min_amount_usd" DECIMAL(20,8) NOT NULL,
    "max_amount_usd" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p2p_buyer_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p2p_disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trade_id" UUID NOT NULL,
    "initiator_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "p2p_dispute_status" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p2p_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fiat_currencies_code_key" ON "fiat_currencies"("code");

-- CreateIndex
CREATE INDEX "fiat_currencies_is_active_idx" ON "fiat_currencies"("is_active");

-- CreateIndex
CREATE INDEX "p2p_buyer_preferences_buyer_id_idx" ON "p2p_buyer_preferences"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "p2p_buyer_preferences_buyer_id_payment_method_fiat_currency_key" ON "p2p_buyer_preferences"("buyer_id", "payment_method", "fiat_currency");

-- CreateIndex
CREATE UNIQUE INDEX "p2p_disputes_trade_id_key" ON "p2p_disputes"("trade_id");

-- CreateIndex
CREATE INDEX "p2p_disputes_status_idx" ON "p2p_disputes"("status");

-- CreateIndex
CREATE INDEX "p2p_disputes_initiator_id_idx" ON "p2p_disputes"("initiator_id");

-- CreateIndex
CREATE INDEX "p2p_offers_payment_method_fiat_currency_isActive_idx" ON "p2p_offers"("payment_method", "fiat_currency", "isActive");

-- CreateIndex
CREATE INDEX "p2p_offers_fiat_currency_isActive_priority_idx" ON "p2p_offers"("fiat_currency", "isActive", "priority");

-- AddForeignKey
ALTER TABLE "p2p_buyer_preferences" ADD CONSTRAINT "p2p_buyer_preferences_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_disputes" ADD CONSTRAINT "p2p_disputes_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "p2p_trade_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_disputes" ADD CONSTRAINT "p2p_disputes_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_disputes" ADD CONSTRAINT "p2p_disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
