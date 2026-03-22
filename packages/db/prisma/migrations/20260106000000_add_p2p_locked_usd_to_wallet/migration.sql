-- Add p2pLockedUsd column to wallets table
ALTER TABLE "wallets" ADD COLUMN "p2p_locked_usd" DECIMAL(20,8) NOT NULL DEFAULT 0;
