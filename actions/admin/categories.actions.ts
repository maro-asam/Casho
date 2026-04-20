"use server";

import { prisma } from "@/lib/prisma";
import { MustOwnStore } from "../auth/auth-helpers.actions";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { SubscriptionStatus } from "@prisma/client";
import { requireUserId } from "../auth/require-user-id.actions";

function normalizeImage(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed;
}

export async function CreateCategoryAction(
  storeId: string,
  name: string,
  image?: string,
) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "اسم التصنيف مطلوب" };
  }

  const baseSlug = slugify(trimmedName);
  if (!baseSlug) {
    return { error: "اسم التصنيف غير صالح" };
  }

  let slug = baseSlug;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.category.findFirst({
      where: { storeId, slug },
      select: { id: true },
    });

    if (!exists) break;

    slug = `${baseSlug}-${i + 2}`;
  }

  await prisma.category.create({
    data: {
      storeId,
      name: trimmedName,
      slug,
      image: normalizeImage(image),
    },
  });

  revalidatePath("/dashboard/categories");
  revalidatePath(`/store/${store.slug}`);

  return { success: "تم إنشاء التصنيف بنجاح" };
}

export async function UpdateCategoryAction(
  categoryId: string,
  storeId: string,
  name: string,
  image?: string,
) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "اسم التصنيف مطلوب" };
  }

  const baseSlug = slugify(trimmedName);
  if (!baseSlug) {
    return { error: "اسم التصنيف غير صالح" };
  }

  let slug = baseSlug;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.category.findFirst({
      where: {
        storeId,
        slug,
        NOT: { id: categoryId },
      },
      select: { id: true },
    });

    if (!exists) break;

    slug = `${baseSlug}-${i + 2}`;
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: trimmedName,
      slug,
      image: normalizeImage(image),
    },
  });

  revalidatePath("/dashboard/categories");
  revalidatePath(`/store/${store.slug}`);

  return { success: true };
}

export async function DeleteCategoryAction(
  categoryId: string,
  storeId: string,
) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true, name: true },
  });

  if (!category) {
    return {
      error: "التصنيف غير موجود",
    };
  }

  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { storeId, categoryId },
      select: { id: true },
    });

    const productIds = products.map((product) => product.id);

    if (productIds.length > 0) {
      await tx.orderItem.deleteMany({
        where: {
          productId: {
            in: productIds,
          },
        },
      });

      await tx.product.deleteMany({
        where: {
          storeId,
          categoryId,
        },
      });
    }

    await tx.category.delete({
      where: { id: categoryId },
    });
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${store.slug}`);

  return {
    success: true,
    message: "تم حذف التصنيف وكل المنتجات المرتبطة به بنجاح",
  };
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
