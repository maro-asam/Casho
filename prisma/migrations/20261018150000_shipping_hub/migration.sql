-- Shipping hub: carriers come from a code registry (lib/shipping/carriers.ts)
-- instead of an enum, manual carriers need no credentials, and shipments keep
-- their COD, tracking link and timeline. No data is dropped.

-- AlterTable
ALTER TABLE "ShippingIntegration" ALTER COLUMN "provider" TYPE TEXT USING "provider"::text;
ALTER TABLE "ShippingIntegration" ALTER COLUMN "credentials" DROP NOT NULL;
ALTER TABLE "ShippingIntegration" ADD COLUMN "settings" JSONB;

-- DropEnum
DROP TYPE "ShippingProvider";

-- AlterTable
ALTER TABLE "Shipment"
    ADD COLUMN "codAmount" INTEGER,
    ADD COLUMN "codCollectedAt" TIMESTAMP(3),
    ADD COLUMN "labelUrl" TEXT,
    ADD COLUMN "trackingUrl" TEXT,
    ADD COLUMN "weightKg" DOUBLE PRECISION,
    ADD COLUMN "notes" TEXT,
    ADD COLUMN "events" JSONB,
    ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Shipment_storeId_status_createdAt_idx" ON "Shipment"("storeId", "status", "createdAt");
