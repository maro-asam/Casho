"use server";

import { seedDefaultBranchRows, syncDefaultBranch } from "@/lib/inventory/branch-stock";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { transliterate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { requireUserId } from "../auth/require-user-id.actions";
import { createNotification } from "@/lib/notifications/in-app";
import { ProductType } from "@prisma/client";
import { assertCanUse, FEATURE_KEYS, isEntitlementError, entitlementErrorMessage } from "@/lib/entitlements";

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

/** Digital product fields — a file or link the customer gets once the order is paid. */
function parseDigital(formData: FormData) {
  const isDigital = formData.get("isDigital") === "on";
  const digitalUrl = normalizeOptional(formData.get("digitalUrl"));
  const digitalFileName = normalizeOptional(formData.get("digitalFileName"));
  const error =
    isDigital && !digitalUrl
      ? "ارفع ملف المنتج الرقمي أو حط لينك ليه"
      : digitalUrl && !/^https?:\/\/\S+$/i.test(digitalUrl)
        ? "لينك المنتج الرقمي لازم يبدأ بـ https://"
        : null;
  return { error, data: { isDigital, digitalUrl, digitalFileName: digitalUrl ? digitalFileName : null } };
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
  // Fetch store settings and product threshold in parallel
  const [settings, product] = await Promise.all([
    prisma.storeSettings.findUnique({
      where: { storeId },
      select: { defaultLowStockThreshold: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { lowStockThreshold: true },
    }),
  ]);
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
    const digital = parseDigital(formData);
    if (digital.error) return { success: false, message: digital.error };

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!store) {
      return { success: false, message: "المتجر غير موجود" };
    }

    try {
      await assertCanUse(store.id, FEATURE_KEYS.PRODUCTS);
    } catch (error) {
      if (isEntitlementError(error)) return { success: false, message: entitlementErrorMessage(error) };
      throw error;
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
        ...digital.data,
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
    await seedDefaultBranchRows(prisma, store.id);

    if (!digital.data.isDigital) await checkAndNotifyLowStock(created.id, name, stock, store.id);

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
    const digital = parseDigital(formData);
    if (digital.error) return { success: false, message: digital.error };

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
        stock: true,
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

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
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
          ...digital.data,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bundleItems: bundleItems as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attributes: attributes as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wholesaleOptions: wholesaleOptions as any,
          categoryId: category.id,
        },
      });
      // The form edits the store-wide total; the difference lands in the main branch.
      await syncDefaultBranch(tx, { storeId: store.id, productId: product.id, delta: stock - product.stock });
    });

    if (!digital.data.isDigital) await checkAndNotifyLowStock(product.id, name, stock, store.id);
  } catch (error) {
    console.error("UpdateProductAction Error:", error);
    return { success: false, message: "حدث خطأ أثناء تعديل المنتج" };
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
  revalidatePath("/dashboard");
  redirect("/dashboard/products");
}

export type ProductMutationResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "HAS_ORDERS" | "FAILED"; message: string };

async function findOwnedProduct(productId: string) {
  const userId = await requireUserId();
  return prisma.product.findFirst({
    where: { id: productId, store: { userId } },
    select: { id: true, _count: { select: { orderItems: true } } },
  });
}

/**
 * Deletes a product that was never ordered. Ordered products are kept for
 * order history and reports — the merchant should hide them instead.
 */
export async function DeleteProductAction(productId: string): Promise<ProductMutationResult> {
  const product = await findOwnedProduct(productId);
  if (!product) return { ok: false, code: "NOT_FOUND", message: "المنتج مش موجود." };

  if (product._count.orderItems > 0) {
    return {
      ok: false,
      code: "HAS_ORDERS",
      message: "المنتج ده موجود في طلبات قديمة فمينفعش يتمسح. تقدر تخفيه بدل كده.",
    };
  }

  try {
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: product.id } }),
      prisma.product.delete({ where: { id: product.id } }),
    ]);
  } catch (error) {
    console.error("DeleteProductAction error:", error);
    return { ok: false, code: "FAILED", message: "مقدرناش نمسح المنتج. جرّب تخفيه بدل كده." };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Quick toggles from the products table (show/hide, featured). */
export async function SetProductFlagsAction(
  productId: string,
  flags: { isActive?: boolean; isFeatured?: boolean },
): Promise<ProductMutationResult> {
  const product = await findOwnedProduct(productId);
  if (!product) return { ok: false, code: "NOT_FOUND", message: "المنتج مش موجود." };

  const data: { isActive?: boolean; isFeatured?: boolean } = {};
  if (typeof flags.isActive === "boolean") data.isActive = flags.isActive;
  if (typeof flags.isFeatured === "boolean") data.isFeatured = flags.isFeatured;

  await prisma.product.update({ where: { id: product.id }, data });

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  return { ok: true };
}