-- Apps the merchant installed from the dashboard (lib/apps/catalog.ts).
-- CreateTable
CREATE TABLE "StoreApp" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credentials" TEXT,
    "settings" JSONB,
    "callbackTokenHash" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreApp_callbackTokenHash_key" ON "StoreApp"("callbackTokenHash");

-- CreateIndex
CREATE INDEX "StoreApp_storeId_idx" ON "StoreApp"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreApp_storeId_appId_key" ON "StoreApp"("storeId", "appId");

-- AddForeignKey
ALTER TABLE "StoreApp" ADD CONSTRAINT "StoreApp_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

