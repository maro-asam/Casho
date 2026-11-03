-- Merchant switch: keep serving slug.casho.store, or redirect it to the live custom domain.
-- AlterTable
ALTER TABLE "Store" ADD COLUMN "subdomainEnabled" BOOLEAN NOT NULL DEFAULT true;
