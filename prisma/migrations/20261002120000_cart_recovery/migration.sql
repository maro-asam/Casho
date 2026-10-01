-- CreateTable
CREATE TABLE "CartRecovery" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "guestSessionId" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "token" TEXT NOT NULL,
    "restoredSessionId" TEXT,
    "contactedAt" TIMESTAMP(3),
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "convertedAt" TIMESTAMP(3),
    "orderId" TEXT,
    "orderTotal" INTEGER,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartRecovery_token_key" ON "CartRecovery"("token");
CREATE UNIQUE INDEX "CartRecovery_storeId_guestSessionId_key" ON "CartRecovery"("storeId", "guestSessionId");
CREATE INDEX "CartRecovery_storeId_updatedAt_idx" ON "CartRecovery"("storeId", "updatedAt");
CREATE INDEX "CartRecovery_restoredSessionId_idx" ON "CartRecovery"("restoredSessionId");

-- AddForeignKey
ALTER TABLE "CartRecovery" ADD CONSTRAINT "CartRecovery_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
