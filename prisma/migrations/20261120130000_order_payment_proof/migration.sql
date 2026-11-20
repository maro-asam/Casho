-- Manual transfer proof sent at checkout: who paid and the screenshot.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentPayer" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
