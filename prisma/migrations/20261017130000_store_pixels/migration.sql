-- Merchant-owned ad pixels (Meta / TikTok / Snap) + server-side conversion API tokens.

-- CreateTable
CREATE TABLE "StorePixelSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "metaPixelId" TEXT,
    "metaCapiTokenEnc" TEXT,
    "metaTestEventCode" TEXT,
    "tiktokPixelId" TEXT,
    "tiktokAccessTokenEnc" TEXT,
    "tiktokTestEventCode" TEXT,
    "snapPixelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePixelSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorePixelSettings_storeId_key" ON "StorePixelSettings"("storeId");

-- AddForeignKey
ALTER TABLE "StorePixelSettings" ADD CONSTRAINT "StorePixelSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
