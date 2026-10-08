/**
 * Pure Normalized* → Kasho field conversions (no DB) — used by the sink, unit-tested.
 */
import { Prisma } from "@prisma/client";
import { transliterate } from "@/lib/utils";
import type { NormalizedOrder, NormalizedProduct, NormalizedVariant } from "./types";

/** Stock given to variants the source sells without tracking inventory. */
export const UNTRACKED_STOCK_QTY = 999;
const PRODUCT_PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

const SIZE_OPTION = /^(size|sizes|المقاس|مقاس|الحجم|حجم)$/i;
const COLOR_OPTION = /^(colou?r|colou?rs|اللون|لون|الألوان)$/i;

export function toPiasters(amount: number) {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

/** Last path segment of a gid ("gid://shopify/Product/123" → "123"). */
export function shortId(externalId: string) {
  return externalId.split("/").pop() || externalId;
}

export function slugFor(handleOrName: string, fallbackPrefix: string, externalId: string) {
  return transliterate(handleOrName).slice(0, 80) || `${fallbackPrefix}-${shortId(externalId)}`;
}

/** Product-level fields derived from the source product and its variants. */
export function buildProductFields(r: NormalizedProduct) {
  const variants = r.variants.length > 0 ? r.variants : [];
  const cheapest = variants.reduce<NormalizedVariant | null>(
    (best, v) => (!best || v.price < best.price ? v : best),
    null,
  );
  const price = cheapest?.price ?? 0;
  const compareAtPrice =
    cheapest?.compareAtPrice != null && cheapest.compareAtPrice > price ? cheapest.compareAtPrice : null;

  const stock = variants.reduce((sum, v) => sum + variantStock(v), 0);
  const hasVariants = r.options.length > 0 && variants.length > 1;

  const sizes: string[] = [];
  const colors: string[] = [];
  const attributes: { key: string; value: string }[] = [];
  for (const option of r.options) {
    if (SIZE_OPTION.test(option.name.trim())) sizes.push(...option.values);
    else if (COLOR_OPTION.test(option.name.trim())) colors.push(...option.values);
    else attributes.push({ key: option.name, value: option.values.join("، ") });
  }

  const single = variants.length === 1 ? variants[0] : null;
  const images = r.images.length > 0 ? r.images : [];

  return {
    name: r.name.slice(0, 250) || "منتج بدون اسم",
    description: r.description,
    price,
    compareAtPrice,
    costPrice: single?.costPrice ?? cheapest?.costPrice ?? null,
    sku: single?.sku ?? null,
    barcode: single?.barcode ?? null,
    image: images[0] ?? PRODUCT_PLACEHOLDER_IMAGE,
    images,
    brand: r.brand,
    tags: r.tags,
    sizes,
    colors,
    attributes: attributes.length > 0 ? attributes : Prisma.DbNull,
    weight: r.weight,
    isActive: r.isActive,
    hasVariants,
    stock,
  };
}

export function variantStock(v: NormalizedVariant) {
  return v.stock === null ? UNTRACKED_STOCK_QTY : Math.max(0, v.stock);
}

export function orderLineFeatures(line: NormalizedOrder["lines"][number], productMapped: boolean) {
  const features: Record<string, string> = {};
  if (!productMapped) features["المنتج"] = line.title;
  if (line.variantTitle && line.variantTitle !== "Default Title") features["النوع"] = line.variantTitle;
  if (line.sku) features["SKU"] = line.sku;
  return features;
}
