"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { TransferStatus, StockMovementType } from "@prisma/client";
import { changeBranchStock } from "@/lib/inventory/branch-stock";
import { assertBranchAllowed, requireBranchAccess } from "@/lib/store/branch-context";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getStoreForUser(_userId: string) {
  const ctx = await requireBranchAccess("manage_inventory");
  return { id: ctx.storeId, ctx };
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
  if (!toBranch || !toBranch.isActive) throw new Error("فرع الاستلام غير موجود");
  assertBranchAllowed(store.ctx, fromBranch.id);

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
  assertBranchAllowed(store.ctx, transfer.fromBranchId);

  const itemMap = new Map(transfer.items.map((i) => [i.id, i]));

  await prisma.$transaction(async (tx) => {
    // Claim the transfer first so a double submit can't ship (and deduct) twice.
    const claimed = await tx.stockTransfer.updateMany({
      where: { id: transfer.id, status: TransferStatus.APPROVED },
      data: { status: TransferStatus.SHIPPED, shippedAt: new Date() },
    });
    if (claimed.count === 0) throw new Error("طلب التحويل اتشحن بالفعل");

    for (const shipped of data.shippedItems) {
      const item = itemMap.get(shipped.itemId);
      if (!item || shipped.shippedQuantity <= 0) continue;
      const qty = Math.min(Math.floor(shipped.shippedQuantity), item.requestedQuantity);
      if (qty <= 0) continue;

      await tx.stockTransferItem.update({
        where: { id: shipped.itemId },
        data: { shippedQuantity: qty },
      });

      // Leaves the source branch (and the store total) while it is on the way.
      const moved = await changeBranchStock(tx, {
        storeId: store.id,
        branchId: transfer.fromBranchId,
        productId: item.productId,
        delta: -qty,
        requireAvailable: true,
      });
      if (!moved) throw new Error("الكمية المشحونة أكبر من المتاح في فرع الإرسال");

      if (item.variantId) {
        await tx.branchInventory.updateMany({
          where: { branchId: transfer.fromBranchId, productId: item.productId, variantId: item.variantId },
          data: { quantity: { decrement: qty } },
        });
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: qty } } });
      }

      await tx.stockMovement.create({
        data: {
          storeId: store.id,
          productId: item.productId,
          variantId: item.variantId,
          branchId: transfer.fromBranchId,
          type: StockMovementType.TRANSFER_OUT,
          quantity: -qty,
          stockBefore: moved.before,
          stockAfter: moved.after,
          reference: transfer.id,
          note: `تحويل خارجي — ${transfer.id.slice(-6).toUpperCase()}`,
          userId,
        },
      });
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
  assertBranchAllowed(store.ctx, transfer.toBranchId);

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

      // Arrives in the destination branch (and back into the store total).
      const moved = await changeBranchStock(tx, {
        storeId: store.id,
        branchId: transfer.toBranchId,
        productId: item.productId,
        delta: actual,
      });

      if (item.variantId) {
        await tx.branchInventory.upsert({
          where: {
            branchId_productId_variantId: {
              branchId: transfer.toBranchId,
              productId: item.productId,
              variantId: item.variantId,
            },
          },
          create: {
            storeId: store.id,
            branchId: transfer.toBranchId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: actual,
          },
          update: { quantity: { increment: actual } },
        });
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: actual } } });
      }

      await tx.stockMovement.create({
        data: {
          storeId: store.id,
          productId: item.productId,
          variantId: item.variantId,
          branchId: transfer.toBranchId,
          type: StockMovementType.TRANSFER_IN,
          quantity: actual,
          stockBefore: moved!.before,
          stockAfter: moved!.after,
          reference: transfer.id,
          note: `تحويل داخلي — ${transfer.id.slice(-6).toUpperCase()}`,
          userId,
        },
      });
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
