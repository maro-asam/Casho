-- Merchant can pause the storefront until a given time (lib/store/pause.ts).
ALTER TABLE "StoreSettings" ADD COLUMN "pausedUntil" TIMESTAMP(3),
ADD COLUMN "pauseMessage" TEXT,
ADD COLUMN "pauseCountdown" BOOLEAN NOT NULL DEFAULT true;
