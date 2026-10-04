"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { AdjustmentReason, StockMovementType } from "@prisma/client";
import { assertCanUse, FEATURE_KEYS } from "@/lib/entitlements";
import { adjustBranchQuantity, changeBranchStock, getBranchQuantities } from "@/lib/inventory/branch-stock";
import { assertBranchAllowed, getDefaultBranch, requireBranchAccess } from "@/lib/store/branch-context";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getStoreForUser(_userId: string) {
  const ctx = await requireBranchAccess("manage_inventory");
  return { id: ctx.storeId, ctx };
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
  await assertCanUse(store.id, FEATURE_KEYS.INVENTORY);

  if (!data.items.length) throw new Error("يجب إضافة منتج واحد على الأقل");

  // Counts are per branch: the chosen one, or the main branch.
  const branchId = data.branchId || (await getDefaultBranch(store.id)).id;
  assertBranchAllowed(store.ctx, branchId);

  const productIds = data.items.map((i) => i.productId);
  if (new Set(productIds.filter((_, i) => !data.items[i].variantId)).size !== data.items.filter((i) => !i.variantId).length) {
    throw new Error("المنتج مكرر في التسوية");
  }
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
        branchId,
        reason: data.reason,
        notes: data.notes?.trim() || null,
        reference: data.reference?.trim() || null,
      },
    });

    const branchQty = await getBranchQuantities(tx, branchId, productIds);

    for (const item of data.items) {
      let currentStock: number;
      let change: number;

      if (item.variantId) {
        // Variant counts are store-wide; the product total moves by the same amount
        // and that amount is booked on this branch.
        const variant = variantMap.get(item.variantId)!;
        currentStock = variant.stock;
        change = item.newQuantity - currentStock;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: item.newQuantity },
        });
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: change } } });
        await adjustBranchQuantity(tx, { storeId: store.id, branchId, productId: item.productId, delta: change });
      } else {
        // The count is what is physically on this branch's shelf.
        currentStock = branchQty.get(item.productId) ?? 0;
        change = item.newQuantity - currentStock;
        await changeBranchStock(tx, { storeId: store.id, branchId, productId: item.productId, delta: change });
      }

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

      await tx.stockMovement.create({
        data: {
          storeId: store.id,
          productId: item.productId,
          variantId: item.variantId || null,
          branchId,
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
