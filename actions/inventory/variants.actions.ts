"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export type VariantAttribute = { key: string; value: string };

export async function GetProductVariantsAction(productId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.productVariant.findMany({
    where: { productId, storeId: store.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      attributes: true,
      price: true,
      costPrice: true,
      stock: true,
      lowStockThreshold: true,
      imageUrl: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function CreateVariantAction(data: {
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  attributes: VariantAttribute[];
  price?: number;
  costPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  imageUrl?: string;
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const product = await prisma.product.findFirst({
    where: { id: data.productId, storeId: store.id },
    select: { id: true, stock: true },
  });
  if (!product) throw new Error("المنتج غير موجود");
  if (!data.name?.trim()) throw new Error("اسم المتغير مطلوب");

  const variant = await prisma.$transaction(async (tx) => {
    const created = await tx.productVariant.create({
      data: {
        storeId: store.id,
        productId: data.productId,
        name: data.name.trim(),
        sku: data.sku?.trim() || null,
        barcode: data.barcode?.trim() || null,
        attributes: data.attributes,
        price: data.price ?? null,
        costPrice: data.costPrice ?? null,
        stock: data.stock ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? null,
        imageUrl: data.imageUrl ?? null,
      },
    });

    // Mark product as having variants & update total stock
    await tx.product.update({
      where: { id: data.productId },
      data: {
        hasVariants: true,
        stock: { increment: data.stock ?? 0 },
      },
    });

    return created;
  });

  revalidatePath(`/dashboard/products/${data.productId}/edit`);
  return variant;
}

export async function UpdateVariantAction(
  variantId: string,
  data: {
    name?: string;
    sku?: string;
    barcode?: string;
    attributes?: VariantAttribute[];
    price?: number | null;
    costPrice?: number | null;
    lowStockThreshold?: number | null;
    imageUrl?: string | null;
    isActive?: boolean;
  },
) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, storeId: store.id },
  });
  if (!variant) throw new Error("المتغير غير موجود");

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.sku !== undefined ? { sku: data.sku?.trim() || null } : {}),
      ...(data.barcode !== undefined ? { barcode: data.barcode?.trim() || null } : {}),
      ...(data.attributes ? { attributes: data.attributes } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
      ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });

  revalidatePath(`/dashboard/products/${variant.productId}/edit`);
  return { success: true };
}

export async function DeleteVariantAction(variantId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, storeId: store.id },
    select: { productId: true, stock: true },
  });
  if (!variant) throw new Error("المتغير غير موجود");

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.delete({ where: { id: variantId } });

    // Recalculate product total stock from remaining variants
    const remaining = await tx.productVariant.findMany({
      where: { productId: variant.productId },
      select: { stock: true },
    });
    const totalStock = remaining.reduce((s, v) => s + v.stock, 0);

    await tx.product.update({
      where: { id: variant.productId },
      data: {
        stock: totalStock,
        hasVariants: remaining.length > 0,
      },
    });
  });

  revalidatePath(`/dashboard/products/${variant.productId}/edit`);
  return { success: true };
}

export async function BulkCreateVariantsAction(data: {
  productId: string;
  attributeGroups: { key: string; values: string[] }[];
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const product = await prisma.product.findFirst({
    where: { id: data.productId, storeId: store.id },
    select: { id: true, price: true, costPrice: true },
  });
  if (!product) throw new Error("المنتج غير موجود");

  // Generate all combinations
  function combine(groups: { key: string; values: string[] }[]): VariantAttribute[][] {
    if (groups.length === 0) return [[]];
    const [first, ...rest] = groups;
    const restCombinations = combine(rest);
    return first.values.flatMap((v) =>
      restCombinations.map((combo) => [{ key: first.key, value: v }, ...combo]),
    );
  }

  const combinations = combine(data.attributeGroups);
  const variantData = combinations.map((attrs) => ({
    storeId: store.id,
    productId: data.productId,
    name: attrs.map((a) => a.value).join(" / "),
    attributes: attrs,
    stock: 0,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.createMany({ data: variantData, skipDuplicates: true });
    await tx.product.update({
      where: { id: data.productId },
      data: { hasVariants: true },
    });
  });

  revalidatePath(`/dashboard/products/${data.productId}/edit`);
  return { count: variantData.length };
}
