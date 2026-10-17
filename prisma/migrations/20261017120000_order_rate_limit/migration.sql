-- Online checkout abuse protection: remember the buyer IP so order floods can be
-- rate-limited per IP / phone. Additive only.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "Order_ipAddress_createdAt_idx" ON "Order"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "Order_storeId_phone_createdAt_idx" ON "Order"("storeId", "phone", "createdAt");
