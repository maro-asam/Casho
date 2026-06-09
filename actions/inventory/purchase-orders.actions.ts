"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { PurchaseOrderStatus, StockMovementType, NotificationType } from "@prisma/client";
import { createNotification } from "@/lib/notifications/in-app";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

async function nextPONumber(storeId: string): Promise<string> {
  const count = await prisma.purchaseOrder.count({ where: { storeId } });
  return `PO-${String(count + 1).padStart(5, "0")}`;
}

export type POItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number; // piasters
};

export async function CreatePurchaseOrderAction(data: {
  supplierId?: string;
  branchId?: string;
  notes?: string;
  expectedDate?: Date;
  items: POItem[];
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  if (!data.items.length) throw new Error("يجب إضافة منتج واحد على الأقل");

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: store.id },
    select: { id: true, name: true },
  });
  if (products.length !== new Set(productIds).size) {
    throw new Error("بعض المنتجات غير موجودة");
  }

  const totalAmount = data.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const orderNumber = await nextPONumber(store.id);

  const po = await prisma.purchaseOrder.create({
    data: {
      storeId: store.id,
      supplierId: data.supplierId || null,
      branchId: data.branchId || null,
      orderNumber,
      status: PurchaseOrderStatus.DRAFT,
      notes: data.notes?.trim() || null,
      totalAmount,
      expectedDate: data.expectedDate || null,
      createdById: userId,
      items: {
        create: data.items.map((item) => ({
          storeId: store.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          receivedQuantity: 0,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })),
      },
    },
    select: { id: true, orderNumber: true },
  });

  revalidatePath("/dashboard/inventory/purchase-orders");
  return po;
}

export async function UpdatePOStatusAction(poId: string, status: PurchaseOrderStatus) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, storeId: store.id },
    select: { status: true },
  });
  if (!po) throw new Error("أمر الشراء غير موجود");
  if (po.status === PurchaseOrderStatus.CANCELLED) {
    throw new Error("لا يمكن تغيير حالة أمر ملغي");
  }

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status },
  });

  revalidatePath("/dashboard/inventory/purchase-orders");
  return { success: true };
}

export async function ReceivePOItemsAction(data: {
  poId: string;
  receivedItems: { itemId: string; receivedQuantity: number }[];
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: data.poId, storeId: store.id },
    select: {
      id: true,
      status: true,
      branchId: true,
      items: {
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
          receivedQuantity: true,
        },
      },
    },
  });
  if (!po) throw new Error("أمر الشراء غير موجود");
  if (po.status === PurchaseOrderStatus.CANCELLED) {
    throw new Error("أمر الشراء ملغي");
  }
  if (po.status === PurchaseOrderStatus.RECEIVED) {
    throw new Error("تم استلام أمر الشراء بالكامل بالفعل");
  }

  const itemMap = new Map(po.items.map((i) => [i.id, i]));

  await prisma.$transaction(async (tx) => {
    for (const recv of data.receivedItems) {
      const item = itemMap.get(recv.itemId);
      if (!item) continue;
      if (recv.receivedQuantity <= 0) continue;

      const maxReceivable = item.quantity - item.receivedQuantity;
      const actualReceived = Math.min(recv.receivedQuantity, maxReceivable);
      if (actualReceived <= 0) continue;

      // Update received quantity on PO item
      await tx.purchaseOrderItem.update({
        where: { id: recv.itemId },
        data: { receivedQuantity: { increment: actualReceived } },
      });

      // Update product/variant stock
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        const newVariantStock = (variant?.stock ?? 0) + actualReceived;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: actualReceived } },
        });
        const allVariants = await tx.productVariant.findMany({
          where: { productId: item.productId },
          select: { stock: true },
        });
        const totalStock = allVariants.reduce((s, v) => s + v.stock, 0);
        const product = await tx.product.update({
          where: { id: item.productId },
          data: { stock: totalStock },
          select: { stock: true },
        });
        await tx.stockMovement.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            variantId: item.variantId,
            branchId: po.branchId,
            type: StockMovementType.PURCHASE,
            quantity: actualReceived,
            stockBefore: product.stock - actualReceived,
            stockAfter: product.stock,
            reference: po.id,
            note: `استلام من أمر شراء #${po.id.slice(-6).toUpperCase()}`,
            userId,
          },
        });
      } else {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: actualReceived } },
        });
        await tx.stockMovement.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            branchId: po.branchId,
            type: StockMovementType.PURCHASE,
            quantity: actualReceived,
            stockBefore: product?.stock ?? 0,
            stockAfter: (product?.stock ?? 0) + actualReceived,
            reference: po.id,
            note: `استلام من أمر شراء #${po.id.slice(-6).toUpperCase()}`,
            userId,
          },
        });
      }

      // Update branch inventory if branch is set
      if (po.branchId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx.branchInventory.upsert as any)({
          where: {
            branchId_productId_variantId: {
              branchId: po.branchId,
              productId: item.productId,
              variantId: item.variantId ?? null,
            },
          },
          create: {
            storeId: store.id,
            branchId: po.branchId,
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: actualReceived,
          },
          update: { quantity: { increment: actualReceived } },
        });
      }
    }

    // Recalculate PO status
    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: po.id },
      select: { quantity: true, receivedQuantity: true },
    });

    const allReceived = updatedItems.every((i) => i.receivedQuantity >= i.quantity);
    const anyReceived = updatedItems.some((i) => i.receivedQuantity > 0);

    const newStatus = allReceived
      ? PurchaseOrderStatus.RECEIVED
      : anyReceived
        ? PurchaseOrderStatus.PARTIAL
        : po.status;

    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: newStatus,
        ...(newStatus === PurchaseOrderStatus.RECEIVED ? { receivedAt: new Date() } : {}),
      },
    });
  });

  // Notification (fire-and-forget)
  try {
    await createNotification({
      storeId: store.id,
      userId,
      type: NotificationType.PURCHASE_ORDER_RECEIVED,
      title: "تم استلام أمر الشراء",
      message: `تم تحديث المخزون بناءً على أمر الشراء #${po.id.slice(-6).toUpperCase()}`,
      href: `/dashboard/inventory/purchase-orders/${po.id}`,
    });
  } catch {
    // silent
  }

  revalidatePath("/dashboard/inventory/purchase-orders");
  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function GetPurchaseOrdersAction(filters: {
  page?: number;
  pageSize?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  search?: string;
} = {}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
    ...(filters.search
      ? { orderNumber: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        expectedDate: true,
        receivedAt: true,
        createdAt: true,
        supplier: { select: { name: true } },
        branch: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function GetPurchaseOrderDetailAction(poId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, storeId: store.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      notes: true,
      totalAmount: true,
      expectedDate: true,
      receivedAt: true,
      createdAt: true,
      supplier: { select: { id: true, name: true, phone: true } },
      branch: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          receivedQuantity: true,
          unitCost: true,
          totalCost: true,
          product: { select: { id: true, name: true, image: true, sku: true, stock: true } },
          variant: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!po) throw new Error("أمر الشراء غير موجود");
  return po;
}
