-- AlterEnum
ALTER TYPE "TopupMethod" ADD VALUE 'PAYMOB';

-- AlterTable
ALTER TABLE "StorePaymentSettings" ADD COLUMN     "paymobEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymobSecretKeyEncrypted" TEXT,
ADD COLUMN     "paymobSecretKeyHint" TEXT,
ADD COLUMN     "paymobPublicKey" TEXT,
ADD COLUMN     "paymobHmacSecretEncrypted" TEXT,
ADD COLUMN     "paymobCardIntegrationId" INTEGER,
ADD COLUMN     "paymobWalletIntegrationId" INTEGER;
