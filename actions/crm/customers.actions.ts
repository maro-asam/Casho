"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { CustomerStatus } from "@prisma/client";

const PAGE_SIZE = 20;

async function getStoreId(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store.id;
}

// ─── List & Search ────────────────────────────────────────────────────────────

export async function GetCRMCustomersAction({
  page = 1,
  search = "",
  status,
  tagId,
  segmentId,
  sortBy = "createdAt",
  sortDir = "desc",
}: {
  page?: number;
  search?: string;
  status?: CustomerStatus;
  tagId?: string;
  segmentId?: string;
  sortBy?: "createdAt" | "totalSpend" | "points" | "walletBalance" | "orderCount";
  sortDir?: "asc" | "desc";
} = {}) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const where = {
    storeId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(tagId && { tags: { some: { tagId } } }),
    ...(segmentId && { segmentMemberships: { some: { segmentId } } }),
  };

  const orderBy =
    sortBy === "orderCount"
      ? { orders: { _count: sortDir as "asc" | "desc" } }
      : sortBy === "totalSpend"
      ? undefined
      : { [sortBy]: sortDir };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: orderBy ?? { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        status: true,
        points: true,
        walletBalance: true,
        createdAt: true,
        birthday: true,
        _count: { select: { orders: true } },
        orders: {
          select: { total: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        tags: {
          select: {
            tag: { select: { id: true, name: true, color: true } },
          },
        },
        segmentMemberships: {
          select: {
            segment: { select: { id: true, name: true, color: true } },
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  // Enrich with computed total spend
  const enriched = await Promise.all(
    customers.map(async (c) => {
      const agg = await prisma.order.aggregate({
        where: {
          customerId: c.id,
          status: { not: "CANCELED" },
        },
        _sum: { total: true },
        _count: true,
      });
      return {
        ...c,
        totalSpend: agg._sum.total ?? 0,
        orderCount: agg._count,
        lastOrder: c.orders[0] ?? null,
      };
    })
  );

  return {
    customers: enriched,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ─── Single Customer Profile ──────────────────────────────────────────────────

export async function GetCustomerProfileAction(customerId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
    include: {
      tags: { include: { tag: true } },
      segmentMemberships: { include: { segment: true } },
      staffNotes: { orderBy: { createdAt: "desc" } },
      loyaltyTransactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      walletTransactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!customer) return null;

  // Compute aggregate stats
  const [orderStats, topProducts, avgOrder] = await Promise.all([
    prisma.order.aggregate({
      where: { customerId, status: { not: "CANCELED" } },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { customerId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.aggregate({
      where: { customerId },
      _avg: { total: true },
    }),
  ]);

  // Get last order date
  const lastOrder = await prisma.order.findFirst({
    where: { customerId, status: { not: "CANCELED" } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, total: true, status: true },
  });

  // Enrich top products with names
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, image: true },
  });

  const enrichedTopProducts = topProducts.map((p) => ({
    ...p,
    product: products.find((pr) => pr.id === p.productId) ?? null,
  }));

  // Purchase frequency (avg days between orders)
  const orders = await prisma.order.findMany({
    where: { customerId, status: { not: "CANCELED" } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  let avgDaysBetweenOrders: number | null = null;
  if (orders.length >= 2) {
    const diffs: number[] = [];
    for (let i = 1; i < orders.length; i++) {
      const diff =
        (orders[i].createdAt.getTime() - orders[i - 1].createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      diffs.push(diff);
    }
    avgDaysBetweenOrders = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  // Health score
  const healthScore = await computeHealthScore({
    lastOrderDate: lastOrder?.createdAt ?? null,
    orderCount: orderStats._count,
    totalSpend: orderStats._sum.total ?? 0,
  });

  return {
    ...customer,
    totalSpend: orderStats._sum.total ?? 0,
    orderCount: orderStats._count,
    avgOrderValue: avgOrder._avg.total ?? 0,
    lifetimeValue: orderStats._sum.total ?? 0,
    lastOrderDate: lastOrder?.createdAt ?? null,
    topProducts: enrichedTopProducts,
    avgDaysBetweenOrders,
    healthScore,
  };
}

// ─── Create / Update ──────────────────────────────────────────────────────────

export async function CreateCRMCustomerAction(data: {
  phone: string;
  name?: string;
  email?: string;
  address?: string;
  birthday?: string;
  notes?: string;
  status?: CustomerStatus;
}) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const existing = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId, phone: data.phone } },
  });
  if (existing) return { success: false as const, message: "رقم الهاتف مسجل بالفعل" };

  const customer = await prisma.customer.create({
    data: {
      storeId,
      phone: data.phone,
      name: data.name,
      email: data.email,
      address: data.address,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      notes: data.notes,
      status: data.status ?? "ACTIVE",
    },
  });

  revalidatePath("/dashboard/crm");
  revalidatePath("/dashboard/crm/customers");
  return { success: true as const, customer };
}

export async function UpdateCRMCustomerAction(
  customerId: string,
  data: {
    name?: string;
    email?: string;
    address?: string;
    birthday?: string | null;
    notes?: string;
    status?: CustomerStatus;
  }
) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
  });
  if (!customer) return { success: false as const, message: "العميل غير موجود" };

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: data.name,
      email: data.email,
      address: data.address,
      birthday: data.birthday
        ? new Date(data.birthday)
        : data.birthday === null
        ? null
        : undefined,
      notes: data.notes,
      status: data.status,
    },
  });

  // Log timeline event
  await prisma.customerTimeline.create({
    data: {
      customerId,
      storeId,
      eventType: "PROFILE_UPDATED",
      title: "تحديث بيانات العميل",
      description: "تم تحديث بيانات الملف الشخصي",
    },
  });

  revalidatePath(`/dashboard/crm/customers/${customerId}`);
  revalidatePath("/dashboard/crm/customers");
  return { success: true as const };
}

export async function DeleteCRMCustomerAction(customerId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
  });
  if (!customer) return { success: false as const, message: "العميل غير موجود" };

  await prisma.customer.delete({ where: { id: customerId } });

  revalidatePath("/dashboard/crm");
  revalidatePath("/dashboard/crm/customers");
  return { success: true as const };
}

// ─── Health Score ─────────────────────────────────────────────────────────────

export async function computeHealthScore({
  lastOrderDate,
  orderCount,
  totalSpend,
}: {
  lastOrderDate: Date | null;
  orderCount: number;
  totalSpend: number;
}): {
  score: number;
  category: "HEALTHY" | "ACTIVE" | "AT_RISK" | "LOST";
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
} {
  // Recency (0–100, weight 40%)
  let recencyScore = 0;
  if (lastOrderDate) {
    const days = Math.floor(
      (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 7) recencyScore = 100;
    else if (days <= 14) recencyScore = 85;
    else if (days <= 30) recencyScore = 70;
    else if (days <= 60) recencyScore = 50;
    else if (days <= 90) recencyScore = 30;
    else if (days <= 180) recencyScore = 15;
    else recencyScore = 0;
  }

  // Frequency (0–100, weight 30%)
  let frequencyScore = 0;
  if (orderCount >= 10) frequencyScore = 100;
  else if (orderCount >= 7) frequencyScore = 80;
  else if (orderCount >= 5) frequencyScore = 60;
  else if (orderCount >= 3) frequencyScore = 40;
  else if (orderCount === 2) frequencyScore = 20;
  else if (orderCount === 1) frequencyScore = 10;

  // Monetary (0–100, weight 30%)  — in piasters
  const spendEGP = totalSpend / 100;
  let monetaryScore = 0;
  if (spendEGP >= 50000) monetaryScore = 100;
  else if (spendEGP >= 20000) monetaryScore = 80;
  else if (spendEGP >= 10000) monetaryScore = 60;
  else if (spendEGP >= 5000) monetaryScore = 40;
  else if (spendEGP >= 1000) monetaryScore = 20;
  else if (spendEGP > 0) monetaryScore = 10;

  const score = Math.round(
    recencyScore * 0.4 + frequencyScore * 0.3 + monetaryScore * 0.3
  );

  let category: "HEALTHY" | "ACTIVE" | "AT_RISK" | "LOST";
  if (score >= 75) category = "HEALTHY";
  else if (score >= 50) category = "ACTIVE";
  else if (score >= 25) category = "AT_RISK";
  else category = "LOST";

  return { score, category, recencyScore, frequencyScore, monetaryScore };
}

// ─── Smart Insights ───────────────────────────────────────────────────────────

export async function GetCustomerInsightsAction(customerId: string) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, storeId },
    select: { name: true, createdAt: true, points: true },
  });
  if (!customer) return [];

  const [orders, avgStoreSpend] = await Promise.all([
    prisma.order.findMany({
      where: { customerId, status: { not: "CANCELED" } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.aggregate({
      where: { storeId, status: { not: "CANCELED" } },
      _avg: { total: true },
    }),
  ]);

  const insights: { type: "info" | "warning" | "success"; text: string }[] = [];

  if (orders.length === 0) {
    insights.push({ type: "info", text: "لم يقم هذا العميل بأي طلب بعد" });
    return insights;
  }

  const lastOrder = orders[0];
  const daysSinceLast = Math.floor(
    (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLast > 60)
    insights.push({
      type: "warning",
      text: `لم يشتر هذا العميل منذ ${daysSinceLast} يوم — قد يحتاج إلى تواصل`,
    });
  else if (daysSinceLast <= 7)
    insights.push({
      type: "success",
      text: `اشترى هذا العميل منذ ${daysSinceLast} يوم فقط — عميل نشط`,
    });

  // Purchase frequency
  if (orders.length >= 2) {
    const allDays = orders.map((o) => o.createdAt.getTime());
    const totalDiff = allDays[0] - allDays[allDays.length - 1];
    const avgDays = Math.round(totalDiff / (orders.length - 1) / (1000 * 60 * 60 * 24));
    if (avgDays > 0)
      insights.push({
        type: "info",
        text: `يشتري هذا العميل بمعدل كل ${avgDays} يوم`,
      });
  }

  // Compare to average
  const totalSpend = orders.reduce((s, o) => s + o.total, 0);
  const storeAvg = avgStoreSpend._avg.total ?? 0;
  if (storeAvg > 0) {
    const ratio = totalSpend / orders.length / storeAvg;
    if (ratio >= 3)
      insights.push({
        type: "success",
        text: `ينفق ${Math.round(ratio)}x أكثر من متوسط العملاء`,
      });
    else if (ratio >= 1.5)
      insights.push({
        type: "success",
        text: `ينفق أكثر من المتوسط بنسبة ${Math.round((ratio - 1) * 100)}%`,
      });
  }

  if (orders.length >= 5)
    insights.push({ type: "success", text: `عميل مخلص — ${orders.length} طلبات مكتملة` });

  if (customer.points > 500)
    insights.push({
      type: "info",
      text: `لديه ${customer.points} نقطة ولاء لم تُستخدم — ذكّره باستردادها`,
    });

  return insights;
}

// ─── Birthday List ────────────────────────────────────────────────────────────

export async function GetUpcomingBirthdaysAction(days = 30) {
  const userId = await requireUserId();
  const storeId = await getStoreId(userId);

  const all = await prisma.customer.findMany({
    where: {
      storeId,
      birthday: { not: null },
      status: { not: "BLOCKED" },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      birthday: true,
    },
  });

  const now = new Date();
  const upcoming = all
    .filter((c) => {
      if (!c.birthday) return false;
      const bday = new Date(c.birthday);
      const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      const diff = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= days;
    })
    .map((c) => {
      const bday = new Date(c.birthday!);
      const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      const daysUntil = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return upcoming;
}
