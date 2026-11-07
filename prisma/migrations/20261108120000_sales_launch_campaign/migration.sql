-- Sales launch offer (campaigns) + announcements board. Additive only: one enum
-- value, two nullable columns, three new tables, one seeded campaign.

-- AlterEnum
ALTER TYPE "SalesCommissionKind" ADD VALUE 'BONUS';

-- AlterTable
ALTER TABLE "SalesCommission" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "campaignReason" TEXT;

-- CreateTable
CREATE TABLE "SalesCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "baseRateBps" INTEGER NOT NULL,
    "pharmacyRateBps" INTEGER NOT NULL,
    "posRateBps" INTEGER NOT NULL,
    "bonusTarget" INTEGER NOT NULL,
    "bonusAmount" INTEGER NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 6,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCampaignMember" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "bonusAwardedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesCampaignMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'INFO',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesCampaign_startsAt_endsAt_idx" ON "SalesCampaign"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SalesCampaignMember_salesRepId_idx" ON "SalesCampaignMember"("salesRepId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCampaignMember_campaignId_salesRepId_key" ON "SalesCampaignMember"("campaignId", "salesRepId");

-- CreateIndex
CREATE INDEX "SalesAnnouncement_pinned_createdAt_idx" ON "SalesAnnouncement"("pinned", "createdAt");

-- CreateIndex
CREATE INDEX "SalesCommission_campaignId_salesRepId_idx" ON "SalesCommission"("campaignId", "salesRepId");

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SalesCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCampaignMember" ADD CONSTRAINT "SalesCampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SalesCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCampaignMember" ADD CONSTRAINT "SalesCampaignMember_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Seed: the launch offer for the first 6 reps. 8 Nov → 8 Dec 2026 inclusive, Cairo
-- time (UTC+2 in Nov/Dec): startsAt = 8 Nov 00:00, endsAt = 9 Dec 00:00 (exclusive).
-- 20% on every payment, 30% for pharmacies, 32% on the POS plan, 1000 EGP bonus at
-- 10 new paying customers. Editable from /admin/sales/campaign.
INSERT INTO "SalesCampaign" ("id", "name", "startsAt", "endsAt", "baseRateBps", "pharmacyRateBps", "posRateBps", "bonusTarget", "bonusAmount", "maxMembers", "updatedAt")
VALUES ('b6d478de-70ad-4e7d-8048-20db8247fa24', 'عرض الإطلاق', '2026-11-07 22:00:00', '2026-12-08 22:00:00', 2000, 3000, 3200, 10, 100000, 6, CURRENT_TIMESTAMP);

-- The first member (rep "Berry"). Matches nothing on a database without that rep.
INSERT INTO "SalesCampaignMember" ("id", "campaignId", "salesRepId")
SELECT '9ff99c75-165a-41c8-ac7b-7a5ba318c1ea', 'b6d478de-70ad-4e7d-8048-20db8247fa24', r."id" FROM "SalesRep" r WHERE r."id" = '89ff67e4-804c-4d12-af76-655495b59a29';
