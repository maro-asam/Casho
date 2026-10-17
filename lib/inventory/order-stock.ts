import { OrderConfirmationStatus, OrderStatus, StockMovementType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findDefaultBranchId, adjustBranchQuantity } from "./branch-stock";

type Tx = Prisma.TransactionClient;
type Line = { productId: string; quantity: number };

/** Thrown inside a transaction when a product no longer has enough stock; rolls the order back. */
export class OutOfStockError extends Error {
  constructor(public productIds: string[]) {
    super("OUT_OF_STOCK");
  }
}

/** Same product can sit in the cart several times (different size/color) — stock is per product. */
function sumByProduct(lines: Line[]) {
  const totals = new Map<string, number>();
  for (const line of lines) totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  return totals;
}

/**
 * Takes the ordered quantities out of stock atomically: each decrement only
 * applies while enough stock remains, so two customers can't buy the last piece.
 */
export async function takeStockForOrder(
  tx: Tx,
  { storeId, orderId, lines, note }: { storeId: string; orderId: string; lines: Line[]; note: string },
) {
  const failed: string[] = [];
  // Online orders ship from the main branch; its row follows Product.stock.
  const branchId = await findDefaultBranchId(tx, storeId);

  for (const [productId, quantity] of sumByProduct(lines)) {
    const before = await tx.product.findUnique({ where: { id: productId }, select: { stock: true } });
    const res = await tx.product.updateMany({
      where: { id: productId, storeId, isActive: true, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (res.count === 0 || !before) {
      failed.push(productId);
      continue;
    }
    if (branchId) await adjustBranchQuantity(tx, { storeId, branchId, productId, delta: -quantity });
    await tx.stockMovement.create({
      data: {
        storeId,
        productId,
        branchId,
        type: StockMovementType.SALE,
        quantity: -quantity,
        stockBefore: before.stock,
        stockAfter: before.stock - quantity,
        reference: orderId,
        note,
      },
    });
  }

  if (failed.length) throw new OutOfStockError(failed);
}

/**
 * Moves an order's quantities back into stock (order canceled) or out again
 * (cancellation undone). Un-canceling may take stock below zero on purpose —
 * the merchant already promised those items.
 */
export async function adjustStockForOrderStatus(
  tx: Tx,
  { storeId, orderId, direction, userId }: { storeId: string; orderId: string; direction: "restock" | "take"; userId?: string },
) {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });
  const sign = direction === "restock" ? 1 : -1;
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { branchId: true } });
  // POS sales go back to their branch; online orders to the main branch.
  const branchId = order?.branchId ?? (await findDefaultBranchId(tx, storeId));

  for (const [productId, quantity] of sumByProduct(items)) {
    const product = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: sign * quantity } },
      select: { stock: true },
    });
    if (branchId) await adjustBranchQuantity(tx, { storeId, branchId, productId, delta: sign * quantity });
    await tx.stockMovement.create({
      data: {
        storeId,
        productId,
        branchId,
        type: direction === "restock" ? StockMovementType.RETURN : StockMovementType.SALE,
        quantity: sign * quantity,
        stockBefore: product.stock - sign * quantity,
        stockAfter: product.stock,
        reference: orderId,
        note: direction === "restock" ? "رجوع للمخزون — الطلب اتلغى" : "خصم من المخزون — الطلب رجع بعد الإلغاء",
        userId,
      },
    });
  }
}

/**
 * Shrinks a guest's cart to what is actually available (removes hidden or
 * sold-out products). Returns true when anything changed.
 */
export async function fitCartToStock(storeId: string, guestSessionId: string) {
  const rows = await prisma.cartItem.findMany({
    where: { storeId, guestSessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, productId: true, quantity: true, product: { select: { stock: true, isActive: true } } },
  });

  const remaining = new Map<string, number>();
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  for (const row of rows) {
    const left = remaining.get(row.productId) ?? (row.product.isActive ? Math.max(0, row.product.stock) : 0);
    if (left <= 0) {
      ops.push(prisma.cartItem.delete({ where: { id: row.id } }));
    } else if (row.quantity > left) {
      ops.push(prisma.cartItem.update({ where: { id: row.id }, data: { quantity: left } }));
    }
    remaining.set(row.productId, Math.max(0, left - row.quantity));
  }

  if (ops.length) await prisma.$transaction(ops);
  return ops.length > 0;
}

/** How long an unpaid card/wallet order may hold stock before it is released. */
const UNPAID_ONLINE_ORDER_TTL_MS = 60 * 60 * 1000;
/** How long a cash order may wait for the customer's phone code (lib/fraud). */
const UNCONFIRMED_ORDER_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Cancels online orders that never became real and gives their stock back:
 * Kashier orders the shopper never paid (a payment that still arrives later
 * re-takes the stock in the Kashier callback), and cash orders whose phone
 * code was never entered. Run from the hourly cron.
 */
export async function releaseUnpaidOnlineOrders(now = new Date()) {
  const stale = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      paidAt: null,
      OR: [
        { paymentProvider: "KASHIER", createdAt: { lt: new Date(now.getTime() - UNPAID_ONLINE_ORDER_TTL_MS) } },
        {
          confirmationStatus: OrderConfirmationStatus.PENDING,
          createdAt: { lt: new Date(now.getTime() - UNCONFIRMED_ORDER_TTL_MS) },
        },
      ],
    },
    select: { id: true, storeId: true, confirmationStatus: true },
    take: 500,
  });

  let released = 0;
  for (const order of stale) {
    try {
      const done = await prisma.$transaction(async (tx) => {
        const res = await tx.order.updateMany({
          where: { id: order.id, status: OrderStatus.PENDING, paidAt: null },
          data:
            order.confirmationStatus === OrderConfirmationStatus.PENDING
              ? { status: OrderStatus.CANCELED, riskSignals: { push: "اتلغى تلقائي — العميل ماأكدش الكود" } }
              : { status: OrderStatus.CANCELED, paymentStatus: "EXPIRED" },
        });
        if (res.count !== 1) return false;
        await adjustStockForOrderStatus(tx, { storeId: order.storeId, orderId: order.id, direction: "restock" });
        return true;
      });
      if (done) released += 1;
    } catch (error) {
      console.error("[release-unpaid-orders]", order.id, error);
    }
  }

  return { checked: stale.length, released };
}
