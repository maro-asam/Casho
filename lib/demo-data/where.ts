import type { Prisma } from "@prisma/client";
import { DEMO_SESSION_PREFIX, DEMO_SKU_PREFIX } from "./kits";

// Filters that leave the onboarding sample catalog out of counts: what the
// merchant really added, and orders real customers placed.

export const REAL_PRODUCTS: Prisma.ProductWhereInput = { OR: [{ sku: null }, { NOT: { sku: { startsWith: DEMO_SKU_PREFIX } } }] };
export const REAL_ORDERS: Prisma.OrderWhereInput = { NOT: { guestSessionId: { startsWith: DEMO_SESSION_PREFIX } } };
/** Sample categories are created with a "demo-" slug (lib/demo-data/seed.ts). */
export const REAL_CATEGORIES: Prisma.CategoryWhereInput = { NOT: { slug: { startsWith: "demo-" } } };
