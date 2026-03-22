-- CreateEnum
CREATE TYPE "p2p_payment_method_type" AS ENUM ('BANK_TRANSFER', 'PAYPAY', 'PAYPAL', 'WISE', 'LINE_PAY', 'RAKUTEN_PAY');

-- CreateTable
CREATE TABLE "p2p_offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "payment_method" "p2p_payment_method_type" NOT NULL,
    "min_amount_usd" DECIMAL(20,8) NOT NULL,
    "max_amount_usd" DECIMAL(20,8) NOT NULL,
    "fiat_currency" VARCHAR(10) NOT NULL,
    "exchange_rate_margin" DECIMAL(20,8) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "instructions" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p2p_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "p2p_offers_seller_id_idx" ON "p2p_offers"("seller_id");

-- CreateIndex
CREATE INDEX "p2p_offers_payment_method_fiat_currency_is_active_idx" ON "p2p_offers"("payment_method", "fiat_currency", "is_active");

-- CreateIndex
CREATE INDEX "p2p_offers_fiat_currency_is_active_priority_idx" ON "p2p_offers"("fiat_currency", "is_active", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "p2p_offers_seller_id_payment_method_fiat_currency_key" ON "p2p_offers"("seller_id", "payment_method", "fiat_currency");

-- AddForeignKey
ALTER TABLE "p2p_offers" ADD CONSTRAINT "p2p_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "p2p_trade_requests" ADD COLUMN "offer_id" UUID;

-- CreateIndex
CREATE INDEX "p2p_trade_requests_offer_id_idx" ON "p2p_trade_requests"("offer_id");

-- AddForeignKey
ALTER TABLE "p2p_trade_requests" ADD CONSTRAINT "p2p_trade_requests_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "p2p_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "p2p_trade_requests" ALTER COLUMN "payment_method" TYPE "p2p_payment_method_type" USING "payment_method"::"p2p_payment_method_type";

-- AlterTable
ALTER TABLE "p2p_seller_offers" ALTER COLUMN "payment_methods" TYPE "p2p_payment_method_type"[] USING "payment_methods"::"p2p_payment_method_type"[];
