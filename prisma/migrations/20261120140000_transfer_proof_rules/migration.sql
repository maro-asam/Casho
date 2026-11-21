-- The merchant picks what a manual transfer must come with at checkout (both, as before, by default).
ALTER TABLE "StorePaymentSettings" ADD COLUMN IF NOT EXISTS "requireTransferPayer" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StorePaymentSettings" ADD COLUMN IF NOT EXISTS "requireTransferScreenshot" BOOLEAN NOT NULL DEFAULT true;
