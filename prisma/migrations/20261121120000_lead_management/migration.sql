-- Lead Management (lib/leads): leads, their timeline, follow-ups, assignment history,
-- the Import Center and conversion matches. Additive only: new enums and tables, plus
-- foreign keys from them to User / Store / SalesRep (ON DELETE SET NULL or CASCADE).
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ASSIGNED', 'CONTACTED', 'INTERESTED', 'DEMO_SCHEDULED', 'NEGOTIATION', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'HOT');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'GOOGLE_MAPS', 'WEBSITE', 'REFERRAL', 'EVENT', 'COLD_OUTREACH', 'WALK_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadBusinessSize" AS ENUM ('STARTING', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CREATED', 'IMPORTED', 'UPDATED', 'ASSIGNED', 'REASSIGNED', 'UNASSIGNED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'DEMO', 'NOTE', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED', 'FOLLOW_UP_RESCHEDULED', 'FOLLOW_UP_CANCELED', 'LINKED', 'UNLINKED', 'CONVERTED', 'LOST', 'REOPENED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- CreateEnum
CREATE TYPE "LeadFollowUpStatus" AS ENUM ('PENDING', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "LeadLinkSource" AS ENUM ('AUTO_EMAIL', 'AUTO_PHONE', 'ADMIN');

-- CreateEnum
CREATE TYPE "LeadImportStatus" AS ENUM ('DRAFT', 'READY', 'RUNNING', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "LeadImportRowStatus" AS ENUM ('VALID', 'INVALID', 'DUPLICATE_FILE', 'DUPLICATE_EXISTING', 'IMPORTED', 'UPDATED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "LeadDuplicateMode" AS ENUM ('SKIP', 'FILL_BLANKS');

-- CreateEnum
CREATE TYPE "LeadMatchStatus" AS ENUM ('OPEN', 'LINKED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "normalizedWhatsapp" TEXT,
    "email" TEXT,
    "category" TEXT,
    "city" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "businessSize" "LeadBusinessSize",
    "source" "LeadSource",
    "sourceDetails" TEXT,
    "notes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" "LeadPriority" NOT NULL DEFAULT 'LOW',
    "priorityLocked" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "assignedRepId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "lostNote" TEXT,
    "lostAt" TIMESTAMP(3),
    "customerUserId" TEXT,
    "customerStoreId" TEXT,
    "linkSource" "LeadLinkSource",
    "linkedAt" TIMESTAMP(3),
    "linkedById" TEXT,
    "convertedAt" TIMESTAMP(3),
    "conversionTxId" TEXT,
    "importId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "archivedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "description" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "reached" BOOLEAN,
    "actorUserId" TEXT,
    "actorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "salesRepId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "LeadFollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "outcome" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromRepId" TEXT,
    "toRepId" TEXT,
    "assignedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadImport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" "LeadImportStatus" NOT NULL DEFAULT 'DRAFT',
    "duplicateMode" "LeadDuplicateMode" NOT NULL DEFAULT 'SKIP',
    "assignRepId" TEXT,
    "defaultSource" "LeadSource",
    "mapping" JSONB,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "fileDuplicateRows" INTEGER NOT NULL DEFAULT 0,
    "existingDuplicateRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "updatedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadImportRow" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "normalizedPhone" TEXT,
    "email" TEXT,
    "status" "LeadImportRowStatus" NOT NULL,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "existingLeadId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadConversionMatch" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT,
    "matchedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeadMatchStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadConversionMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_customerUserId_key" ON "Lead"("customerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_conversionTxId_key" ON "Lead"("conversionTxId");

-- CreateIndex
CREATE INDEX "Lead_normalizedPhone_idx" ON "Lead"("normalizedPhone");

-- CreateIndex
CREATE INDEX "Lead_normalizedWhatsapp_idx" ON "Lead"("normalizedWhatsapp");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_assignedRepId_status_idx" ON "Lead"("assignedRepId", "status");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Lead_convertedAt_idx" ON "Lead"("convertedAt");

-- CreateIndex
CREATE INDEX "Lead_customerStoreId_idx" ON "Lead"("customerStoreId");

-- CreateIndex
CREATE INDEX "Lead_importId_idx" ON "Lead"("importId");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_actorUserId_createdAt_idx" ON "LeadActivity"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_type_createdAt_idx" ON "LeadActivity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_salesRepId_status_dueAt_idx" ON "LeadFollowUp"("salesRepId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_status_dueAt_idx" ON "LeadFollowUp"("status", "dueAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_leadId_status_idx" ON "LeadFollowUp"("leadId", "status");

-- CreateIndex
CREATE INDEX "LeadAssignment_leadId_createdAt_idx" ON "LeadAssignment"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadAssignment_toRepId_createdAt_idx" ON "LeadAssignment"("toRepId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadImport_createdAt_idx" ON "LeadImport"("createdAt");

-- CreateIndex
CREATE INDEX "LeadImport_fileHash_idx" ON "LeadImport"("fileHash");

-- CreateIndex
CREATE INDEX "LeadImportRow_importId_status_idx" ON "LeadImportRow"("importId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeadImportRow_importId_rowNumber_key" ON "LeadImportRow"("importId", "rowNumber");

-- CreateIndex
CREATE INDEX "LeadConversionMatch_status_createdAt_idx" ON "LeadConversionMatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LeadConversionMatch_userId_idx" ON "LeadConversionMatch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadConversionMatch_leadId_userId_key" ON "LeadConversionMatch"("leadId", "userId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedRepId_fkey" FOREIGN KEY ("assignedRepId") REFERENCES "SalesRep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerStoreId_fkey" FOREIGN KEY ("customerStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_importId_fkey" FOREIGN KEY ("importId") REFERENCES "LeadImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadImportRow" ADD CONSTRAINT "LeadImportRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "LeadImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadConversionMatch" ADD CONSTRAINT "LeadConversionMatch_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadConversionMatch" ADD CONSTRAINT "LeadConversionMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

