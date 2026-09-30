import type { Prisma } from "@prisma/client";
import { readParam, type SearchParamsRecord } from "@/components/saas-page/url-state";
import { prisma } from "@/lib/prisma";

// Same fallback the POS uses when a product has no threshold of its own.
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export const PRODUCT_VIEWS = ["active", "hidden", "low", "out"] as const;
export type ProductView = (typeof PRODUCT_VIEWS)[number];

export type ProductFilters = {
  q?: string;
  category?: string;
  view?: ProductView;
};

const isView = (v?: string): v is ProductView => !!v && (PRODUCT_VIEWS as readonly string[]).includes(v);

export function parseProductFilters(params: SearchParamsRecord | undefined): ProductFilters {
  const view = readParam(params, "view");
  return {
    q: readParam(params, "q"),
    category: readParam(params, "category"),
    view: isView(view) ? view : undefined,
  };
}

/** Condition for one tab. Low stock compares against each product's own threshold. */
export function viewWhere(view: ProductView): Prisma.ProductWhereInput {
  switch (view) {
    case "active":
      return { isActive: true };
    case "hidden":
      return { isActive: false };
    case "out":
      return { stock: { lte: 0 } };
    case "low":
      return {
        OR: [
          { lowStockThreshold: { not: null }, stock: { gt: 0, lte: prisma.product.fields.lowStockThreshold } },
          { lowStockThreshold: null, stock: { gt: 0, lte: DEFAULT_LOW_STOCK_THRESHOLD } },
        ],
      };
  }
}

/** Search + category (everything except the tab), shared by the list and the tab counts. */
export function baseProductWhere(storeId: string, { q, category }: ProductFilters): Prisma.ProductWhereInput {
  return {
    storeId,
    ...(category && { categoryId: category }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q } },
      ],
    }),
  };
}

export function productWhere(storeId: string, filters: ProductFilters): Prisma.ProductWhereInput {
  const base = baseProductWhere(storeId, filters);
  return filters.view ? { AND: [base, viewWhere(filters.view)] } : base;
}
