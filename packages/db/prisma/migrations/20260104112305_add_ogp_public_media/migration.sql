-- CreateTable
CREATE TABLE "ogp_public_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_id" UUID NOT NULL,
    "bucket" VARCHAR(100) NOT NULL,
    "backend_id" VARCHAR(100) NOT NULL,
    "ogp_key" VARCHAR(500) NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "ext" VARCHAR(10) NOT NULL,
    "variant" VARCHAR(50) NOT NULL,
    "salt" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ogp_public_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ogp_public_media_media_id_idx" ON "ogp_public_media"("media_id");

-- CreateIndex
CREATE INDEX "ogp_public_media_ogp_key_idx" ON "ogp_public_media"("ogp_key");

-- CreateIndex
CREATE INDEX "ogp_public_media_content_hash_idx" ON "ogp_public_media"("content_hash");

-- CreateIndex
CREATE INDEX "ogp_public_media_backend_id_idx" ON "ogp_public_media"("backend_id");

-- CreateIndex
CREATE INDEX "ogp_public_media_created_at_idx" ON "ogp_public_media"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ogp_public_media_media_id_variant_key" ON "ogp_public_media"("media_id", "variant");

-- AddForeignKey
ALTER TABLE "ogp_public_media" ADD CONSTRAINT "ogp_public_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
