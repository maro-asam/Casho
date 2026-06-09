"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { StockMovementType } from "@prisma/client";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

export async function GetInventoryOverviewAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const settings = await prisma.storeSettings.findUnique({
    where: { storeId: store.id },
    select: { defaultLowStockThreshold: true },
  });
  const threshold = settings?.defaultLowStockThreshold ?? 5;

  const [
    totalProducts,
    outOfStockCount,
    totalStockValue,
    recentMovements,
    lowStockProducts,
    supplierCount,
    pendingPOCount,
    pendingTransferCount,
  ] = await Promise.all([
    // Total active products
    prisma.product.count({
      where: { storeId: store.id, isActive: true },
    }),

    // Out of stock
    prisma.product.count({
      where: { storeId: store.id, isActive: true, stock: 0 },
    }),

    // Total inventory value (cost × stock)
    prisma.product.aggregate({
      where: { storeId: store.id, isActive: true },
      _sum: { stock: true },
    }),

    // Recent 10 movements
    prisma.stockMovement.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        quantity: true,
        stockBefore: true,
        stockAfter: true,
        note: true,
        createdAt: true,
        product: { select: { id: true, name: true, image: true } },
        variant: { select: { id: true, name: true } },
        branch: { select: { name: true } },
      },
    }),

    // Low stock products (raw SQL for efficiency)
    prisma.$queryRaw<
      { id: string; name: string; stock: number; threshold: number; image: string; category: string }[]
    >`
      SELECT p.id, p.name, p.stock,
             COALESCE(p."lowStockThreshold", ${threshold}) as threshold,
             p.image,
             c.name as category
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE p."storeId" = ${store.id}
        AND p."isActive" = true
        AND p.stock > 0
        AND p.stock <= COALESCE(p."lowStockThreshold", ${threshold})
      ORDER BY p.stock ASC
      LIMIT 20
    `,

    // Active suppliers
    prisma.supplier.count({
      where: { storeId: store.id, isActive: true },
    }),

    // Pending purchase orders
    prisma.purchaseOrder.count({
      where: { storeId: store.id, status: { in: ["DRAFT", "SENT", "PARTIAL"] } },
    }),

    // Pending transfers
    prisma.stockTransfer.count({
      where: { storeId: store.id, status: { in: ["PENDING", "APPROVED", "SHIPPED"] } },
    }),
  ]);

  // Compute inventory value & potential revenue from product data
  const products = await prisma.product.findMany({
    where: { storeId: store.id, isActive: true, stock: { gt: 0 } },
    select: { stock: true, price: true, costPrice: true },
  });

  let inventoryValue = 0; // cost-based
  let potentialRevenue = 0;
  for (const p of products) {
    const cost = (p.costPrice ?? 0) * p.stock;
    const rev = p.price * p.stock;
    inventoryValue += cost;
    potentialRevenue += rev;
  }

  const lowStockCount = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "Product"
    WHERE "storeId" = ${store.id}
      AND "isActive" = true
      AND stock > 0
      AND stock <= COALESCE("lowStockThreshold", ${threshold})
  `;

  return {
    totalProducts,
    totalStock: totalStockValue._sum.stock ?? 0,
    outOfStockCount,
    lowStockCount: Number(lowStockCount[0].count),
    inventoryValue,        // EGP (cost)
    potentialRevenue,      // EGP (selling price × stock)
    expectedProfit: potentialRevenue - inventoryValue,
    supplierCount,
    pendingPOCount,
    pendingTransferCount,
    recentMovements,
    lowStockProducts,
  };
}

export async function GetInventoryValueByCategory() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const products = await prisma.product.findMany({
    where: { storeId: store.id, isActive: true },
    select: {
      stock: true,
      price: true,
      costPrice: true,
      category: { select: { name: true } },
    },
  });

  const byCategory: Record<string, { name: string; value: number; items: number }> = {};
  for (const p of products) {
    const cat = p.category.name;
    if (!byCategory[cat]) byCategory[cat] = { name: cat, value: 0, items: 0 };
    byCategory[cat].value += (p.costPrice ?? 0) * p.stock;
    byCategory[cat].items += p.stock;
  }

  return Object.values(byCategory).sort((a, b) => b.value - a.value);
}

export async function GetStockMovementSummary(days: number = 30) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const movements = await prisma.stockMovement.groupBy({
    by: ["type"],
    where: { storeId: store.id, createdAt: { gte: since } },
    _sum: { quantity: true },
    _count: { id: true },
  });

  return movements.map((m) => ({
    type: m.type,
    totalQuantity: Math.abs(m._sum.quantity ?? 0),
    count: m._count.id,
  }));
}

export async function GetRestockRecommendations() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const settings = await prisma.storeSettings.findUnique({
    where: { storeId: store.id },
    select: { defaultLowStockThreshold: true },
  });
  const threshold = settings?.defaultLowStockThreshold ?? 5;

  // Get products with low/zero stock
  const lowStockProducts = await prisma.$queryRaw<
    { id: string; name: string; stock: number; threshold: number; image: string }[]
  >`
    SELECT id, name, stock,
           COALESCE("lowStockThreshold", ${threshold}) as threshold,
           image
    FROM "Product"
    WHERE "storeId" = ${store.id}
      AND "isActive" = true
      AND stock <= COALESCE("lowStockThreshold", ${threshold})
    ORDER BY stock ASC
    LIMIT 30
  `;

  // For each, calculate avg daily sales in last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const recommendations = await Promise.all(
    lowStockProducts.map(async (p) => {
      const salesMovements = await prisma.stockMovement.aggregate({
        where: {
          productId: p.id,
          type: StockMovementType.SALE,
          createdAt: { gte: since },
        },
        _sum: { quantity: true },
      });

      const totalSold = Math.abs(salesMovements._sum.quantity ?? 0);
      const avgDailySales = totalSold / 30;
      const daysUntilStockout = avgDailySales > 0 ? Math.floor(p.stock / avgDailySales) : null;
      const suggestedReorder = Math.max(
        Math.ceil(avgDailySales * 14), // 2 weeks supply
        p.threshold * 2,
      );

      return {
        ...p,
        avgDailySales: Math.round(avgDailySales * 10) / 10,
        daysUntilStockout,
        suggestedReorder,
        urgency: p.stock === 0 ? "out_of_stock" : daysUntilStockout !== null && daysUntilStockout <= 3 ? "critical" : "low",
      };
    }),
  );

  return recommendations.sort((a, b) => {
    const order: Record<string, number> = { out_of_stock: 0, critical: 1, low: 2 };
    return (order[a.urgency] ?? 3) - (order[b.urgency] ?? 3);
  });
}
