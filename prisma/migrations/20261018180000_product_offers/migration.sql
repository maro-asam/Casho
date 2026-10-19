-- Upsell / cross-sell / downsell offers. Cart and order lines remember the
-- offer that sold them (pricing + revenue per offer). No data is dropped.

-- CreateEnum
CREATE TYPE "ProductOfferType" AS ENUM ('UPSELL', 'CROSS_SELL', 'DOWNSELL');

-- CreateEnum
CREATE TYPE "OfferDiscountType" AS ENUM ('NONE', 'PERCENTAGE', 'FIXED');

-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "ProductOfferType" NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "triggerProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "offerProductId" TEXT NOT NULL,
    "discountType" "OfferDiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "accepts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "offerId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "offerId" TEXT;

-- CreateIndex
CREATE INDEX "ProductOffer_storeId_isActive_type_idx" ON "ProductOffer"("storeId", "isActive", "type");

-- CreateIndex
CREATE INDEX "ProductOffer_offerProductId_idx" ON "ProductOffer"("offerProductId");

-- CreateIndex
CREATE INDEX "OrderItem_offerId_idx" ON "OrderItem"("offerId");

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_offerProductId_fkey" FOREIGN KEY ("offerProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
