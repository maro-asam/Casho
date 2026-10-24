-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "emailCustomerOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNewOrders" BOOLEAN NOT NULL DEFAULT true;
