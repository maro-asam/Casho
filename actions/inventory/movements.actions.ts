"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { StockMovementType } from "@prisma/client";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export async function GetMovementsAction(filters: {
  page?: number;
  pageSize?: number;
  productId?: string;
  variantId?: string;
  branchId?: string;
  type?: StockMovementType;
  from?: Date;
  to?: Date;
  search?: string;
} = {}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 30;
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: store.id,
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.variantId ? { variantId: filters.variantId } : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.search
      ? {
          product: {
            name: { contains: filters.search, mode: "insensitive" as const },
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        type: true,
        quantity: true,
        stockBefore: true,
        stockAfter: true,
        reference: true,
        note: true,
        userId: true,
        createdAt: true,
        product: { select: { id: true, name: true, image: true, sku: true } },
        variant: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function GetProductMovementHistoryAction(productId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
    select: { id: true, name: true, stock: true },
  });
  if (!product) throw new Error("المنتج غير موجود");

  const movements = await prisma.stockMovement.findMany({
    where: { productId, storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      quantity: true,
      stockBefore: true,
      stockAfter: true,
      reference: true,
      note: true,
      createdAt: true,
      variant: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  return { product, movements };
}
