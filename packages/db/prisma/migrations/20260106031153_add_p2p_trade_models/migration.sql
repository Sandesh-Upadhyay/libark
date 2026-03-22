-- CreateEnum
CREATE TYPE "p2p_trade_status" AS ENUM ('PENDING', 'MATCHED', 'PAYMENT_SENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateTable
CREATE TABLE "p2p_trade_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID,
    "amount_usd" DECIMAL(20,8) NOT NULL,
    "fiat_currency" VARCHAR(10) NOT NULL,
    "fiat_amount" DECIMAL(20,8) NOT NULL,
    "exchange_rate" DECIMAL(20,8) NOT NULL,
    "status" "p2p_trade_status" NOT NULL DEFAULT 'PENDING',
    "payment_method" VARCHAR(50),
    "payment_details" TEXT,
    "escrow_amount" DECIMAL(20,8),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p2p_trade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p2p_seller_offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "min_amount_usd" DECIMAL(20,8) NOT NULL,
    "max_amount_usd" DECIMAL(20,8) NOT NULL,
    "fiat_currency" VARCHAR(10) NOT NULL,
    "exchange_rate_margin" DECIMAL(5,2) NOT NULL,
    "payment_methods" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p2p_seller_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "p2p_trade_requests_buyer_id_status_idx" ON "p2p_trade_requests"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "p2p_trade_requests_seller_id_status_idx" ON "p2p_trade_requests"("seller_id", "status");

-- CreateIndex
CREATE INDEX "p2p_trade_requests_status_expires_at_idx" ON "p2p_trade_requests"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "p2p_seller_offers_seller_id_key" ON "p2p_seller_offers"("seller_id");

-- CreateIndex
CREATE INDEX "p2p_seller_offers_fiat_currency_is_active_idx" ON "p2p_seller_offers"("fiat_currency", "is_active");

-- CreateIndex
CREATE INDEX "p2p_seller_offers_is_active_min_amount_usd_max_amount_usd_idx" ON "p2p_seller_offers"("is_active", "min_amount_usd", "max_amount_usd");

-- AddForeignKey
ALTER TABLE "p2p_trade_requests" ADD CONSTRAINT "p2p_trade_requests_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_trade_requests" ADD CONSTRAINT "p2p_trade_requests_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_seller_offers" ADD CONSTRAINT "p2p_seller_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
