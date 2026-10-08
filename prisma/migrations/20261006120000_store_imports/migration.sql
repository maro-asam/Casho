-- Store migration imports (Shopify). See docs/integrations/shopify-import.md.

-- CreateEnum
CREATE TYPE "ImportProvider" AS ENUM ('SHOPIFY');

-- CreateEnum
CREATE TYPE "ImportConnectionStatus" AS ENUM ('ACTIVE', 'NEEDS_RECONNECT', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ImportJobKind" AS ENUM ('FULL', 'RETRY');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'CANCELED');

-- CreateEnum
CREATE TYPE "ImportEntityType" AS ENUM ('COLLECTION', 'PRODUCT', 'VARIANT', 'CUSTOMER', 'ORDER');

-- CreateTable
CREATE TABLE "ImportConnection" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "provider" "ImportProvider" NOT NULL,
    "externalShopId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "currencyCode" TEXT,
    "accessTokenEnc" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenEnc" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ImportConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "connectedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" "ImportProvider" NOT NULL,
    "externalShopId" TEXT NOT NULL,
    "kind" "ImportJobKind" NOT NULL DEFAULT 'FULL',
    "retryOfJobId" TEXT,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "entities" "ImportEntityType"[],
    "currentEntity" "ImportEntityType",
    "cursor" TEXT,
    "progress" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "lockToken" TEXT,
    "lastError" TEXT,
    "startedByUserId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRecordMap" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "provider" "ImportProvider" NOT NULL,
    "externalShopId" TEXT NOT NULL,
    "entityType" "ImportEntityType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRecordMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportItemError" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "entityType" "ImportEntityType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "label" TEXT,
    "message" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportItemError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportConnection_provider_externalShopId_idx" ON "ImportConnection"("provider", "externalShopId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportConnection_storeId_provider_key" ON "ImportConnection"("storeId", "provider");

-- CreateIndex
CREATE INDEX "ImportJob_status_nextRunAt_idx" ON "ImportJob"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "ImportJob_storeId_createdAt_idx" ON "ImportJob"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportRecordMap_storeId_entityType_localId_idx" ON "ImportRecordMap"("storeId", "entityType", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRecordMap_storeId_provider_externalShopId_entityType__key" ON "ImportRecordMap"("storeId", "provider", "externalShopId", "entityType", "externalId");

-- CreateIndex
CREATE INDEX "ImportItemError_jobId_resolvedAt_idx" ON "ImportItemError"("jobId", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportItemError_jobId_entityType_externalId_key" ON "ImportItemError"("jobId", "entityType", "externalId");

-- AddForeignKey
ALTER TABLE "ImportConnection" ADD CONSTRAINT "ImportConnection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ImportConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecordMap" ADD CONSTRAINT "ImportRecordMap_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportItemError" ADD CONSTRAINT "ImportItemError_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- At most one unfinished import per store and provider. Enforced by the database so a
-- double click, a refresh or two tabs can never start two parallel imports.
-- (Partial index — not expressible in schema.prisma, same as "Branch_one_default_per_store".)
CREATE UNIQUE INDEX "ImportJob_one_active_per_store" ON "ImportJob"("storeId", "provider")
  WHERE "status" IN ('QUEUED', 'RUNNING', 'PAUSED');
