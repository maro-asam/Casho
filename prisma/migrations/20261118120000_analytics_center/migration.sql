-- Casho Analytics Center (lib/analytics). Additive only: new tables + one nullable Visit column.
-- CreateEnum
CREATE TYPE "AnalyticsScope" AS ENUM ('MARKETING', 'APP', 'STOREFRONT');

-- CreateEnum
CREATE TYPE "AnalyticsConsentMode" AS ENUM ('NONE', 'BANNER', 'REGION');

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "visitorId" TEXT;

-- CreateTable
CREATE TABLE "AnalyticsSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trackMarketing" BOOLEAN NOT NULL DEFAULT true,
    "trackApp" BOOLEAN NOT NULL DEFAULT true,
    "trackStorefronts" BOOLEAN NOT NULL DEFAULT true,
    "consentMode" "AnalyticsConsentMode" NOT NULL DEFAULT 'REGION',
    "respectDnt" BOOLEAN NOT NULL DEFAULT true,
    "sessionTimeoutMin" INTEGER NOT NULL DEFAULT 30,
    "realtimeWindowMin" INTEGER NOT NULL DEFAULT 5,
    "rawRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "sessionRetentionDays" INTEGER NOT NULL DEFAULT 395,
    "excludedPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedQueryParams" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "internalIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludeTeam" BOOLEAN NOT NULL DEFAULT true,
    "heatmapsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "heatmapSampleRate" INTEGER NOT NULL DEFAULT 100,
    "heatmapPrivatePages" BOOLEAN NOT NULL DEFAULT false,
    "trackClicks" BOOLEAN NOT NULL DEFAULT true,
    "trackScroll" BOOLEAN NOT NULL DEFAULT true,
    "trackForms" BOOLEAN NOT NULL DEFAULT true,
    "trackErrors" BOOLEAN NOT NULL DEFAULT true,
    "trackVitals" BOOLEAN NOT NULL DEFAULT true,
    "trackCustomEvents" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "scope" "AnalyticsScope" NOT NULL,
    "storeId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "pageviews" INTEGER NOT NULL DEFAULT 0,
    "events" INTEGER NOT NULL DEFAULT 0,
    "engagedMs" INTEGER NOT NULL DEFAULT 0,
    "engaged" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "isReturning" BOOLEAN NOT NULL DEFAULT false,
    "entryPath" TEXT NOT NULL,
    "exitPath" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "referrerHost" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "device" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "screen" TEXT,
    "viewportW" INTEGER,
    "viewportH" INTEGER,
    "language" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "userId" TEXT,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsPageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "scope" "AnalyticsScope" NOT NULL,
    "storeId" TEXT,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "query" TEXT,
    "prevPath" TEXT,
    "seq" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "engagedMs" INTEGER NOT NULL DEFAULT 0,
    "scrollPct" INTEGER NOT NULL DEFAULT 0,
    "docHeight" INTEGER,
    "viewportW" INTEGER NOT NULL,
    "viewportH" INTEGER,
    "device" TEXT NOT NULL,

    CONSTRAINT "AnalyticsPageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "visitorId" TEXT,
    "scope" "AnalyticsScope" NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "ts" TIMESTAMP(3) NOT NULL,
    "device" TEXT,
    "x" DOUBLE PRECISION,
    "y" INTEGER,
    "vw" INTEGER,
    "dh" INTEGER,
    "sel" TEXT,
    "ex" DOUBLE PRECISION,
    "ey" DOUBLE PRECISION,
    "value" DOUBLE PRECISION,
    "refId" TEXT,
    "props" JSONB,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsIdentity" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsFunnel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "AnalyticsScope" NOT NULL DEFAULT 'MARKETING',
    "steps" JSONB NOT NULL,
    "windowDays" INTEGER NOT NULL DEFAULT 30,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsFunnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsCampaignCost" (
    "id" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "source" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsCampaignCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsSession_scope_startedAt_idx" ON "AnalyticsSession"("scope", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_storeId_startedAt_idx" ON "AnalyticsSession"("storeId", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_lastSeenAt_idx" ON "AnalyticsSession"("lastSeenAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_visitorId_startedAt_idx" ON "AnalyticsSession"("visitorId", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_userId_idx" ON "AnalyticsSession"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_scope_startedAt_idx" ON "AnalyticsPageView"("scope", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_storeId_startedAt_idx" ON "AnalyticsPageView"("storeId", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_path_startedAt_idx" ON "AnalyticsPageView"("path", "startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_sessionId_seq_idx" ON "AnalyticsPageView"("sessionId", "seq");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_scope_ts_idx" ON "AnalyticsEvent"("scope", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_storeId_ts_idx" ON "AnalyticsEvent"("storeId", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_ts_idx" ON "AnalyticsEvent"("name", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_path_name_ts_idx" ON "AnalyticsEvent"("path", "name", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_ts_idx" ON "AnalyticsEvent"("sessionId", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_refId_idx" ON "AnalyticsEvent"("refId");

-- CreateIndex
CREATE INDEX "AnalyticsIdentity_userId_idx" ON "AnalyticsIdentity"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsIdentity_createdAt_idx" ON "AnalyticsIdentity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsIdentity_visitorId_userId_key" ON "AnalyticsIdentity"("visitorId", "userId");

-- CreateIndex
CREATE INDEX "AnalyticsCampaignCost_campaign_idx" ON "AnalyticsCampaignCost"("campaign");

-- AddForeignKey
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsPageView" ADD CONSTRAINT "AnalyticsPageView_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsIdentity" ADD CONSTRAINT "AnalyticsIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

