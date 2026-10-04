import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

/*
 * Per-branch stock.
 *
 * Invariant kept by every writer:
 *   Product.stock = Σ BranchInventory.quantity  (product-level rows: variantId IS NULL)
 *
 * Product.stock stays the store-wide total the storefront and the existing screens
 * read; BranchInventory says where those pieces physically are. Variant rows
 * (variantId set) are a per-variant breakdown and are not part of this sum.
 *
 * All updates are single SQL statements, so two cashiers selling the same product
 * in different branches never block or overwrite each other.
 */

/** Current product-level quantity of one product in one branch (0 when no row yet). */
export async function getBranchQuantity(db: Db, branchId: string, productId: string) {
  const row = await db.branchInventory.findFirst({
    where: { branchId, productId, variantId: null },
    select: { quantity: true },
  });
  return row?.quantity ?? 0;
}

/** Quantities of many products in one branch. */
export async function getBranchQuantities(db: Db, branchId: string, productIds: string[]) {
  const rows = productIds.length
    ? await db.branchInventory.findMany({
        where: { branchId, productId: { in: productIds }, variantId: null },
        select: { productId: true, quantity: true },
      })
    : [];
  return new Map(rows.map((r) => [r.productId, r.quantity]));
}

/**
 * Adds `delta` to the branch row only (Product.stock untouched — for moves between
 * branches, or when the caller already changed Product.stock).
 * With `requireAvailable`, a negative delta only applies while the branch still has
 * enough; returns null when it doesn't. Returns the new branch quantity otherwise.
 */
export async function adjustBranchQuantity(
  tx: Db,
  {
    storeId,
    branchId,
    productId,
    delta,
    requireAvailable = false,
  }: { storeId: string; branchId: string; productId: string; delta: number; requireAvailable?: boolean },
): Promise<number | null> {
  if (requireAvailable && delta < 0) {
    const rows = await tx.$queryRaw<{ quantity: number }[]>`
      UPDATE "BranchInventory"
      SET quantity = quantity + ${delta}, "updatedAt" = now()
      WHERE "branchId" = ${branchId} AND "productId" = ${productId} AND "variantId" IS NULL
        AND quantity >= ${-delta}
      RETURNING quantity
    `;
    return rows[0]?.quantity ?? null;
  }

  const rows = await tx.$queryRaw<{ quantity: number }[]>`
    INSERT INTO "BranchInventory"
      (id, "storeId", "branchId", "productId", "variantId", quantity, "reservedQuantity", "incomingQuantity", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${storeId}, ${branchId}, ${productId}, NULL, ${delta}, 0, 0, now(), now())
    ON CONFLICT ("branchId", "productId") WHERE "variantId" IS NULL
    DO UPDATE SET quantity = "BranchInventory".quantity + EXCLUDED.quantity, "updatedAt" = now()
    RETURNING quantity
  `;
  return rows[0].quantity;
}

/**
 * Stock physically enters/leaves a branch (sale, return, purchase, adjustment):
 * moves the branch row and Product.stock together.
 * Returns the branch quantity before/after, or null when `requireAvailable` failed.
 */
export async function changeBranchStock(
  tx: Db,
  input: { storeId: string; branchId: string; productId: string; delta: number; requireAvailable?: boolean },
): Promise<{ before: number; after: number } | null> {
  const after = await adjustBranchQuantity(tx, input);
  if (after === null) return null;
  if (input.delta !== 0) {
    await tx.product.update({ where: { id: input.productId }, data: { stock: { increment: input.delta } } });
  }
  return { before: after - input.delta, after };
}

/** Id of the store's default branch inside a transaction (null only for unmigrated stores). */
export async function findDefaultBranchId(tx: Db, storeId: string) {
  const branch = await tx.branch.findFirst({ where: { storeId, isDefault: true }, select: { id: true } });
  return branch?.id ?? null;
}

/**
 * For writers that only know the store-wide total (product form, CSV import, online
 * orders, variant totals): after they change Product.stock by `delta`, book the same
 * delta on the default branch so the invariant holds. May take the default branch
 * below zero — that is a real "stock is in another branch" signal, not hidden.
 */
export async function syncDefaultBranch(tx: Db, { storeId, productId, delta }: { storeId: string; productId: string; delta: number }) {
  if (delta === 0) return;
  const branchId = await findDefaultBranchId(tx, storeId);
  if (!branchId) return;
  await adjustBranchQuantity(tx, { storeId, branchId, productId, delta });
}

/**
 * Gives products that have no branch row yet (just created / imported) a default
 * branch row holding their whole stock.
 */
export async function seedDefaultBranchRows(db: Db, storeId: string) {
  await db.$executeRaw`
    INSERT INTO "BranchInventory"
      (id, "storeId", "branchId", "productId", "variantId", quantity, "reservedQuantity", "incomingQuantity", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, p."storeId", b.id, p.id, NULL, p.stock, 0, 0, now(), now()
    FROM "Product" p
    JOIN "Branch" b ON b."storeId" = p."storeId" AND b."isDefault"
    WHERE p."storeId" = ${storeId}
      AND NOT EXISTS (SELECT 1 FROM "BranchInventory" bi WHERE bi."productId" = p.id AND bi."variantId" IS NULL)
    ON CONFLICT ("branchId", "productId") WHERE "variantId" IS NULL DO NOTHING
  `;
}
