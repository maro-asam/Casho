-- Sales rep withdrawal requests ("طلب سحب الأرباح"). Additive only.
-- CreateEnum
CREATE TYPE "SalesWithdrawalStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "SalesWithdrawalRequest" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "status" "SalesWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "method" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "note" TEXT,
    "payoutId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesWithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesWithdrawalRequest_payoutId_key" ON "SalesWithdrawalRequest"("payoutId");

-- CreateIndex
CREATE INDEX "SalesWithdrawalRequest_salesRepId_createdAt_idx" ON "SalesWithdrawalRequest"("salesRepId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesWithdrawalRequest_status_createdAt_idx" ON "SalesWithdrawalRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SalesWithdrawalRequest" ADD CONSTRAINT "SalesWithdrawalRequest_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesWithdrawalRequest" ADD CONSTRAINT "SalesWithdrawalRequest_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SalesPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
