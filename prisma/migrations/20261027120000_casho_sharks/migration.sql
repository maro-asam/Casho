-- CreateEnum
CREATE TYPE "SharksApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED', 'INTERVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SharksTrack" AS ENUM ('BENEFITS', 'GROWTH');

-- CreateEnum
CREATE TYPE "SharksEventKind" AS ENUM ('SUBMITTED', 'STATUS_CHANGE', 'INFO_REQUEST', 'APPLICANT_REPLY', 'NOTE', 'EVALUATION', 'INTERVIEW', 'PLAN', 'PROGRESS', 'STORY');

-- CreateEnum
CREATE TYPE "SharksPlanStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SharksTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "SharksStoryStatus" AS ENUM ('PROPOSED', 'AWAITING_CONSENT', 'CONSENT_RECORDED', 'IN_PRODUCTION', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SHARKS_APPLICATION_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'SHARKS_APPLICATION_UPDATED';

-- CreateTable
CREATE TABLE "SharksProgram" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "applicationsOpen" BOOLEAN NOT NULL DEFAULT true,
    "benefitsAvailable" BOOLEAN NOT NULL DEFAULT true,
    "growthAvailable" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharksProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharksApplication" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SharksApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submissionKey" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "operatingSince" TEXT NOT NULL,
    "offering" TEXT NOT NULL,
    "customers" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "traction" TEXT NOT NULL,
    "potential" TEXT NOT NULL,
    "requestedTracks" "SharksTrack"[],
    "investmentInterest" BOOLEAN NOT NULL DEFAULT false,
    "supportGoal" TEXT NOT NULL,
    "links" TEXT[],
    "extraInfo" TEXT,
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptInAt" TIMESTAMP(3),
    "infoRequest" TEXT,
    "interviewAt" TIMESTAMP(3),
    "interviewLocation" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharksApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharksApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "SharksEventKind" NOT NULL,
    "fromStatus" "SharksApplicationStatus",
    "toStatus" "SharksApplicationStatus",
    "message" TEXT,
    "visibleToApplicant" BOOLEAN NOT NULL DEFAULT false,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharksApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharksEvaluation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "product" INTEGER NOT NULL,
    "demand" INTEGER NOT NULL,
    "founder" INTEGER NOT NULL,
    "growth" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharksEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharksSupportPlan" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "track" "SharksTrack" NOT NULL,
    "benefits" TEXT[],
    "scope" TEXT NOT NULL,
    "limitations" TEXT,
    "startsOn" TIMESTAMP(3),
    "endsOn" TIMESTAMP(3),
    "ownerId" TEXT,
    "status" "SharksPlanStatus" NOT NULL DEFAULT 'PLANNED',
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharksSupportPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharksPlanTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "dueOn" TIMESTAMP(3),
    "status" "SharksTaskStatus" NOT NULL DEFAULT 'TODO',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharksPlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharksStory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SharksStoryStatus" NOT NULL DEFAULT 'PROPOSED',
    "title" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "intro" TEXT,
    "challenge" TEXT,
    "whySelected" TEXT,
    "supportProvided" TEXT,
    "outcomes" TEXT,
    "founderQuote" TEXT,
    "founderName" TEXT,
    "coverImageUrl" TEXT,
    "logoUrl" TEXT,
    "showTrack" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT,
    "videoPosterUrl" TEXT,
    "videoPublished" BOOLEAN NOT NULL DEFAULT false,
    "consentGivenAt" TIMESTAMP(3),
    "consentGivenBy" TEXT,
    "consentMethod" TEXT,
    "consentScope" TEXT,
    "consentRecordedById" TEXT,
    "consentRevokedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "unpublishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharksStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharksApplication_submissionKey_key" ON "SharksApplication"("submissionKey");

-- CreateIndex
CREATE INDEX "SharksApplication_status_createdAt_idx" ON "SharksApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SharksApplication_storeId_createdAt_idx" ON "SharksApplication"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "SharksApplication_userId_idx" ON "SharksApplication"("userId");

-- CreateIndex
CREATE INDEX "SharksApplicationEvent_applicationId_createdAt_idx" ON "SharksApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharksEvaluation_applicationId_reviewerId_key" ON "SharksEvaluation"("applicationId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "SharksSupportPlan_applicationId_key" ON "SharksSupportPlan"("applicationId");

-- CreateIndex
CREATE INDEX "SharksPlanTask_planId_createdAt_idx" ON "SharksPlanTask"("planId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharksStory_applicationId_key" ON "SharksStory"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "SharksStory_slug_key" ON "SharksStory"("slug");

-- CreateIndex
CREATE INDEX "SharksStory_status_publishedAt_idx" ON "SharksStory"("status", "publishedAt");

-- AddForeignKey
ALTER TABLE "SharksApplication" ADD CONSTRAINT "SharksApplication_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharksApplicationEvent" ADD CONSTRAINT "SharksApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SharksApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharksEvaluation" ADD CONSTRAINT "SharksEvaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SharksApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharksSupportPlan" ADD CONSTRAINT "SharksSupportPlan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SharksApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharksPlanTask" ADD CONSTRAINT "SharksPlanTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SharksSupportPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharksStory" ADD CONSTRAINT "SharksStory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SharksApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

