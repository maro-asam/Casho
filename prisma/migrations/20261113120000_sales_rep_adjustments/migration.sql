-- Sales rep bonuses & deductions (admin-entered, not tied to a commission). Additive only.
-- CreateEnum
CREATE TYPE "SalesRepAdjustmentKind" AS ENUM ('BONUS', 'DEDUCTION');

-- CreateTable
CREATE TABLE "SalesRepAdjustment" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "kind" "SalesRepAdjustmentKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "reason" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "canceledById" TEXT,
    "cancelReason" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesRepAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesRepAdjustment_salesRepId_createdAt_idx" ON "SalesRepAdjustment"("salesRepId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesRepAdjustment_payoutId_idx" ON "SalesRepAdjustment"("payoutId");

-- AddForeignKey
ALTER TABLE "SalesRepAdjustment" ADD CONSTRAINT "SalesRepAdjustment_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRepAdjustment" ADD CONSTRAINT "SalesRepAdjustment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SalesPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

