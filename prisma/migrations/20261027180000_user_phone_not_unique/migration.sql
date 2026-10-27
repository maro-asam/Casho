-- Phone numbers may repeat for allow-listed team identities (lib/auth/multi-account.ts);
-- registration still rejects every other duplicate.

-- DropIndex
DROP INDEX "User_phone_number_key";

-- CreateIndex
CREATE INDEX "User_phone_number_idx" ON "User"("phone_number");
