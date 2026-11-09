-- AlterTable
ALTER TABLE "DomainRegistration" ADD COLUMN     "renewalCharge" INTEGER,
ADD COLUMN     "renewalOrderId" TEXT,
ADD COLUMN     "renewalStartedAt" TIMESTAMP(3);

