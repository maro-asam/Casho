"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { transliterate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { requireUserId } from "../auth/require-user-id.actions";
import { createNotification } from "@/lib/notifications/in-app";
import { ProductType } from "@prisma/client";

export type ProductFormState = {
  success: boolean;
  message: string;
  /** Populated on successful creation — used by the AI Marketing Assistant modal. */
  productData?: {
    id:           string;
    name:         string;
    description:  string | null;
    pricePiasters: number;
    categoryName: string;
  };
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

function parseAttributes(value: FormDataEntryValue | null) {
  const raw = String(value ?? "[]").trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as { key: string; value: string }[];
    }
  } catch {
    // ignore malformed JSON
  }
  return null;
}

function parseWholesaleOptions(value: FormDataEntryValue | null) {
  const raw = String(value ?? "[]").trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as { minQty: number; maxQty?: number; price: number }[];
    }
  } catch {
    // ignore malformed JSON
  }
  return null;
}

function parseBundleItems(value: FormDataEntryValue | null) {
  const raw = String(value ?? "[]").trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as { productId: string; productName: string; quantity: number; image: string }[];
    }
  } catch {
    // ignore malformed JSON
  }
  return null;
}

async function checkAndNotifyLowStock(
  productId: string,
  productName: string,
  stock: number,
  storeId: string,
) {
  const settings = await prisma.storeSettings.findUnique({
    where: { storeId },
    select: { defaultLowStockThreshold: true },
  });
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { lowStockThreshold: true },
  });
  const threshold = product?.lowStockThreshold ?? settings?.defaultLowStockThreshold ?? 5;

  if (stock <= threshold) {
    await createNotification({
      storeId,
      type: "LOW_STOCK",
      title: "مخزون منخفض",
      message: `المنتج "${productName}" وصل إلى ${stock} قطعة فقط`,
      href: `/dashboard/products/${productId}/edit`,
      data: { productId, stock, threshold },
    });
  }
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
    const costPrice = parseOptionalNumber(formData.get("costPrice"));
    const sku = normalizeOptional(formData.get("sku"));
    const barcode = normalizeOptional(formData.get("barcode"));

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
    const attributes = parseAttributes(formData.get("attributes"));
    const wholesaleOptions = parseWholesaleOptions(formData.get("wholesaleOptions"));

    const lowStockThresholdRaw = String(formData.get("lowStockThreshold") ?? "").trim();
    const lowStockThreshold = lowStockThresholdRaw ? Number(lowStockThresholdRaw) : null;

    const typeRaw = String(formData.get("type") ?? "SIMPLE").trim();
    const type: ProductType = typeRaw === "BUNDLE" ? "BUNDLE" : "SIMPLE";
    const bundleItems = parseBundleItems(formData.get("bundleItems"));

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

    if (type === "BUNDLE" && (!bundleItems || bundleItems.length === 0)) {
      return { success: false, message: "يجب إضافة منتجات للباقة" };
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId: store.id },
      select: { id: true, name: true },
    });

    if (!category) {
      return { success: false, message: "التصنيف غير صالح" };
    }

    const baseSlug = transliterate(name) || "product";
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

    const created = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        compareAtPrice,
        costPrice,
        sku,
        barcode,
        image,
        images,
        brand,
        stock,
        lowStockThreshold,
        sizes,
        colors,
        tags,
        weight,
        isActive,
        isFeatured,
        hasVariants,
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bundleItems: bundleItems as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attributes: attributes as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wholesaleOptions: wholesaleOptions as any,
        storeId: store.id,
        categoryId: category.id,
      },
      select: { id: true },
    });

    await checkAndNotifyLowStock(created.id, name, stock, store.id);

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");

    // Return product data so the client can show the AI Marketing Assistant.
    // The client is responsible for navigating to /dashboard/products afterward.
    return {
      success: true,
      message: "تم إضافة المنتج بنجاح 🎉",
      productData: {
        id:            created.id,
        name,
        description,
        pricePiasters: price,
        categoryName:  category.name,
      },
    };
  } catch (error) {
    console.error("CreateProductAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء إنشاء المنتج" };
  }
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
    const costPrice = parseOptionalNumber(formData.get("costPrice"));
    const sku = normalizeOptional(formData.get("sku"));
    const barcode = normalizeOptional(formData.get("barcode"));

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
    const attributes = parseAttributes(formData.get("attributes"));
    const wholesaleOptions = parseWholesaleOptions(formData.get("wholesaleOptions"));

    const lowStockThresholdRaw = String(formData.get("lowStockThreshold") ?? "").trim();
    const lowStockThreshold = lowStockThresholdRaw ? Number(lowStockThresholdRaw) : null;

    const typeRaw = String(formData.get("type") ?? "SIMPLE").trim();
    const type: ProductType = typeRaw === "BUNDLE" ? "BUNDLE" : "SIMPLE";
    const bundleItems = parseBundleItems(formData.get("bundleItems"));

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

    if (type === "BUNDLE" && (!bundleItems || bundleItems.length === 0)) {
      return { success: false, message: "يجب إضافة منتجات للباقة" };
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
        costPrice,
        sku,
        barcode,
        image,
        images,
        brand,
        stock,
        lowStockThreshold,
        sizes,
        colors,
        tags,
        weight,
        isActive,
        isFeatured,
        hasVariants,
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bundleItems: bundleItems as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attributes: attributes as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wholesaleOptions: wholesaleOptions as any,
        categoryId: category.id,
      },
    });

    await checkAndNotifyLowStock(product.id, name, stock, store.id);
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