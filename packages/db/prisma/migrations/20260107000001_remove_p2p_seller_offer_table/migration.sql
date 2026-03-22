-- Drop P2PSellerOffer table (data has been migrated to P2POffer)
DROP TABLE IF EXISTS "p2p_seller_offers" CASCADE;

-- Drop the foreign key constraint from users table
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "p2p_seller_offers_seller_id_fkey";
