"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { transliterate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { requireUserId } from "../auth/require-user-id.actions";

type ProductFormState = {
  success: boolean;
  message: string;
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const num = Number(text);
  return Number.isNaN(num) ? null : num;
}

function parseRequiredNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  const num = Number(text);
  return Number.isNaN(num) ? null : num;
}

function parseCommaSeparated(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function CreateProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const userId = await requireUserId();

  try {
    const name = String(formData.get("name") ?? "").trim();
    const price = parseRequiredNumber(formData.get("price"));
    const categoryId = String(formData.get("categoryId") ?? "").trim();

    const description = normalizeOptional(formData.get("description"));
    let compareAtPrice = parseOptionalNumber(formData.get("compareAtPrice"));

    const image =
      normalizeOptional(formData.get("image")) ??
      "/images/product-placeholder.png";

    const images = parseCommaSeparated(formData.get("images"));
    const brand = normalizeOptional(formData.get("brand"));

    const stockValue = String(formData.get("stock") ?? "").trim();
    const stock = stockValue ? Number(stockValue) : 0;

    const sizes = parseCommaSeparated(formData.get("sizes"));
    const colors = parseCommaSeparated(formData.get("colors"));
    const tags = parseCommaSeparated(formData.get("tags"));

    const weight = parseOptionalNumber(formData.get("weight"));

    const isActive = formData.get("isActive") === "on";
    const isFeatured = formData.get("isFeatured") === "on";
    const hasVariants = formData.get("hasVariants") === "on";

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

    if (price === null || price <= 0) {
      return { success: false, message: "السعر غير صالح" };
    }

    if (!categoryId) {
      return { success: false, message: "يجب اختيار تصنيف" };
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return { success: false, message: "المخزون غير صالح" };
    }

    if (weight !== null && weight < 0) {
      return { success: false, message: "الوزن غير صالح" };
    }

    if (compareAtPrice !== null && compareAtPrice <= price) {
      compareAtPrice = null;
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId: store.id },
      select: { id: true },
    });

    if (!category) {
      return { success: false, message: "التصنيف غير صالح" };
    }

    const baseSlug = transliterate(name) || "product";
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

    await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        compareAtPrice,
        image,
        images,
        brand,
        stock,
        sizes,
        colors,
        tags,
        weight,
        isActive,
        isFeatured,
        hasVariants,
        storeId: store.id,
        categoryId: category.id,
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
  const userId = await requireUserId();

  try {
    const name = String(formData.get("name") ?? "").trim();
    const price = parseRequiredNumber(formData.get("price"));
    const categoryId = String(formData.get("categoryId") ?? "").trim();

    const description = normalizeOptional(formData.get("description"));
    let compareAtPrice = parseOptionalNumber(formData.get("compareAtPrice"));

    const image =
      normalizeOptional(formData.get("image")) ??
      "/images/product-placeholder.png";

    const images = parseCommaSeparated(formData.get("images"));
    const brand = normalizeOptional(formData.get("brand"));

    const stockValue = String(formData.get("stock") ?? "").trim();
    const stock = stockValue ? Number(stockValue) : 0;

    const sizes = parseCommaSeparated(formData.get("sizes"));
    const colors = parseCommaSeparated(formData.get("colors"));
    const tags = parseCommaSeparated(formData.get("tags"));

    const weight = parseOptionalNumber(formData.get("weight"));

    const isActive = formData.get("isActive") === "on";
    const isFeatured = formData.get("isFeatured") === "on";
    const hasVariants = formData.get("hasVariants") === "on";

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

    if (price === null || price <= 0) {
      return { success: false, message: "السعر غير صالح" };
    }

    if (!categoryId) {
      return { success: false, message: "يجب اختيار تصنيف" };
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return { success: false, message: "المخزون غير صالح" };
    }

    if (weight !== null && weight < 0) {
      return { success: false, message: "الوزن غير صالح" };
    }

    if (compareAtPrice !== null && compareAtPrice <= price) {
      compareAtPrice = null;
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        storeId: store.id,
      },
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

    const normalizedName = transliterate(name) || "product";
    const currentSlugBase = product.slug.split("-").slice(0, -1).join("-");

    if (normalizedName !== currentSlugBase) {
      nextSlug = `${normalizedName}-${crypto.randomUUID().slice(0, 6)}`;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        name,
        slug: nextSlug,
        description,
        price,
        compareAtPrice,
        image,
        images,
        brand,
        stock,
        sizes,
        colors,
        tags,
        weight,
        isActive,
        isFeatured,
        hasVariants,
        categoryId: category.id,
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
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
    },
    select: { id: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  await prisma.product.delete({
    where: { id: product.id },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
}