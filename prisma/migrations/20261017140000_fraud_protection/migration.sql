-- Fake-order / return protection: number reputation, store blocklist,
-- phone-code confirmation for cash orders, refused-delivery flag. Additive only.

-- CreateEnum
CREATE TYPE "OrderRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "OrderConfirmationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "OrderOtpMode" AS ENUM ('OFF', 'RISKY', 'ALL');

-- AlterTable
ALTER TABLE "Order"
    ADD COLUMN "riskLevel" "OrderRiskLevel",
    ADD COLUMN "riskSignals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "confirmationStatus" "OrderConfirmationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN "confirmedAt" TIMESTAMP(3),
    ADD COLUMN "otpSentCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "otpLastSentAt" TIMESTAMP(3),
    ADD COLUMN "returnedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StoreSettings"
    ADD COLUMN "orderOtpMode" "OrderOtpMode" NOT NULL DEFAULT 'OFF',
    ADD COLUMN "blockHighRiskOrders" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BlockedPhone" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "reason" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedPhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedPhone_storeId_phone_key" ON "BlockedPhone"("storeId", "phone");

-- CreateIndex
CREATE INDEX "Order_phone_idx" ON "Order"("phone");

-- AddForeignKey
ALTER TABLE "BlockedPhone" ADD CONSTRAINT "BlockedPhone_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
