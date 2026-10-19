-- Shipping prices per governorate. Additive only.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "governorate" TEXT;

-- CreateTable
CREATE TABLE "ShippingGovernorateRate" (
    "id" TEXT NOT NULL,
    "shippingMethodId" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "ShippingGovernorateRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingGovernorateRate_shippingMethodId_governorate_key" ON "ShippingGovernorateRate"("shippingMethodId", "governorate");

-- AddForeignKey
ALTER TABLE "ShippingGovernorateRate" ADD CONSTRAINT "ShippingGovernorateRate_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "ShippingMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
