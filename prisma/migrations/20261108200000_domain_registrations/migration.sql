-- CreateEnum
CREATE TYPE "DomainRegistrationStatus" AS ENUM ('PENDING', 'ACTIVE', 'FAILED', 'EXPIRED');

-- AlterEnum (domain purchases/renewals get their own ledger types)
ALTER TYPE "BalanceTransactionType" ADD VALUE 'DOMAIN_CHARGE';
ALTER TYPE "BalanceTransactionType" ADD VALUE 'DOMAIN_REFUND';

-- CreateTable
CREATE TABLE "DomainRegistration" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "DomainRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT,
    "costUsdCents" INTEGER NOT NULL,
    "renewalCostUsdCents" INTEGER NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "usdRate" INTEGER NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "renewedAt" TIMESTAMP(3),
    "renewalNoticeAt" TIMESTAMP(3),
    "renewalFailedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "usdRate" INTEGER NOT NULL DEFAULT 5000,
    "markupBps" INTEGER NOT NULL DEFAULT 2000,
    "registrant" JSONB,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DomainRegistration_domain_key" ON "DomainRegistration"("domain");

-- CreateIndex
CREATE INDEX "DomainRegistration_storeId_idx" ON "DomainRegistration"("storeId");

-- CreateIndex
CREATE INDEX "DomainRegistration_status_expiresAt_idx" ON "DomainRegistration"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "DomainRegistration" ADD CONSTRAINT "DomainRegistration_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

