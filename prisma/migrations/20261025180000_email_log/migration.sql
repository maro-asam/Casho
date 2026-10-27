-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "emailStoreAlerts" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "kind" TEXT NOT NULL,
    "refId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_storeId_createdAt_idx" ON "EmailLog"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_kind_refId_createdAt_idx" ON "EmailLog"("kind", "refId", "createdAt");
