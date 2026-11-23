-- The currency a storefront shows its prices in (ISO 4217). Every existing store stays in EGP.
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "storeCurrency" TEXT NOT NULL DEFAULT 'EGP';
