"use server";

import { revalidatePath } from "next/cache";
import { PosReturnType, PosReturnStatus, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { changeBranchStock } from "@/lib/inventory/branch-stock";
import { assertCanSellInBranch, canManageOthersShifts, requirePosContext, type PosContext } from "@/lib/pos/pos-context";
import { BranchAccessError } from "@/lib/store/branch-context";

/**
 * A sale can be returned in the branch that sold it. Online orders (no branch)
 * can be returned at any counter; the goods enter the cashier's branch.
 */
async function findReturnableOrder(ctx: PosContext, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: ctx.storeId },
    include: {
      branch: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, image: true, sku: true } },
        },
      },
      posReturns: {
        where: { status: PosReturnStatus.COMPLETED },
        include: { items: true },
      },
    },
  });
  if (!order) throw new Error("الطلب غير موجود");
  if (order.branchId && order.branchId !== ctx.branch.id) {
    // Don't reveal other branches' sales to someone who can't access them.
    if (!ctx.branches.some((b) => b.id === order.branchId)) throw new Error("الطلب غير موجود");
    throw new BranchAccessError(`الفاتورة دي من فرع ${order.branch?.name} — المرتجع يتعمل في نفس الفرع`);
  }
  return order;
}

export async function GetOrderForReturnAction(orderId: string) {
  const ctx = await requirePosContext();
  return findReturnableOrder(ctx, orderId);
}

export type ReturnItemInput = {
  orderItemId?: string;
  productId: string;
  quantity: number;
  /** Ignored — the refund price always comes from the original sale. */
  unitPrice?: number;
  reason?: string;
};

export async function ProcessReturnAction(input: {
  originalOrderId: string;
  type: "FULL_RETURN" | "PARTIAL_RETURN" | "EXCHANGE";
  items: ReturnItemInput[];
  reason?: string;
  refundMethod?: string;
  notes?: string;
}) {
  const ctx = await requirePosContext();
  assertCanSellInBranch(ctx);
  const { userId, storeId } = ctx;

  const originalOrder = await findReturnableOrder(ctx, input.originalOrderId);
  const branchId = originalOrder.branchId ?? ctx.branch.id;

  if (!input.items.length) throw new Error("اختار منتج واحد على الأقل");

  // Validate quantities — can't return more than original minus already returned.
  // Refund price = what the customer actually paid per piece (after item discount).
  const lines = input.items.map((returnItem) => {
    const orderItems = originalOrder.items.filter((i) => i.productId === returnItem.productId);
    if (!orderItems.length) throw new Error(`المنتج غير موجود في الطلب الأصلي`);
    if (!Number.isInteger(returnItem.quantity) || returnItem.quantity <= 0) throw new Error("كمية غير صالحة");

    const sold = orderItems.reduce((s, i) => s + i.quantity, 0);
    const paid = orderItems.reduce((s, i) => s + i.price * i.quantity - (i.discountAmount ?? 0), 0);
    const alreadyReturned = originalOrder.posReturns
      .flatMap((r) => r.items)
      .filter((i) => i.productId === returnItem.productId)
      .reduce((sum, i) => sum + i.quantity, 0);

    const returnable = sold - alreadyReturned;
    if (returnItem.quantity > returnable) {
      throw new Error(
        `لا يمكن إرجاع ${returnItem.quantity} قطعة — القابل للإرجاع: ${returnable}`,
      );
    }
    return { ...returnItem, unitPrice: Math.round(paid / sold) };
  });

  const refundAmount = lines.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const refundMethod = input.refundMethod ?? "cash";
  // The refund comes out of the cashier's drawer.
  const shiftId = ctx.shift?.id ?? null;

  const posReturn = await prisma.$transaction(async (tx) => {
    const created = await tx.posReturn.create({
      data: {
        storeId,
        branchId,
        shiftId,
        originalOrderId: input.originalOrderId,
        cashierId: userId,
        type: PosReturnType[input.type],
        status: PosReturnStatus.COMPLETED,
        reason: input.reason,
        refundAmount,
        refundMethod,
        notes: input.notes,
        processedAt: new Date(),
        items: {
          create: lines.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            reason: i.reason,
          })),
        },
      },
    });

    // Restock into the branch the goods came back to
    for (const item of lines) {
      const moved = await changeBranchStock(tx, { storeId, branchId, productId: item.productId, delta: item.quantity });

      await tx.stockMovement.create({
        data: {
          storeId,
          branchId,
          productId: item.productId,
          type: StockMovementType.RETURN,
          quantity: item.quantity,
          stockBefore: moved!.before,
          stockAfter: moved!.after,
          reference: created.id,
          note: `إرجاع — طلب #${input.originalOrderId.slice(-6).toUpperCase()}`,
          userId,
        },
      });
    }

    if (shiftId) {
      await tx.posShift.update({
        where: { id: shiftId },
        data: { totalReturns: { increment: refundAmount }, returnCount: { increment: 1 } },
      });
    }

    return created;
  });

  revalidatePath("/pos/returns");
  revalidatePath("/dashboard/orders");
  return posReturn;
}

export async function GetReturnsAction(limit = 50) {
  const ctx = await requirePosContext();

  return prisma.posReturn.findMany({
    where: canManageOthersShifts(ctx)
      ? { storeId: ctx.storeId, branchId: { in: ctx.branches.map((b) => b.id) } }
      : { storeId: ctx.storeId, branchId: ctx.branch.id },
    include: {
      originalOrder: { select: { id: true, fullName: true, createdAt: true } },
      cashier: { select: { name: true } },
      branch: { select: { name: true } },
      items: {
        include: { product: { select: { name: true, image: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
