-- Optional SQL migration if you prefer prisma migrate instead of prisma db push.
-- If you use `npx prisma migrate dev --name add_notifications`, Prisma will generate something very close to this.

CREATE TYPE "NotificationType" AS ENUM (
  'NEW_ORDER',
  'ORDER_STATUS_CHANGED',
  'TOPUP_REQUEST_CREATED',
  'TOPUP_APPROVED',
  'TOPUP_REJECTED',
  'SERVICE_REQUEST_CREATED',
  'SERVICE_REQUEST_UPDATED',
  'SUPPORT_REQUEST_CREATED',
  'POWERED_BY_APPROVED',
  'POWERED_BY_REJECTED',
  'SUBSCRIPTION_EXPIRING',
  'SUBSCRIPTION_EXPIRED',
  'STORE_ACTIVATED',
  'STORE_PAST_DUE',
  'SYSTEM'
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "href" TEXT,
  "data" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT,
  "storeId" TEXT,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_storeId_readAt_createdAt_idx" ON "Notification"("storeId", "readAt", "createdAt");
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_storeId_fkey"
FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
