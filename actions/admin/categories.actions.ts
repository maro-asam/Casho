"use server";

import { prisma } from "@/lib/prisma";
import { MustOwnStore } from "../auth/auth-helpers.actions";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import { requireUserId } from "../auth/require-user-id.actions";

export async function CreateCategoryAction(storeId: string, name: string) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const baseSlug = slugify(name);
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
      name,
      slug,
    },
  });

  revalidatePath(`/dashboard/categories`);
  revalidatePath(`/store/${store.slug}`);

  return { success: "تم إنشاء التصنيف بنجاح" };
}

export async function UpdateCategoryAction(
  categoryId: string,
  storeId: string,
  name: string,
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

  const baseSlug = slugify(name);
  if (!baseSlug) throw new Error("Invalid category name");

  let slug = baseSlug;
  for (let i = 0; i < 50; i++) {
    const exists = await prisma.category.findFirst({
      where: { storeId, slug, NOT: { id: categoryId } },
      select: { id: true },
    });
    if (!exists) break;
    slug = `${baseSlug}-${i + 2}`;
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, slug },
  });

  revalidatePath(`/dashboard/stores/${store.id}/categories`);
  revalidatePath(`/store/${store.slug}`);
  return { success: true };
}

export async function DeleteCategoryAction(
  categoryId: string,
  storeId: string,
) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { storeId, categoryId },
      data: { categoryId: undefined },
    });

    await tx.category.delete({
      where: { id: categoryId },
    });
  });

  revalidatePath(`/dashboard/categories`);
  revalidatePath(`/store/${store.slug}`);

  return {
    success: true,
    message: "تم حذف التصنيف بنجاح",
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
    },
  });

  return categories;
}
