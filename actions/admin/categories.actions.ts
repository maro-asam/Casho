"use server";

import { prisma } from "@/lib/prisma";
import { MustOwnStore } from "../auth/auth-helpers.actions";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { SubscriptionStatus } from "@prisma/client";
import { requireUserId } from "../auth/require-user-id.actions";

export type CategoryMutationResult =
  | { ok: true; message?: string }
  | { ok: false; code: "NOT_FOUND" | "INVALID" | "HAS_PRODUCTS" | "FAILED"; message: string };

function normalizeImage(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function uniqueCategorySlug(storeId: string, name: string, excludeId?: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.category.findFirst({
      where: { storeId, slug, ...(excludeId && { NOT: { id: excludeId } }) },
      select: { id: true },
    });
    if (!exists) break;
    slug = `${baseSlug}-${i + 2}`;
  }

  return slug;
}

function revalidateCategories(storeSlug: string) {
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${storeSlug}`, "layout");
}

export async function CreateCategoryAction(
  storeId: string,
  name: string,
  image?: string,
): Promise<CategoryMutationResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, code: "INVALID", message: "اكتب اسم التصنيف." };
  if (trimmedName.length > 60) return { ok: false, code: "INVALID", message: "الاسم طويل، خليه أقل من ٦٠ حرف." };

  const duplicate = await prisma.category.findFirst({
    where: { storeId, name: { equals: trimmedName, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return { ok: false, code: "INVALID", message: "عندك تصنيف بنفس الاسم ده." };

  await prisma.category.create({
    data: {
      storeId,
      name: trimmedName,
      slug: await uniqueCategorySlug(storeId, trimmedName),
      image: normalizeImage(image),
    },
  });

  revalidateCategories(store.slug);
  return { ok: true };
}

export async function UpdateCategoryAction(
  categoryId: string,
  storeId: string,
  name: string,
  image?: string,
): Promise<CategoryMutationResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true, name: true },
  });
  if (!category) return { ok: false, code: "NOT_FOUND", message: "التصنيف مش موجود." };

  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, code: "INVALID", message: "اكتب اسم التصنيف." };
  if (trimmedName.length > 60) return { ok: false, code: "INVALID", message: "الاسم طويل، خليه أقل من ٦٠ حرف." };

  const duplicate = await prisma.category.findFirst({
    where: { storeId, name: { equals: trimmedName, mode: "insensitive" }, NOT: { id: categoryId } },
    select: { id: true },
  });
  if (duplicate) return { ok: false, code: "INVALID", message: "عندك تصنيف تاني بنفس الاسم ده." };

  // Keep the slug (and the storefront link) unless the name actually changed.
  const nameChanged = trimmedName !== category.name;

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: trimmedName,
      image: normalizeImage(image),
      ...(nameChanged && { slug: await uniqueCategorySlug(storeId, trimmedName, categoryId) }),
    },
  });

  revalidateCategories(store.slug);
  return { ok: true };
}

/**
 * Deletes a category. Products are required to have a category and may sit in
 * past orders, so a non-empty category needs `moveToCategoryId` — its products
 * move there first and nothing else is lost.
 */
export async function DeleteCategoryAction(
  categoryId: string,
  storeId: string,
  moveToCategoryId?: string,
): Promise<CategoryMutationResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!category) return { ok: false, code: "NOT_FOUND", message: "التصنيف مش موجود." };

  const productCount = category._count.products;

  if (productCount > 0) {
    if (!moveToCategoryId || moveToCategoryId === categoryId) {
      return { ok: false, code: "HAS_PRODUCTS", message: "اختار تصنيف تنقل له المنتجات الأول." };
    }
    const target = await prisma.category.findFirst({
      where: { id: moveToCategoryId, storeId },
      select: { id: true },
    });
    if (!target) return { ok: false, code: "INVALID", message: "التصنيف اللي اخترته مش موجود." };
  }

  try {
    await prisma.$transaction([
      ...(productCount > 0
        ? [prisma.product.updateMany({ where: { storeId, categoryId }, data: { categoryId: moveToCategoryId } })]
        : []),
      prisma.category.delete({ where: { id: categoryId } }),
    ]);
  } catch (error) {
    console.error("DeleteCategoryAction error:", error);
    return { ok: false, code: "FAILED", message: "مقدرناش نمسح التصنيف. جرّب تاني." };
  }

  revalidateCategories(store.slug);
  return { ok: true };
}

export async function GetStoreCategoriesAction(storeId: string) {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
    select: { id: true },
  });

  if (!store) return [];

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
  });

  return categories;
}
