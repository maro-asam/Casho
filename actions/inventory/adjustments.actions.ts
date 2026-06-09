"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { AdjustmentReason, StockMovementType } from "@prisma/client";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export type AdjustmentItem = {
  productId: string;
  variantId?: string;
  newQuantity: number;
};

export async function CreateAdjustmentAction(data: {
  reason: AdjustmentReason;
  notes?: string;
  reference?: string;
  branchId?: string;
  items: AdjustmentItem[];
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  if (!data.items.length) throw new Error("يجب إضافة منتج واحد على الأقل");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: store.id },
    select: { id: true, name: true, stock: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const variantIds = data.items.filter((i) => i.variantId).map((i) => i.variantId!);
  const variants = variantIds.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds }, storeId: store.id },
        select: { id: true, stock: true, productId: true },
      })
    : [];
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`المنتج غير موجود: ${item.productId}`);
    if (item.variantId && !variantMap.has(item.variantId)) {
      throw new Error(`المتغير غير موجود: ${item.variantId}`);
    }
    if (item.newQuantity < 0) throw new Error("الكمية لا يمكن أن تكون سالبة");
  }

  const adjustment = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryAdjustment.create({
      data: {
        storeId: store.id,
        userId,
        branchId: data.branchId || null,
        reason: data.reason,
        notes: data.notes?.trim() || null,
        reference: data.reference?.trim() || null,
      },
    });

    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      let currentStock: number;
      let stockField: "product" | "variant" = "product";

      if (item.variantId) {
        const variant = variantMap.get(item.variantId)!;
        currentStock = variant.stock;
        stockField = "variant";
      } else {
        currentStock = product.stock;
      }

      const change = item.newQuantity - currentStock;

      // Create adjustment item record
      await tx.inventoryAdjustmentItem.create({
        data: {
          adjustmentId: created.id,
          storeId: store.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantityBefore: currentStock,
          quantityAfter: item.newQuantity,
          quantityChange: change,
        },
      });

      // Update actual stock
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: item.newQuantity },
        });
        // Recalculate product total from all variants
        const allVariants = await tx.productVariant.findMany({
          where: { productId: item.productId },
          select: { stock: true, id: true },
        });
        const totalStock = allVariants.reduce(
          (s, v) => s + (v.id === item.variantId ? item.newQuantity : v.stock),
          0,
        );
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: totalStock },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: item.newQuantity },
        });
      }

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          storeId: store.id,
          productId: item.productId,
          variantId: item.variantId || null,
          branchId: data.branchId || null,
          type: StockMovementType.ADJUSTMENT,
          quantity: change,
          stockBefore: currentStock,
          stockAfter: item.newQuantity,
          reference: created.id,
          note: `تسوية مخزون — ${reasonLabel(data.reason)}${data.notes ? `: ${data.notes}` : ""}`,
          userId,
        },
      });
    }

    return created;
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/inventory/adjustments");
  revalidatePath("/dashboard/products");

  return adjustment;
}

export async function GetAdjustmentsAction(filters: {
  page?: number;
  pageSize?: number;
  reason?: AdjustmentReason;
  from?: Date;
  to?: Date;
} = {}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters.reason ? { reason: filters.reason } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.inventoryAdjustment.count({ where }),
    prisma.inventoryAdjustment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        reason: true,
        notes: true,
        reference: true,
        createdAt: true,
        user: { select: { name: true } },
        branch: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function GetAdjustmentDetailAction(adjustmentId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const adjustment = await prisma.inventoryAdjustment.findFirst({
    where: { id: adjustmentId, storeId: store.id },
    select: {
      id: true,
      reason: true,
      notes: true,
      reference: true,
      createdAt: true,
      user: { select: { name: true } },
      branch: { select: { name: true } },
      items: {
        select: {
          id: true,
          quantityBefore: true,
          quantityAfter: true,
          quantityChange: true,
          product: { select: { id: true, name: true, image: true, sku: true } },
          variant: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!adjustment) throw new Error("التسوية غير موجودة");
  return adjustment;
}

function reasonLabel(reason: AdjustmentReason): string {
  const labels: Record<AdjustmentReason, string> = {
    DAMAGE: "تلف",
    THEFT: "سرقة",
    EXPIRY: "انتهاء صلاحية",
    COUNT_CORRECTION: "تصحيح جرد",
    LOSS: "ضياع",
    FOUND: "عثر عليه",
    OTHER: "أخرى",
  };
  return labels[reason] ?? reason;
}
