"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { transliterate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { requireAuth } from "../auth/require.actions";

type ProductFormState = {
  success: boolean;
  message: string;
};

export async function CreateProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const userId = await requireAuth();

  try {
    const name = (formData.get("name") as string)?.trim();
    const price = Number(formData.get("price"));
    const image = (formData.get("image") as string)?.trim() || null;
    const categoryId = (formData.get("categoryId") as string)?.trim();
    const isActive = formData.get("isActive") === "on";
    const isFeatured = formData.get("isFeatured") === "on";

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!store) {
      return { success: false, message: "المتجر غير موجود" };
    }

    if (!name) {
      return { success: false, message: "اسم المنتج مطلوب" };
    }

    if (!Number.isFinite(price) || price <= 0) {
      return { success: false, message: "السعر غير صالح" };
    }

    if (!categoryId) {
      return { success: false, message: "يجب اختيار تصنيف" };
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId: store.id },
      select: { id: true },
    });

    if (!category) {
      return { success: false, message: "التصنيف غير صالح" };
    }

    const baseSlug = transliterate(name);
    const safeBaseSlug = baseSlug || "product";
    const slug = `${safeBaseSlug}-${crypto.randomUUID().slice(0, 6)}`;

    await prisma.product.create({
      data: {
        name,
        price,
        image,
        slug,
        storeId: store.id,
        categoryId: category.id,
        isActive,
        isFeatured,
      },
    });
  } catch (error) {
    console.error("CreateProductAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء إنشاء المنتج" };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  redirect("/dashboard/products");
}

export async function UpdateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    const name = (formData.get("name") as string)?.trim();
    const price = Number(formData.get("price"));
    const image = (formData.get("image") as string)?.trim() || null;
    const categoryId = (formData.get("categoryId") as string)?.trim();
    const isActive = formData.get("isActive") === "on";
    const isFeatured = formData.get("isFeatured") === "on";

    const userId = (await cookies()).get("sessionToken")?.value;
    if (!userId) {
      return { success: false, message: "يجب تسجيل الدخول أولًا" };
    }

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!store) {
      return { success: false, message: "المتجر غير موجود" };
    }

    if (!name) {
      return { success: false, message: "اسم المنتج مطلوب" };
    }

    if (!Number.isFinite(price) || price <= 0) {
      return { success: false, message: "السعر غير صالح" };
    }

    if (!categoryId) {
      return { success: false, message: "يجب اختيار تصنيف" };
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId: store.id },
      select: { id: true },
    });

    if (!category) {
      return { success: false, message: "التصنيف غير صالح" };
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!product) {
      return { success: false, message: "المنتج غير موجود" };
    }

    let nextSlug = product.slug;

    const normalizedName = transliterate(name);
    const currentSlugBase = product.slug.split("-").slice(0, -1).join("-");

    if (normalizedName && normalizedName !== currentSlugBase) {
      nextSlug = `${normalizedName}-${crypto.randomUUID().slice(0, 6)}`;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        name,
        price,
        image,
        categoryId: category.id,
        isActive,
        isFeatured,
        slug: nextSlug,
      },
    });
  } catch (error) {
    console.error("UpdateProductAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء تعديل المنتج" };
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
  revalidatePath("/dashboard");

  redirect("/dashboard/products");
}

export async function DeleteProductAction(productId: string) {
  const userId = (await cookies()).get("sessionToken")?.value;
  if (!userId) throw new Error("Unauthorized");

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) throw new Error("Store not found");

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
    },
    select: { id: true },
  });

  if (!product) throw new Error("Product not found");

  await prisma.product.delete({
    where: { id: product.id },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
}
