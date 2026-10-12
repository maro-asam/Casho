-- Sales team: referral attribution, tiered commissions, payouts (lib/sales).
-- Additive only: one new UserRole value and new tables. See docs/sales/commissions.md.
-- CreateEnum
CREATE TYPE "SalesRepStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "SalesAttributionSource" AS ENUM ('SIGNUP_LINK', 'ADMIN');

-- CreateEnum
CREATE TYPE "SalesCommissionKind" AS ENUM ('ACQUISITION', 'RENEWAL');

-- CreateEnum
CREATE TYPE "SalesCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'ON_HOLD', 'REJECTED', 'REVERSED', 'PAID');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SALES';

-- CreateTable
CREATE TABLE "SalesRep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SalesRepStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesRep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesAttribution" (
    "id" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "originalSalesRepId" TEXT NOT NULL,
    "source" "SalesAttributionSource" NOT NULL,
    "referralCode" TEXT,
    "signedUpAt" TIMESTAMP(3) NOT NULL,
    "acquiredAt" TIMESTAMP(3),
    "acquisitionTxId" TEXT,
    "cohortMonth" TEXT,
    "eligibleUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesAttributionChange" (
    "id" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "fromSalesRepId" TEXT,
    "toSalesRepId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesAttributionChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommissionRule" (
    "id" TEXT NOT NULL,
    "starterRateBps" INTEGER NOT NULL,
    "growthRateBps" INTEGER NOT NULL,
    "proRateBps" INTEGER NOT NULL,
    "starterMaxPosition" INTEGER NOT NULL,
    "growthMaxPosition" INTEGER NOT NULL,
    "renewalRateBps" INTEGER NOT NULL,
    "eligibilityMonths" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesCommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommission" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "balanceTransactionId" TEXT NOT NULL,
    "kind" "SalesCommissionKind" NOT NULL,
    "status" "SalesCommissionStatus" NOT NULL,
    "basisAmount" INTEGER NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "tier" TEXT,
    "customerPosition" INTEGER,
    "ruleId" TEXT NOT NULL,
    "cohortMonth" TEXT NOT NULL,
    "eligibleUntil" TIMESTAMP(3) NOT NULL,
    "paymentAt" TIMESTAMP(3) NOT NULL,
    "statusReason" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommissionAdjustment" (
    "id" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "source" TEXT NOT NULL,
    "balanceTransactionId" TEXT,
    "reason" TEXT NOT NULL,
    "actorUserId" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesCommissionAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPayout" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "salesRepId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesRep_userId_key" ON "SalesRep"("userId");

-- CreateIndex
CREATE INDEX "SalesRep_status_idx" ON "SalesRep"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesAttribution_customerUserId_key" ON "SalesAttribution"("customerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesAttribution_acquisitionTxId_key" ON "SalesAttribution"("acquisitionTxId");

-- CreateIndex
CREATE INDEX "SalesAttribution_salesRepId_acquiredAt_idx" ON "SalesAttribution"("salesRepId", "acquiredAt");

-- CreateIndex
CREATE INDEX "SalesAttribution_salesRepId_eligibleUntil_idx" ON "SalesAttribution"("salesRepId", "eligibleUntil");

-- CreateIndex
CREATE INDEX "SalesAttributionChange_attributionId_createdAt_idx" ON "SalesAttributionChange"("attributionId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesCommissionRule_effectiveFrom_idx" ON "SalesCommissionRule"("effectiveFrom");

-- CreateIndex
CREATE INDEX "SalesCommission_salesRepId_status_createdAt_idx" ON "SalesCommission"("salesRepId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesCommission_customerUserId_paymentAt_idx" ON "SalesCommission"("customerUserId", "paymentAt");

-- CreateIndex
CREATE INDEX "SalesCommission_status_createdAt_idx" ON "SalesCommission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesCommission_payoutId_idx" ON "SalesCommission"("payoutId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCommission_balanceTransactionId_kind_key" ON "SalesCommission"("balanceTransactionId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCommissionAdjustment_balanceTransactionId_key" ON "SalesCommissionAdjustment"("balanceTransactionId");

-- CreateIndex
CREATE INDEX "SalesCommissionAdjustment_salesRepId_createdAt_idx" ON "SalesCommissionAdjustment"("salesRepId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesCommissionAdjustment_commissionId_idx" ON "SalesCommissionAdjustment"("commissionId");

-- CreateIndex
CREATE INDEX "SalesCommissionAdjustment_payoutId_idx" ON "SalesCommissionAdjustment"("payoutId");

-- CreateIndex
CREATE INDEX "SalesPayout_salesRepId_paidAt_idx" ON "SalesPayout"("salesRepId", "paidAt");

-- CreateIndex
CREATE INDEX "SalesAuditLog_entityType_entityId_createdAt_idx" ON "SalesAuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesAuditLog_salesRepId_createdAt_idx" ON "SalesAuditLog"("salesRepId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesAuditLog_action_createdAt_idx" ON "SalesAuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "SalesRep" ADD CONSTRAINT "SalesRep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesAttribution" ADD CONSTRAINT "SalesAttribution_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesAttribution" ADD CONSTRAINT "SalesAttribution_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesAttributionChange" ADD CONSTRAINT "SalesAttributionChange_attributionId_fkey" FOREIGN KEY ("attributionId") REFERENCES "SalesAttribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_attributionId_fkey" FOREIGN KEY ("attributionId") REFERENCES "SalesAttribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "SalesCommissionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SalesPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommissionAdjustment" ADD CONSTRAINT "SalesCommissionAdjustment_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "SalesCommission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommissionAdjustment" ADD CONSTRAINT "SalesCommissionAdjustment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SalesPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPayout" ADD CONSTRAINT "SalesPayout_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Seed the approved rule set: 17% (customers 1–10), 20% (11–20), 22% (21+),
-- 6% renewals, 6 calendar-month eligibility window.
INSERT INTO "SalesCommissionRule" ("id", "starterRateBps", "growthRateBps", "proRateBps", "starterMaxPosition", "growthMaxPosition", "renewalRateBps", "eligibilityMonths", "effectiveFrom", "note")
VALUES ('sales-rule-initial', 1700, 2000, 2200, 10, 20, 600, 6, CURRENT_TIMESTAMP, 'القواعد الأولى المعتمدة');
