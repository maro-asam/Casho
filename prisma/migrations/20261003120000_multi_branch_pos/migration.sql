-- Multi-branch POS
--
-- Every store gets a default ("main") branch, every existing POS record is
-- attached to it, and BranchInventory becomes the per-branch stock ledger:
--
--   Product.stock = SUM(BranchInventory.quantity) over the store's branches
--                   (product-level rows, i.e. "variantId" IS NULL)
--
-- Written to be re-runnable: every step is guarded (IF NOT EXISTS / WHERE ... IS NULL /
-- NOT EXISTS) so a partial run can simply be run again.
--
-- NOTE: the partial unique indexes below can't be expressed in schema.prisma. If a
-- future `prisma migrate dev` proposes dropping them, remove those lines from the
-- generated migration.

-- ─── Enum values ─────────────────────────────────────────────────────────────
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SHIFT_OPENED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SHIFT_CLOSED';

-- ─── Columns ─────────────────────────────────────────────────────────────────
ALTER TABLE "StoreMember"  ADD COLUMN IF NOT EXISTS "allBranches" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Order"        ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "PosShift"     ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "PosHeldOrder" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "PosReturn"    ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "PosReturn"    ADD COLUMN IF NOT EXISTS "shiftId" TEXT;

CREATE TABLE IF NOT EXISTS "StoreMemberBranch" (
  "memberId"  TEXT NOT NULL,
  "branchId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreMemberBranch_pkey" PRIMARY KEY ("memberId", "branchId")
);

-- ─── Default branch per store ────────────────────────────────────────────────
-- Stores that already have branches but none marked default: promote the oldest.
UPDATE "Branch" b SET "isDefault" = true, "updatedAt" = now()
WHERE b.id IN (
  SELECT DISTINCT ON ("storeId") id FROM "Branch"
  WHERE "storeId" NOT IN (SELECT "storeId" FROM "Branch" WHERE "isDefault")
  ORDER BY "storeId", "createdAt" ASC
);

-- Stores with several defaults (possible before the unique index): keep the oldest.
UPDATE "Branch" b SET "isDefault" = false, "updatedAt" = now()
WHERE b."isDefault" AND b.id NOT IN (
  SELECT DISTINCT ON ("storeId") id FROM "Branch" WHERE "isDefault" ORDER BY "storeId", "createdAt" ASC
);

-- Stores with no branch at all.
INSERT INTO "Branch" (id, "storeId", name, "isDefault", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, s.id, 'الفرع الرئيسي', true, true, now(), now()
FROM "Store" s
WHERE NOT EXISTS (SELECT 1 FROM "Branch" b WHERE b."storeId" = s.id);

-- The default branch must stay active (POS falls back to it).
UPDATE "Branch" SET "isActive" = true, "updatedAt" = now() WHERE "isDefault" AND NOT "isActive";

CREATE UNIQUE INDEX IF NOT EXISTS "Branch_one_default_per_store" ON "Branch"("storeId") WHERE "isDefault";

-- ─── BranchInventory: one product-level row per (branch, product) ───────────
-- Postgres treats NULLs as distinct, so @@unique([branchId, productId, variantId])
-- never stopped duplicate product-level rows. Merge them before adding the index.
WITH dupes AS (
  SELECT "branchId", "productId", MIN(id) AS keep_id, SUM(quantity) AS qty,
         SUM("reservedQuantity") AS reserved, SUM("incomingQuantity") AS incoming
  FROM "BranchInventory" WHERE "variantId" IS NULL
  GROUP BY "branchId", "productId" HAVING COUNT(*) > 1
), merged AS (
  UPDATE "BranchInventory" bi
  SET quantity = d.qty, "reservedQuantity" = d.reserved, "incomingQuantity" = d.incoming, "updatedAt" = now()
  FROM dupes d WHERE bi.id = d.keep_id
  RETURNING bi.id
)
DELETE FROM "BranchInventory" bi
USING dupes d
WHERE bi."variantId" IS NULL AND bi."branchId" = d."branchId" AND bi."productId" = d."productId" AND bi.id <> d.keep_id;

CREATE UNIQUE INDEX IF NOT EXISTS "BranchInventory_branch_product_no_variant_key"
  ON "BranchInventory"("branchId", "productId") WHERE "variantId" IS NULL;

-- Seed/realign the default branch so branch totals equal Product.stock.
-- Single-branch stores: default branch quantity = Product.stock exactly.
-- Multi-branch stores: default branch gets whatever isn't already in other branches
-- (can be negative if the old data was inconsistent — that is surfaced, not hidden).
INSERT INTO "BranchInventory" (id, "storeId", "branchId", "productId", "variantId", quantity, "reservedQuantity", "incomingQuantity", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p."storeId", db.id, p.id, NULL,
       p.stock - COALESCE((
         SELECT SUM(o.quantity) FROM "BranchInventory" o
         WHERE o."productId" = p.id AND o."variantId" IS NULL AND o."branchId" <> db.id
       ), 0),
       0, 0, now(), now()
FROM "Product" p
JOIN "Branch" db ON db."storeId" = p."storeId" AND db."isDefault"
ON CONFLICT ("branchId", "productId") WHERE "variantId" IS NULL
DO UPDATE SET quantity = EXCLUDED.quantity, "updatedAt" = now();

-- ─── Attach existing POS records to the default branch ───────────────────────
UPDATE "PosShift" t SET "branchId" = b.id
FROM "Branch" b WHERE b."storeId" = t."storeId" AND b."isDefault" AND t."branchId" IS NULL;

UPDATE "Order" t SET "branchId" = COALESCE(
    (SELECT s."branchId" FROM "PosShift" s WHERE s.id = t."posShiftId"), b.id)
FROM "Branch" b
WHERE b."storeId" = t."storeId" AND b."isDefault" AND t.source = 'POS' AND t."branchId" IS NULL;

UPDATE "PosHeldOrder" t SET "branchId" = b.id
FROM "Branch" b WHERE b."storeId" = t."storeId" AND b."isDefault" AND t."branchId" IS NULL;

UPDATE "PosReturn" t SET "branchId" = COALESCE(
    (SELECT o."branchId" FROM "Order" o WHERE o.id = t."originalOrderId"), b.id)
FROM "Branch" b WHERE b."storeId" = t."storeId" AND b."isDefault" AND t."branchId" IS NULL;

-- History before branches existed all happened in the (only) main branch.
UPDATE "StockMovement" t SET "branchId" = b.id
FROM "Branch" b WHERE b."storeId" = t."storeId" AND b."isDefault" AND t."branchId" IS NULL;

UPDATE "PurchaseOrder" t SET "branchId" = b.id
FROM "Branch" b WHERE b."storeId" = t."storeId" AND b."isDefault" AND t."branchId" IS NULL;

UPDATE "InventoryAdjustment" t SET "branchId" = b.id
FROM "Branch" b WHERE b."storeId" = t."storeId" AND b."isDefault" AND t."branchId" IS NULL;

-- A cashier works one drawer at a time: at most one OPEN shift per cashier.
-- Close all but the newest duplicate first so the index can be created.
UPDATE "PosShift" SET status = 'CLOSED', "closedAt" = COALESCE("closedAt", now()),
       notes = COALESCE(notes || E'\n', '') || 'أغلقت تلقائياً أثناء الترقية لنظام الفروع'
WHERE status = 'OPEN' AND id NOT IN (
  SELECT DISTINCT ON ("cashierId") id FROM "PosShift" WHERE status = 'OPEN' ORDER BY "cashierId", "openedAt" DESC
);
CREATE UNIQUE INDEX IF NOT EXISTS "PosShift_one_open_per_cashier" ON "PosShift"("cashierId") WHERE status = 'OPEN';

-- ─── Foreign keys ────────────────────────────────────────────────────────────
-- Branches with history are deactivated, never deleted (RESTRICT).
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PosShift" ADD CONSTRAINT "PosShift_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PosHeldOrder" ADD CONSTRAINT "PosHeldOrder_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PosReturn" ADD CONSTRAINT "PosReturn_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PosReturn" ADD CONSTRAINT "PosReturn_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES "PosShift"(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StoreMemberBranch" ADD CONSTRAINT "StoreMemberBranch_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "StoreMember"(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StoreMemberBranch" ADD CONSTRAINT "StoreMemberBranch_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Indexes (branch-scoped lists and reports) ───────────────────────────────
CREATE INDEX IF NOT EXISTS "Order_branchId_createdAt_idx"        ON "Order"("branchId", "createdAt");
CREATE INDEX IF NOT EXISTS "PosShift_branchId_status_idx"        ON "PosShift"("branchId", status);
CREATE INDEX IF NOT EXISTS "PosShift_branchId_openedAt_idx"      ON "PosShift"("branchId", "openedAt");
CREATE INDEX IF NOT EXISTS "PosHeldOrder_branchId_createdAt_idx" ON "PosHeldOrder"("branchId", "createdAt");
CREATE INDEX IF NOT EXISTS "PosReturn_branchId_createdAt_idx"    ON "PosReturn"("branchId", "createdAt");
CREATE INDEX IF NOT EXISTS "PosReturn_shiftId_idx"               ON "PosReturn"("shiftId");
CREATE INDEX IF NOT EXISTS "StoreMemberBranch_branchId_idx"      ON "StoreMemberBranch"("branchId");
