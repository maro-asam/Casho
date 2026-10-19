-- Merchant dashboard UI language (per user).
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ar';
