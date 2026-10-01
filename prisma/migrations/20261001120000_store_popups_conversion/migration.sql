-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN "conversionConfig" JSONB;

-- CreateTable
CREATE TABLE "StorePopup" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'discount',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePopup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorePopup_storeId_isActive_idx" ON "StorePopup"("storeId", "isActive");

-- AddForeignKey
ALTER TABLE "StorePopup" ADD CONSTRAINT "StorePopup_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
