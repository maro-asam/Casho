-- Storefront legal pages (lib/store-policies) + optional terms consent at checkout.
ALTER TABLE "StoreSettings" ADD COLUMN "policies" JSONB,
ADD COLUMN "requireTermsAtCheckout" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
