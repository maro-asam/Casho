"use server";

import { revalidatePath } from "next/cache";
import { PosReturnType, PosReturnStatus, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export async function GetOrderForReturnAction(orderId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    include: {
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
  return order;
}

export type ReturnItemInput = {
  orderItemId?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
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
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const originalOrder = await prisma.order.findFirst({
    where: { id: input.originalOrderId, storeId: store.id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, stock: true } } },
      },
      posReturns: {
        where: { status: PosReturnStatus.COMPLETED },
        include: { items: { select: { productId: true, quantity: true } } },
      },
    },
  });

  if (!originalOrder) throw new Error("الطلب الأصلي غير موجود");

  // Validate quantities — can't return more than original minus already returned
  for (const returnItem of input.items) {
    const orderItem = originalOrder.items.find((i) => i.productId === returnItem.productId);
    if (!orderItem) throw new Error(`المنتج غير موجود في الطلب الأصلي`);

    const alreadyReturned = originalOrder.posReturns
      .flatMap((r) => r.items)
      .filter((i) => i.productId === returnItem.productId)
      .reduce((sum, i) => sum + i.quantity, 0);

    const returnable = orderItem.quantity - alreadyReturned;
    if (returnItem.quantity > returnable) {
      throw new Error(
        `لا يمكن إرجاع ${returnItem.quantity} قطعة — القابل للإرجاع: ${returnable}`,
      );
    }
  }

  const refundAmount = input.items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );

  const posReturn = await prisma.$transaction(async (tx) => {
    const created = await tx.posReturn.create({
      data: {
        storeId: store.id,
        originalOrderId: input.originalOrderId,
        cashierId: userId,
        type: PosReturnType[input.type],
        status: PosReturnStatus.COMPLETED,
        reason: input.reason,
        refundAmount,
        refundMethod: input.refundMethod ?? "cash",
        notes: input.notes,
        processedAt: new Date(),
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            reason: i.reason,
          })),
        },
      },
    });

    // Restock products
    for (const item of input.items) {
      const orderItem = originalOrder.items.find((i) => i.productId === item.productId);
      if (!orderItem) continue;

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          storeId: store.id,
          productId: item.productId,
          type: StockMovementType.RETURN,
          quantity: item.quantity,
          stockBefore: orderItem.product.stock,
          stockAfter: orderItem.product.stock + item.quantity,
          reference: created.id,
          note: `إرجاع — طلب #${input.originalOrderId.slice(-6).toUpperCase()}`,
          userId,
        },
      });
    }

    return created;
  });

  revalidatePath("/pos/returns");
  revalidatePath("/dashboard/orders");
  return posReturn;
}

export async function GetReturnsAction(limit = 50) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.posReturn.findMany({
    where: { storeId: store.id },
    include: {
      originalOrder: { select: { id: true, fullName: true, createdAt: true } },
      cashier: { select: { name: true } },
      items: {
        include: { product: { select: { name: true, image: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
