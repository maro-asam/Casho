"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";
import { transliterate } from "@/lib/utils";
import * as XLSX from "xlsx";

export type ImportRow = {
  rowIndex: number;
  name: string;
  price: number | null;
  compareAtPrice: number | null;
  description: string | null;
  category: string;
  brand: string | null;
  stock: number;
  tags: string;
  isActive: boolean;
  isFeatured: boolean;
  image: string | null;
  // resolved
  categoryId: string | null;
  error: string | null;
};

export type ParseImportFileResult =
  | { success: false; message: string }
  | { success: true; rows: ImportRow[]; validCount: number; errorCount: number };

export async function ParseImportFileAction(
  formData: FormData,
): Promise<ParseImportFileResult> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { success: false, message: "لم يتم رفع ملف" };

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, unknown>[];

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return { success: false, message: "تعذّر قراءة الملف — تأكد أنه CSV أو XLSX صالح" };
  }

  if (rows.length === 0) return { success: false, message: "الملف فارغ" };
  if (rows.length > 500) return { success: false, message: "الحد الأقصى 500 منتج في المرة الواحدة" };

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), c.id]),
  );

  const parsed: ImportRow[] = rows.map((row, i) => {
    const name = String(row["name"] ?? row["الاسم"] ?? "").trim();
    const priceRaw = row["price"] ?? row["السعر"];
    const price = priceRaw !== "" ? Number(priceRaw) : null;
    const compareAtPriceRaw = row["compareAtPrice"] ?? row["السعر الأصلي"];
    const compareAtPrice = compareAtPriceRaw !== "" ? Number(compareAtPriceRaw) : null;
    const description = String(row["description"] ?? row["الوصف"] ?? "").trim() || null;
    const category = String(row["category"] ?? row["التصنيف"] ?? "").trim();
    const brand = String(row["brand"] ?? row["البراند"] ?? "").trim() || null;
    const stockRaw = row["stock"] ?? row["المخزون"];
    const stock = stockRaw !== "" ? Math.floor(Number(stockRaw)) : 0;
    const tags = String(row["tags"] ?? row["الوسوم"] ?? "").trim();
    const isActiveRaw = String(row["isActive"] ?? row["نشط"] ?? "1").trim().toLowerCase();
    const isActive = isActiveRaw !== "0" && isActiveRaw !== "false" && isActiveRaw !== "لا";
    const isFeaturedRaw = String(row["isFeatured"] ?? row["مميز"] ?? "0").trim().toLowerCase();
    const isFeatured = isFeaturedRaw === "1" || isFeaturedRaw === "true" || isFeaturedRaw === "نعم";
    const image = String(row["image"] ?? row["الصورة"] ?? "").trim() || null;

    let error: string | null = null;
    if (!name) error = "الاسم مطلوب";
    else if (!price || price <= 0) error = "السعر غير صالح";
    else if (!category) error = "التصنيف مطلوب";
    else if (isNaN(stock) || stock < 0) error = "المخزون غير صالح";

    const categoryId = categoryMap.get(category.toLowerCase()) ?? null;
    if (!error && !categoryId) error = `التصنيف "${category}" غير موجود في المتجر`;

    return {
      rowIndex: i + 2,
      name,
      price: price && !isNaN(price) ? price : null,
      compareAtPrice: compareAtPrice && !isNaN(compareAtPrice) ? compareAtPrice : null,
      description,
      category,
      brand,
      stock: isNaN(stock) ? 0 : stock,
      tags,
      isActive,
      isFeatured,
      image,
      categoryId,
      error,
    };
  });

  const validCount = parsed.filter((r) => !r.error).length;
  const errorCount = parsed.filter((r) => r.error).length;

  return { success: true, rows: parsed, validCount, errorCount };
}

export type ConfirmImportResult =
  | { success: false; message: string }
  | { success: true; imported: number };

export async function ConfirmImportAction(
  rows: ImportRow[],
): Promise<ConfirmImportResult> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const validRows = rows.filter((r) => !r.error && r.categoryId && r.price);
  if (validRows.length === 0) return { success: false, message: "لا توجد منتجات صالحة للاستيراد" };

  const data = validRows.map((row) => {
    const baseSlug = transliterate(row.name) || "product";
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
    const tags = row.tags
      ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    return {
      name: row.name,
      slug,
      description: row.description,
      price: row.price!,
      compareAtPrice:
        row.compareAtPrice && row.compareAtPrice > row.price! ? row.compareAtPrice : null,
      image: row.image ?? "/images/product-placeholder.png",
      brand: row.brand,
      stock: row.stock,
      tags,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      storeId: store.id,
      categoryId: row.categoryId!,
    };
  });

  await prisma.product.createMany({ data, skipDuplicates: true });

  return { success: true, imported: data.length };
}
