"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { TransferStatus, StockMovementType } from "@prisma/client";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export type TransferItem = {
  productId: string;
  variantId?: string;
  requestedQuantity: number;
};

export async function CreateTransferAction(data: {
  fromBranchId: string;
  toBranchId: string;
  notes?: string;
  reference?: string;
  items: TransferItem[];
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  if (data.fromBranchId === data.toBranchId) {
    throw new Error("لا يمكن نقل مخزون من فرع لنفسه");
  }
  if (!data.items.length) throw new Error("يجب إضافة منتج واحد على الأقل");

  const [fromBranch, toBranch] = await Promise.all([
    prisma.branch.findFirst({ where: { id: data.fromBranchId, storeId: store.id } }),
    prisma.branch.findFirst({ where: { id: data.toBranchId, storeId: store.id } }),
  ]);
  if (!fromBranch) throw new Error("فرع الإرسال غير موجود");
  if (!toBranch) throw new Error("فرع الاستلام غير موجود");

  const transfer = await prisma.stockTransfer.create({
    data: {
      storeId: store.id,
      fromBranchId: data.fromBranchId,
      toBranchId: data.toBranchId,
      notes: data.notes?.trim() || null,
      reference: data.reference?.trim() || null,
      createdById: userId,
      status: TransferStatus.PENDING,
      items: {
        create: data.items.map((item) => ({
          storeId: store.id,
          productId: item.productId,
          variantId: item.variantId || null,
          requestedQuantity: item.requestedQuantity,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/inventory/transfers");
  return transfer;
}

export async function ApproveTransferAction(transferId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: transferId, storeId: store.id },
    select: { status: true },
  });
  if (!transfer) throw new Error("طلب التحويل غير موجود");
  if (transfer.status !== TransferStatus.PENDING) {
    throw new Error("يمكن الموافقة فقط على الطلبات المعلقة");
  }

  await prisma.stockTransfer.update({
    where: { id: transferId },
    data: { status: TransferStatus.APPROVED, approvedById: userId },
  });

  revalidatePath("/dashboard/inventory/transfers");
  return { success: true };
}

export async function ShipTransferAction(data: {
  transferId: string;
  shippedItems: { itemId: string; shippedQuantity: number }[];
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: data.transferId, storeId: store.id },
    select: {
      id: true,
      status: true,
      fromBranchId: true,
      items: {
        select: { id: true, productId: true, variantId: true, requestedQuantity: true },
      },
    },
  });
  if (!transfer) throw new Error("طلب التحويل غير موجود");
  if (transfer.status !== TransferStatus.APPROVED) {
    throw new Error("يجب الموافقة على الطلب قبل الشحن");
  }

  const itemMap = new Map(transfer.items.map((i) => [i.id, i]));

  await prisma.$transaction(async (tx) => {
    for (const shipped of data.shippedItems) {
      const item = itemMap.get(shipped.itemId);
      if (!item || shipped.shippedQuantity <= 0) continue;

      await tx.stockTransferItem.update({
        where: { id: shipped.itemId },
        data: { shippedQuantity: shipped.shippedQuantity },
      });

      // Deduct from source branch inventory
      await tx.branchInventory.updateMany({
        where: {
          branchId: transfer.fromBranchId,
          productId: item.productId,
          variantId: item.variantId ?? null,
        },
        data: { quantity: { decrement: shipped.shippedQuantity } },
      });

      // Record TRANSFER_OUT movement
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        await tx.stockMovement.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            variantId: item.variantId,
            branchId: transfer.fromBranchId,
            type: StockMovementType.TRANSFER_OUT,
            quantity: -shipped.shippedQuantity,
            stockBefore: variant?.stock ?? 0,
            stockAfter: (variant?.stock ?? 0) - shipped.shippedQuantity,
            reference: transfer.id,
            note: `تحويل خارجي — ${transfer.id.slice(-6).toUpperCase()}`,
            userId,
          },
        });
      } else {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        await tx.stockMovement.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            branchId: transfer.fromBranchId,
            type: StockMovementType.TRANSFER_OUT,
            quantity: -shipped.shippedQuantity,
            stockBefore: product?.stock ?? 0,
            stockAfter: (product?.stock ?? 0) - shipped.shippedQuantity,
            reference: transfer.id,
            note: `تحويل خارجي — ${transfer.id.slice(-6).toUpperCase()}`,
            userId,
          },
        });
      }
    }

    await tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: TransferStatus.SHIPPED, shippedAt: new Date() },
    });
  });

  revalidatePath("/dashboard/inventory/transfers");
  return { success: true };
}

export async function ReceiveTransferAction(data: {
  transferId: string;
  receivedItems: { itemId: string; receivedQuantity: number }[];
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: data.transferId, storeId: store.id },
    select: {
      id: true,
      status: true,
      toBranchId: true,
      items: {
        select: {
          id: true,
          productId: true,
          variantId: true,
          shippedQuantity: true,
          receivedQuantity: true,
        },
      },
    },
  });
  if (!transfer) throw new Error("طلب التحويل غير موجود");
  if (transfer.status !== TransferStatus.SHIPPED) {
    throw new Error("يجب شحن الطلب أولاً");
  }

  const itemMap = new Map(transfer.items.map((i) => [i.id, i]));

  await prisma.$transaction(async (tx) => {
    for (const recv of data.receivedItems) {
      const item = itemMap.get(recv.itemId);
      if (!item || recv.receivedQuantity <= 0) continue;

      const actual = Math.min(recv.receivedQuantity, item.shippedQuantity - item.receivedQuantity);
      if (actual <= 0) continue;

      await tx.stockTransferItem.update({
        where: { id: recv.itemId },
        data: { receivedQuantity: { increment: actual } },
      });

      // Add to destination branch inventory & product total
      await tx.branchInventory.upsert({
        where: {
          branchId_productId_variantId: {
            branchId: transfer.toBranchId,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        },
        create: {
          storeId: store.id,
          branchId: transfer.toBranchId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: actual,
        },
        update: { quantity: { increment: actual } },
      } as Parameters<typeof tx.branchInventory.upsert>[0]);

      // Record TRANSFER_IN movement
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        await tx.stockMovement.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            variantId: item.variantId,
            branchId: transfer.toBranchId,
            type: StockMovementType.TRANSFER_IN,
            quantity: actual,
            stockBefore: variant?.stock ?? 0,
            stockAfter: (variant?.stock ?? 0) + actual,
            reference: transfer.id,
            note: `تحويل داخلي — ${transfer.id.slice(-6).toUpperCase()}`,
            userId,
          },
        });
      } else {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        await tx.stockMovement.create({
          data: {
            storeId: store.id,
            productId: item.productId,
            branchId: transfer.toBranchId,
            type: StockMovementType.TRANSFER_IN,
            quantity: actual,
            stockBefore: product?.stock ?? 0,
            stockAfter: (product?.stock ?? 0) + actual,
            reference: transfer.id,
            note: `تحويل داخلي — ${transfer.id.slice(-6).toUpperCase()}`,
            userId,
          },
        });
      }
    }

    // Check if fully received
    const updatedItems = await tx.stockTransferItem.findMany({
      where: { transferId: transfer.id },
      select: { shippedQuantity: true, receivedQuantity: true },
    });
    const allReceived = updatedItems.every((i) => i.receivedQuantity >= i.shippedQuantity);

    await tx.stockTransfer.update({
      where: { id: transfer.id },
      data: {
        status: allReceived ? TransferStatus.RECEIVED : TransferStatus.SHIPPED,
        ...(allReceived ? { receivedAt: new Date() } : {}),
      },
    });
  });

  revalidatePath("/dashboard/inventory/transfers");
  return { success: true };
}

export async function CancelTransferAction(transferId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: transferId, storeId: store.id },
    select: { status: true },
  });
  if (!transfer) throw new Error("طلب التحويل غير موجود");
  if (transfer.status === TransferStatus.SHIPPED || transfer.status === TransferStatus.RECEIVED) {
    throw new Error("لا يمكن إلغاء طلب تم شحنه أو استلامه");
  }

  await prisma.stockTransfer.update({
    where: { id: transferId },
    data: { status: TransferStatus.CANCELLED },
  });

  revalidatePath("/dashboard/inventory/transfers");
  return { success: true };
}

export async function GetTransfersAction(filters: {
  page?: number;
  pageSize?: number;
  status?: TransferStatus;
  branchId?: string;
} = {}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.branchId
      ? { OR: [{ fromBranchId: filters.branchId }, { toBranchId: filters.branchId }] }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.stockTransfer.count({ where }),
    prisma.stockTransfer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        status: true,
        reference: true,
        notes: true,
        shippedAt: true,
        receivedAt: true,
        createdAt: true,
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function GetTransferDetailAction(transferId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id: transferId, storeId: store.id },
    select: {
      id: true,
      status: true,
      reference: true,
      notes: true,
      shippedAt: true,
      receivedAt: true,
      createdAt: true,
      fromBranch: { select: { id: true, name: true } },
      toBranch: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        select: {
          id: true,
          requestedQuantity: true,
          shippedQuantity: true,
          receivedQuantity: true,
          product: { select: { id: true, name: true, image: true, sku: true, stock: true } },
          variant: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!transfer) throw new Error("طلب التحويل غير موجود");
  return transfer;
}
