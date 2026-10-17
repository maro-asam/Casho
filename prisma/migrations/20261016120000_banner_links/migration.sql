-- Banners: click destination, copy, mobile art, manual order, schedule, click count.
-- Additive only. Existing banners keep linking to all products (old hard-coded behaviour)
-- and keep their current order (newest first).

-- CreateEnum
CREATE TYPE "BannerLinkType" AS ENUM ('NONE', 'PRODUCTS', 'FEATURED', 'CATEGORY', 'PRODUCT', 'SEARCH', 'PAGE', 'WHATSAPP', 'URL');

-- AlterTable
ALTER TABLE "Banner"
    ADD COLUMN "subtitle" TEXT,
    ADD COLUMN "ctaLabel" TEXT,
    ADD COLUMN "mobileImage" TEXT,
    ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "linkType" "BannerLinkType" NOT NULL DEFAULT 'PRODUCTS',
    ADD COLUMN "linkCategoryId" TEXT,
    ADD COLUMN "linkProductId" TEXT,
    ADD COLUMN "linkValue" TEXT,
    ADD COLUMN "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "startsAt" TIMESTAMP(3),
    ADD COLUMN "endsAt" TIMESTAMP(3),
    ADD COLUMN "clicks" INTEGER NOT NULL DEFAULT 0;

-- Backfill: freeze today's order (newest first) into explicit positions.
UPDATE "Banner" AS b
SET "position" = r.rn
FROM (
    SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "storeId" ORDER BY "createdAt" DESC, "id" ASC) - 1)::INTEGER AS rn
    FROM "Banner"
) AS r
WHERE b."id" = r."id";

-- CreateIndex
CREATE INDEX "Banner_storeId_position_idx" ON "Banner"("storeId", "position");

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_linkCategoryId_fkey" FOREIGN KEY ("linkCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_linkProductId_fkey" FOREIGN KEY ("linkProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
