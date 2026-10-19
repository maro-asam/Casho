import { LoyaltyTransactionType, OrderSource, OrderStatus, PosReturnStatus, PosShiftStatus, Prisma } from "@prisma/client";

import { ORDER_CHANNELS, paymentMethodLabel } from "@/app/(merchant)/dashboard/orders/_components/order-meta";
import { formatMoney, formatNumber, formatPercent } from "@/app/(merchant)/dashboard/_components/overview/format";
import { prisma } from "@/lib/prisma";
import {
  buildBuckets,
  bucketKey,
  cairoParts,
  formatRange,
  hourLabel,
  type Granularity,
  type ReportRange,
} from "./range";
import type { Insight, InventoryRow, ProductRow, ReportsData, TopCustomer } from "./types";
import { lazyList, tr } from "@/lib/i18n/dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;
const VELOCITY_DAYS = 90;
const RUNNING_OUT_DAYS = 14;
const DEFAULT_LOW_STOCK = 5;
const ARABIC_WEEKDAYS = lazyList(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]);

const orderSelect = {
  id: true,
  createdAt: true,
  status: true,
  source: true,
  paymentMethod: true,
  paymentStatus: true,
  paidAt: true,
  shipping: true,
  total: true,
  couponCode: true,
  phone: true,
  fullName: true,
  customerId: true,
  cashierId: true,
  branchId: true,
  items: { select: { productId: true, price: true, costPrice: true, quantity: true, discountAmount: true } },
  splitPayments: { select: { paymentMethod: true, amount: true } },
} satisfies Prisma.OrderSelect;

type ReportOrder = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

const returnSelect = {
  refundAmount: true,
  branchId: true,
  createdAt: true,
  originalOrder: { select: { source: true, cashierId: true } },
  items: { select: { productId: true, quantity: true, unitPrice: true } },
} satisfies Prisma.PosReturnSelect;

type ReportReturn = Prisma.PosReturnGetPayload<{ select: typeof returnSelect }>;

type ProductInfo = {
  id: string;
  name: string;
  image: string;
  category: string;
  /** Piasters, null when unknown. */
  cost: number | null;
};

// ── Small helpers ───────────────────────────────────────────────

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

/** Egyptian numbers in one shape so "+20 10…" and "010…" are one customer. */
function customerKey(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null; // walk-in ("-") or junk
  if (digits.startsWith("20") && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
}

const isCollected = (o: Pick<ReportOrder, "status" | "paidAt" | "paymentStatus">) =>
  o.status === OrderStatus.PAID ||
  o.status === OrderStatus.DELIVERED ||
  !!o.paidAt ||
  o.paymentStatus?.toUpperCase() === "PAID";

/**
 * Cost per unit in piasters, or null when unknown. Older POS sales saved 0 for
 * products without a cost price, so a 0 snapshot only counts when the product
 * really has a cost of 0.
 */
function unitCostOf(item: { productId: string; costPrice: number | null }, products: Map<string, ProductInfo>) {
  if (item.costPrice != null && item.costPrice > 0) return item.costPrice;
  return products.get(item.productId)?.cost ?? null;
}

/**
 * Splits each order's net merchandise value (total − shipping) across its lines,
 * so line revenue already has item and order discounts taken off. Works the same
 * for POS (subtotal after item discounts) and online (subtotal before coupon).
 */
function orderLines(order: ReportOrder, products: Map<string, ProductInfo>) {
  const net = Math.max(0, order.total - order.shipping);
  const afterItem = order.items.map((i) => Math.max(0, i.price * i.quantity - (i.discountAmount ?? 0)));
  const base = afterItem.reduce((s, v) => s + v, 0);
  const factor = base > 0 ? net / base : 0;

  return order.items.map((item, idx) => {
    const unitCost = unitCostOf(item, products);
    return {
      productId: item.productId,
      quantity: item.quantity,
      gross: item.price * item.quantity,
      net: afterItem[idx] * factor,
      cost: unitCost === null ? null : unitCost * item.quantity,
    };
  });
}

/** The money summary used for both the current and the previous period. */
function summarize(orders: ReportOrder[], returns: ReportReturn[], products: Map<string, ProductInfo>) {
  let grossSales = 0;
  let netBeforeReturns = 0;
  let coveredNet = 0;
  let cogs = 0;
  let units = 0;
  let shipping = 0;
  let totalPaid = 0;
  let validOrders = 0;
  let canceled = 0;
  const customers = new Set<string>();

  for (const order of orders) {
    if (order.status === OrderStatus.CANCELED) {
      canceled++;
      continue;
    }
    validOrders++;
    shipping += order.shipping;
    totalPaid += order.total;
    const key = customerKey(order.phone);
    if (key) customers.add(key);

    for (const line of orderLines(order, products)) {
      grossSales += line.gross;
      netBeforeReturns += line.net;
      units += line.quantity;
      if (line.cost !== null) {
        coveredNet += line.net;
        cogs += line.cost;
      }
    }
  }

  let returnsAmount = 0;
  let returnedCoveredNet = 0;
  let returnedCost = 0;
  for (const ret of returns) {
    returnsAmount += ret.refundAmount;
    for (const item of ret.items) {
      const cost = products.get(item.productId)?.cost;
      if (cost == null) continue;
      returnedCoveredNet += item.unitPrice * item.quantity;
      returnedCost += cost * item.quantity;
    }
  }

  const netSales = Math.round(netBeforeReturns - returnsAmount);
  const profitBase = coveredNet - returnedCoveredNet;
  const grossProfit = Math.round(profitBase - (cogs - returnedCost));

  return {
    grossSales,
    discounts: Math.max(0, Math.round(grossSales - netBeforeReturns)),
    returns: returnsAmount,
    netSales,
    netBeforeReturns,
    cogs: Math.round(cogs - returnedCost),
    grossProfit,
    margin: profitBase > 0 ? (grossProfit / profitBase) * 100 : 0,
    costCoverage: ratio(coveredNet, netBeforeReturns),
    units,
    shipping,
    validOrders,
    orders: orders.length,
    canceled,
    cancelRate: ratio(canceled, orders.length) * 100,
    aov: validOrders > 0 ? Math.round(totalPaid / validOrders) : 0,
    customers: customers.size,
    onlineOrders: orders.filter((o) => o.source === OrderSource.ONLINE && o.status !== OrderStatus.CANCELED).length,
  };
}

const visitBucketFormat: Record<Granularity, string> = { hour: "FMHH24", day: "YYYY-MM-DD", month: "YYYY-MM" };

// ── Loader ──────────────────────────────────────────────────────

/**
 * @param branchIds null = the whole store (online + every branch). Otherwise only
 *   those branches: their POS sales, returns, shifts and shelf stock. Customers,
 *   reviews, coupons and loyalty are business-level and stay store-wide.
 */
export async function getReportsData(
  storeId: string,
  range: ReportRange,
  branchIds: string[] | null = null,
): Promise<ReportsData> {
  const now = new Date();
  const inBranches = branchIds ? { branchId: { in: branchIds } } : {};
  const velocitySince = new Date(now.getTime() - VELOCITY_DAYS * DAY_MS);
  const cairoTs = Prisma.sql`(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Cairo')`;

  const [
    store,
    orders,
    prevOrders,
    returns,
    prevReturns,
    visitSeries,
    [visitTotals],
    productRows,
    velocity,
    everSold,
    crmTotal,
    crmNew,
    coupons,
    reviewGroups,
    periodReviews,
    loyaltyGroups,
    shifts,
  ] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { settings: { select: { defaultLowStockThreshold: true } } } }),
    prisma.order.findMany({
      where: { storeId, ...inBranches, createdAt: { gte: range.from, lt: range.to } },
      select: orderSelect,
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { storeId, ...inBranches, createdAt: { gte: range.prevFrom, lt: range.prevTo } },
      select: orderSelect,
    }),
    prisma.posReturn.findMany({
      where: { storeId, ...inBranches, status: PosReturnStatus.COMPLETED, createdAt: { gte: range.from, lt: range.to } },
      select: returnSelect,
    }),
    prisma.posReturn.findMany({
      where: { storeId, ...inBranches, status: PosReturnStatus.COMPLETED, createdAt: { gte: range.prevFrom, lt: range.prevTo } },
      select: returnSelect,
    }),
    // Visits can be large, so they are bucketed in the database.
    prisma.$queryRaw<{ bucket: string; visitors: bigint }[]>`
      SELECT to_char(${cairoTs}, ${visitBucketFormat[range.granularity]}) AS bucket,
             COUNT(DISTINCT COALESCE("ip", "id"))::bigint AS visitors
      FROM "Visit"
      WHERE "storeId" = ${storeId} AND "createdAt" >= ${range.from} AND "createdAt" < ${range.to}
      GROUP BY 1
    `,
    prisma.$queryRaw<{ visits: bigint; visitors: bigint; prev_visits: bigint; prev_visitors: bigint }[]>`
      SELECT COUNT(*) FILTER (WHERE "createdAt" >= ${range.from})::bigint AS visits,
             COUNT(DISTINCT COALESCE("ip", "id")) FILTER (WHERE "createdAt" >= ${range.from})::bigint AS visitors,
             COUNT(*) FILTER (WHERE "createdAt" < ${range.from})::bigint AS prev_visits,
             COUNT(DISTINCT COALESCE("ip", "id")) FILTER (WHERE "createdAt" < ${range.from})::bigint AS prev_visitors
      FROM "Visit"
      WHERE "storeId" = ${storeId} AND "createdAt" >= ${range.prevFrom} AND "createdAt" < ${range.to}
    `,
    prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        image: true,
        stock: true,
        price: true,
        costPrice: true,
        lowStockThreshold: true,
        isActive: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
    // Sales speed for "runs out in N days" — independent of the chosen range.
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { storeId, ...inBranches, status: { not: OrderStatus.CANCELED } }, createdAt: { gte: velocitySince } },
      _sum: { quantity: true },
      _max: { createdAt: true },
    }),
    prisma.order.findFirst({ where: { storeId }, select: { id: true } }),
    prisma.customer.count({ where: { storeId } }),
    prisma.customer.count({ where: { storeId, createdAt: { gte: range.from, lt: range.to } } }),
    prisma.coupon.findMany({
      where: { storeId },
      select: { code: true, type: true, value: true, isActive: true, expiresAt: true, usageLimit: true, usedCount: true },
    }),
    prisma.productReview.groupBy({ by: ["rating"], where: { storeId }, _count: { _all: true } }),
    prisma.productReview.count({ where: { storeId, createdAt: { gte: range.from, lt: range.to } } }),
    prisma.loyaltyTransaction.groupBy({
      by: ["type"],
      where: { customer: { storeId }, createdAt: { gte: range.from, lt: range.to } },
      _sum: { points: true },
    }),
    prisma.posShift.findMany({
      where: { storeId, ...inBranches, openedAt: { gte: range.from, lt: range.to } },
      select: { status: true, cashDifference: true, branchId: true },
    }),
  ]);

  const [branchRows, branchStock] = await Promise.all([
    prisma.branch.findMany({ where: { storeId }, select: { id: true, name: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    // Shelf stock of the selected branches replaces the store-wide total.
    branchIds
      ? prisma.branchInventory.groupBy({
          by: ["productId"],
          where: { branchId: { in: branchIds }, variantId: null },
          _sum: { quantity: true },
        })
      : Promise.resolve(null),
  ]);
  if (branchStock) {
    const qty = new Map(branchStock.map((r) => [r.productId, r._sum.quantity ?? 0]));
    for (const p of productRows) p.stock = qty.get(p.id) ?? 0;
  }

  const products = new Map<string, ProductInfo>(
    productRows.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category.name,
        cost: p.costPrice == null ? null : Math.round(p.costPrice * 100),
      },
    ]),
  );

  const cur = summarize(orders, returns, products);
  const prev = summarize(prevOrders, prevReturns, products);
  const valid = orders.filter((o) => o.status !== OrderStatus.CANCELED);

  // Storefront traffic belongs to no branch: only shown for the whole store.
  const visits = branchIds
    ? { current: 0, visitors: 0, prevVisits: 0, prevVisitors: 0 }
    : {
        current: Number(visitTotals?.visits ?? 0),
        visitors: Number(visitTotals?.visitors ?? 0),
        prevVisits: Number(visitTotals?.prev_visits ?? 0),
        prevVisitors: Number(visitTotals?.prev_visitors ?? 0),
      };
  const conversion = (online: number, visitors: number) => (visitors > 0 ? (online / visitors) * 100 : 0);

  // ── Time series (previous period aligned by position) ─────────
  const buckets = buildBuckets(range.fromKey, range.days, range.granularity);
  const prevBuckets = buildBuckets(range.prevFromKey, range.prevDays, range.granularity);
  const series = buckets.map((b) => ({
    ...b,
    netSales: 0,
    orders: 0,
    profit: 0,
    visitors: 0,
    prevNetSales: 0,
    prevOrders: 0,
    prevProfit: 0,
    prevVisitors: 0,
  }));
  const indexOf = new Map(buckets.map((b, i) => [b.key, i]));
  const prevIndexOf = new Map(prevBuckets.map((b, i) => [b.key, i]));

  const addToSeries = (list: ReportOrder[], previous: boolean) => {
    for (const order of list) {
      if (order.status === OrderStatus.CANCELED) continue;
      const i = (previous ? prevIndexOf : indexOf).get(bucketKey(order.createdAt, range.granularity));
      if (i === undefined || i >= series.length) continue;
      let net = 0;
      let profit = 0;
      for (const line of orderLines(order, products)) {
        net += line.net;
        if (line.cost !== null) profit += line.net - line.cost;
      }
      const point = series[i];
      if (previous) {
        point.prevNetSales += net;
        point.prevOrders += 1;
        point.prevProfit += profit;
      } else {
        point.netSales += net;
        point.orders += 1;
        point.profit += profit;
      }
    }
  };
  addToSeries(orders, false);
  addToSeries(prevOrders, true);
  for (const ret of returns) {
    const i = indexOf.get(bucketKey(ret.createdAt, range.granularity));
    if (i !== undefined) series[i].netSales -= ret.refundAmount;
  }
  for (const row of visitSeries) {
    const i = indexOf.get(row.bucket);
    if (i !== undefined) series[i].visitors = Number(row.visitors);
  }
  for (const point of series) {
    point.netSales = Math.round(point.netSales);
    point.profit = Math.round(point.profit);
    point.prevNetSales = Math.round(point.prevNetSales);
    point.prevProfit = Math.round(point.prevProfit);
  }

  // ── Channels, payments, statuses, timing ──────────────────────
  const channelMap = new Map<OrderSource, { orders: number; netSales: number; paid: number }>();
  const paymentMap = new Map<string, { amount: number; count: number }>();
  const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  const weekdays = ARABIC_WEEKDAYS.map((_, weekday) => ({ weekday, orders: 0, netSales: 0 }));
  let collected = 0;
  let outstanding = 0;
  let outstandingOrders = 0;

  for (const order of valid) {
    const net = order.total - order.shipping;
    const channel = channelMap.get(order.source) ?? { orders: 0, netSales: 0, paid: 0 };
    channel.orders++;
    channel.netSales += net;
    channel.paid += order.total;
    channelMap.set(order.source, channel);

    // POS split payments are real amounts per method; otherwise the whole total.
    const parts = order.splitPayments.length
      ? order.splitPayments
      : [{ paymentMethod: order.paymentMethod, amount: order.total }];
    for (const part of parts) {
      const entry = paymentMap.get(part.paymentMethod) ?? { amount: 0, count: 0 };
      entry.amount += part.amount;
      entry.count++;
      paymentMap.set(part.paymentMethod, entry);
    }

    const { weekday, hour } = cairoParts(order.createdAt);
    heatmap[weekday][hour]++;
    weekdays[weekday].orders++;
    weekdays[weekday].netSales += net;

    if (isCollected(order)) collected += order.total;
    else {
      outstanding += order.total;
      outstandingOrders++;
    }
  }

  const channelTotal = [...channelMap.values()].reduce((s, c) => s + c.netSales, 0);
  const channels = [...channelMap.entries()]
    .map(([source, c]) => ({
      source,
      orders: c.orders,
      netSales: c.netSales,
      aov: Math.round(c.paid / c.orders),
      share: ratio(c.netSales, channelTotal),
    }))
    .sort((a, b) => b.netSales - a.netSales);

  const paymentTotal = [...paymentMap.values()].reduce((s, p) => s + p.amount, 0);
  const payments = [...paymentMap.entries()]
    .map(([method, p]) => ({ method, label: paymentMethodLabel(method), ...p, share: ratio(p.amount, paymentTotal) }))
    .sort((a, b) => b.amount - a.amount);

  const statuses = (Object.values(OrderStatus) as OrderStatus[]).map((status) => {
    const list = orders.filter((o) => o.status === status);
    return { status, count: list.length, value: list.reduce((s, o) => s + o.total, 0) };
  });

  // ── Products & categories ─────────────────────────────────────
  const productStats = new Map<string, { units: number; net: number; cost: number; costKnown: boolean }>();
  for (const order of valid) {
    for (const line of orderLines(order, products)) {
      const s = productStats.get(line.productId) ?? { units: 0, net: 0, cost: 0, costKnown: true };
      s.units += line.quantity;
      s.net += line.net;
      if (line.cost === null) s.costKnown = false;
      else s.cost += line.cost;
      productStats.set(line.productId, s);
    }
  }
  for (const ret of returns) {
    for (const item of ret.items) {
      const s = productStats.get(item.productId);
      if (!s) continue;
      s.units -= item.quantity;
      s.net -= item.unitPrice * item.quantity;
      const cost = products.get(item.productId)?.cost;
      if (cost != null) s.cost -= cost * item.quantity;
    }
  }

  const stockById = new Map(productRows.map((p) => [p.id, p.stock]));
  const productNetTotal = [...productStats.values()].reduce((s, p) => s + Math.max(0, p.net), 0);
  const productList: ProductRow[] = [...productStats.entries()]
    .map(([id, s]) => {
      const info = products.get(id);
      const profit = s.costKnown ? Math.round(s.net - s.cost) : null;
      return {
        id,
        name: info?.name ?? tr("منتج محذوف"),
        image: info?.image ?? "/images/product-placeholder.png",
        category: info?.category ?? "—",
        units: s.units,
        netSales: Math.round(s.net),
        profit,
        margin: profit !== null && s.net > 0 ? (profit / s.net) * 100 : null,
        share: ratio(Math.max(0, s.net), productNetTotal),
        stock: stockById.get(id) ?? 0,
      };
    })
    .sort((a, b) => b.netSales - a.netSales);

  let concentration: ReportsData["concentration"] = null;
  if (productList.length >= 3) {
    let running = 0;
    const n = productList.findIndex((p) => (running += p.share) >= 0.8) + 1;
    if (n > 0) concentration = { products: n, share: running };
  }

  const categoryMap = new Map<string, { units: number; netSales: number; cost: number; costKnown: boolean }>();
  for (const [id, s] of productStats) {
    const name = products.get(id)?.category ?? "—";
    const c = categoryMap.get(name) ?? { units: 0, netSales: 0, cost: 0, costKnown: true };
    c.units += s.units;
    c.netSales += s.net;
    c.cost += s.cost;
    if (!s.costKnown) c.costKnown = false;
    categoryMap.set(name, c);
  }
  const categories = [...categoryMap.entries()]
    .map(([name, c]) => ({
      name,
      units: c.units,
      netSales: Math.round(c.netSales),
      profit: c.costKnown ? Math.round(c.netSales - c.cost) : null,
      share: ratio(Math.max(0, c.netSales), productNetTotal),
    }))
    .sort((a, b) => b.netSales - a.netSales);

  const soldIds = new Set(productStats.keys());
  const unsoldAll = productRows
    .filter((p) => p.isActive && p.stock > 0 && !soldIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      category: p.category.name,
      stock: p.stock,
      valueRetail: Math.round(p.price * 100) * p.stock,
    }))
    .sort((a, b) => b.valueRetail - a.valueRetail);

  const productsMissingCost = new Set(
    valid.flatMap((o) => o.items.filter((i) => unitCostOf(i, products) === null).map((i) => i.productId)),
  ).size;

  // ── Customers ─────────────────────────────────────────────────
  const byCustomer = new Map<string, { customerId: string | null; name: string; phone: string; orders: number; spend: number; last: Date }>();
  let walkInOrders = 0;
  let walkInSales = 0;
  for (const order of valid) {
    const key = customerKey(order.phone);
    if (!key) {
      walkInOrders++;
      walkInSales += order.total;
      continue;
    }
    const c = byCustomer.get(key) ?? { customerId: null, name: order.fullName, phone: order.phone, orders: 0, spend: 0, last: order.createdAt };
    c.orders++;
    c.spend += order.total;
    c.customerId ??= order.customerId;
    if (order.createdAt >= c.last) {
      c.last = order.createdAt;
      c.name = order.fullName || c.name;
    }
    byCustomer.set(key, c);
  }

  // A customer is "new" when their first-ever (non-canceled) order is inside the range.
  const rawPhones = [...new Set(valid.map((o) => o.phone).filter((p) => customerKey(p)))];
  const firstOrders = rawPhones.length
    ? await prisma.order.groupBy({
        by: ["phone"],
        where: { storeId, phone: { in: rawPhones }, status: { not: OrderStatus.CANCELED } },
        _min: { createdAt: true },
      })
    : [];
  const firstSeen = new Map<string, Date>();
  for (const row of firstOrders) {
    const key = customerKey(row.phone);
    const at = row._min.createdAt;
    if (!key || !at) continue;
    const known = firstSeen.get(key);
    if (!known || at < known) firstSeen.set(key, at);
  }

  let newCount = 0;
  let newRevenue = 0;
  let returningRevenue = 0;
  let repeaters = 0;
  const topCustomers: TopCustomer[] = [];
  for (const [key, c] of byCustomer) {
    const isNew = (firstSeen.get(key) ?? range.from) >= range.from;
    if (isNew) {
      newCount++;
      newRevenue += c.spend;
    } else returningRevenue += c.spend;
    if (c.orders > 1) repeaters++;
    topCustomers.push({ key, customerId: c.customerId, name: c.name || tr("عميل"), phone: c.phone, orders: c.orders, spend: c.spend, lastOrderAt: c.last, isNew });
  }
  topCustomers.sort((a, b) => b.spend - a.spend);

  const loyaltySum = (type: LoyaltyTransactionType) =>
    Math.abs(loyaltyGroups.find((g) => g.type === type)?._sum.points ?? 0);

  // ── Inventory (a "now" view, not tied to the range) ───────────
  const defaultLow = store?.settings?.defaultLowStockThreshold ?? DEFAULT_LOW_STOCK;
  const velocityById = new Map(velocity.map((v) => [v.productId, { sold: v._sum.quantity ?? 0, last: v._max.createdAt }]));
  const active = productRows.filter((p) => p.isActive);
  const toInventoryRow = (p: (typeof productRows)[number]): InventoryRow => {
    const v = velocityById.get(p.id);
    const dailyRate = (v?.sold ?? 0) / VELOCITY_DAYS;
    return {
      id: p.id,
      name: p.name,
      image: p.image,
      stock: p.stock,
      dailyRate,
      daysLeft: dailyRate > 0 ? p.stock / dailyRate : null,
      valueCost: p.costPrice == null ? null : Math.round(p.costPrice * 100) * p.stock,
      valueRetail: Math.round(p.price * 100) * p.stock,
      lastSoldAt: v?.last ?? null,
    };
  };

  const inStock = active.filter((p) => p.stock > 0).map(toInventoryRow);
  const runningOut = inStock
    .filter((r) => r.daysLeft !== null && r.daysLeft <= RUNNING_OUT_DAYS)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  // Dead stock: nothing sold in 90 days, and the product is old enough to judge.
  const deadStock = active
    .filter((p) => p.stock > 0 && !velocityById.has(p.id) && p.createdAt < velocitySince)
    .map(toInventoryRow)
    .sort((a, b) => (b.valueCost ?? b.valueRetail) - (a.valueCost ?? a.valueRetail));
  const outOfStock = active
    .filter((p) => p.stock <= 0)
    .map((p) => {
      const row = toInventoryRow(p);
      return { id: p.id, name: p.name, image: p.image, lastSoldAt: row.lastSoldAt, dailyRate: row.dailyRate };
    })
    .sort((a, b) => b.dailyRate - a.dailyRate);

  const inventory = {
    activeProducts: active.length,
    units: inStock.reduce((s, r) => s + r.stock, 0),
    valueCost: inStock.reduce((s, r) => s + (r.valueCost ?? 0), 0),
    valueRetail: inStock.reduce((s, r) => s + r.valueRetail, 0),
    productsMissingCost: inStock.filter((r) => r.valueCost === null).length,
    outOfStock: outOfStock.length,
    lowStock: active.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? defaultLow)).length,
    deadStockValue: deadStock.reduce((s, r) => s + (r.valueCost ?? r.valueRetail), 0),
    deadStockCount: deadStock.length,
  };

  // ── Reviews ───────────────────────────────────────────────────
  const reviewTotal = reviewGroups.reduce((s, g) => s + g._count._all, 0);
  const reviews = {
    periodCount: periodReviews,
    total: reviewTotal,
    average: reviewTotal > 0 ? reviewGroups.reduce((s, g) => s + g.rating * g._count._all, 0) / reviewTotal : 0,
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviewGroups.find((g) => g.rating === rating)?._count._all ?? 0,
    })),
  };

  // ── POS ───────────────────────────────────────────────────────
  const posOrders = valid.filter((o) => o.source === OrderSource.POS);
  let pos: ReportsData["pos"] = null;
  if (posOrders.length || shifts.length || returns.length) {
    const cashierIds = [...new Set(posOrders.map((o) => o.cashierId).filter((id): id is string => !!id))];
    const users = cashierIds.length
      ? await prisma.user.findMany({ where: { id: { in: cashierIds } }, select: { id: true, name: true, email: true } })
      : [];
    const names = new Map(users.map((u) => [u.id, u.name || u.email]));

    const cashierMap = new Map<string, { orders: number; netSales: number; discounts: number }>();
    for (const order of posOrders) {
      const id = order.cashierId ?? "unknown";
      const c = cashierMap.get(id) ?? { orders: 0, netSales: 0, discounts: 0 };
      c.orders++;
      c.netSales += order.total;
      c.discounts += Math.max(0, order.items.reduce((s, i) => s + i.price * i.quantity, 0) - order.total);
      cashierMap.set(id, c);
    }

    const returnedProducts = new Map<string, { quantity: number; amount: number }>();
    for (const ret of returns) {
      for (const item of ret.items) {
        const r = returnedProducts.get(item.productId) ?? { quantity: 0, amount: 0 };
        r.quantity += item.quantity;
        r.amount += item.unitPrice * item.quantity;
        returnedProducts.set(item.productId, r);
      }
    }

    const closed = shifts.filter((s) => s.status === PosShiftStatus.CLOSED && s.cashDifference !== null);
    const posNet = posOrders.reduce((s, o) => s + o.total, 0);

    // Side by side per branch — every figure is a plain sum within one branch.
    const shownBranches = branchRows.filter((b) => !branchIds || branchIds.includes(b.id));
    const byBranch = shownBranches.map((b) => {
      const bOrders = posOrders.filter((o) => o.branchId === b.id);
      const bShifts = shifts.filter((s) => s.branchId === b.id);
      const bReturns = returns.filter((r) => r.branchId === b.id);
      return {
        id: b.id,
        name: b.name,
        orders: bOrders.length,
        netSales: bOrders.reduce((s, o) => s + o.total, 0),
        returns: bReturns.reduce((s, r) => s + r.refundAmount, 0),
        shifts: bShifts.length,
        openShifts: bShifts.filter((s) => s.status === PosShiftStatus.OPEN).length,
        cashDifference: bShifts.reduce((s, x) => s + (x.status === PosShiftStatus.CLOSED ? (x.cashDifference ?? 0) : 0), 0),
      };
    });

    pos = {
      orders: posOrders.length,
      netSales: posNet,
      branches: byBranch.length > 1 ? byBranch.sort((a, b) => b.netSales - a.netSales) : [],
      cashiers: [...cashierMap.entries()]
        .map(([id, c]) => ({
          id,
          name: names.get(id) ?? tr("غير معروف"),
          orders: c.orders,
          netSales: c.netSales,
          aov: Math.round(c.netSales / c.orders),
          discounts: c.discounts,
        }))
        .sort((a, b) => b.netSales - a.netSales),
      shifts: {
        count: shifts.length,
        open: shifts.filter((s) => s.status === PosShiftStatus.OPEN).length,
        netDifference: closed.reduce((s, x) => s + (x.cashDifference ?? 0), 0),
        shortageShifts: closed.filter((s) => (s.cashDifference ?? 0) < 0).length,
        shortage: closed.reduce((s, x) => s + Math.min(0, x.cashDifference ?? 0), 0),
        overage: closed.reduce((s, x) => s + Math.max(0, x.cashDifference ?? 0), 0),
      },
      returns: {
        count: returns.length,
        amount: cur.returns,
        rate: ratio(cur.returns, cur.netBeforeReturns) * 100,
        topProducts: [...returnedProducts.entries()]
          .map(([id, r]) => ({ name: products.get(id)?.name ?? tr("منتج محذوف"), ...r }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
      },
    };
  }

  // ── Coupons ───────────────────────────────────────────────────
  const couponStats = new Map<string, { uses: number; discount: number; sales: number; customers: Set<string> }>();
  let couponSales = 0;
  for (const order of valid) {
    if (!order.couponCode) continue;
    const code = order.couponCode.toUpperCase();
    const s = couponStats.get(code) ?? { uses: 0, discount: 0, sales: 0, customers: new Set<string>() };
    s.uses++;
    s.discount += Math.max(0, order.items.reduce((sum, i) => sum + i.price * i.quantity, 0) + order.shipping - order.total);
    s.sales += order.total;
    const key = customerKey(order.phone);
    if (key) s.customers.add(key);
    couponStats.set(code, s);
    couponSales += order.total;
  }
  const couponRows = coupons
    .map((c) => {
      const s = couponStats.get(c.code.toUpperCase());
      const status: ReportsData["coupons"][number]["status"] =
        c.expiresAt && c.expiresAt < now
          ? "expired"
          : c.usageLimit != null && c.usedCount >= c.usageLimit
            ? "used_up"
            : c.isActive
              ? "active"
              : "inactive";
      return {
        code: c.code,
        type: c.type,
        value: c.value,
        status,
        uses: s?.uses ?? 0,
        discount: s?.discount ?? 0,
        sales: s?.sales ?? 0,
        customers: s?.customers.size ?? 0,
      };
    })
    .sort((a, b) => b.sales - a.sales || b.uses - a.uses);

  // ── Insights: facts the merchant wouldn't spot from the KPIs ──
  const insights: Insight[] = [];
  const validCount = valid.length;

  if (validCount >= 5) {
    let peak = { weekday: 0, hour: 0, count: 0 };
    heatmap.forEach((row, weekday) =>
      row.forEach((count, hour) => {
        if (count > peak.count) peak = { weekday, hour, count };
      }),
    );
    const bestDay = [...weekdays].sort((a, b) => b.netSales - a.netSales)[0];
    insights.push({
      tone: "info",
      text: tr("أكتر وقت بيجيلك فيه طلبات يوم {0} من {1} لـ {2}، وأعلى يوم مبيعات هو {3}.", ARABIC_WEEKDAYS[peak.weekday], hourLabel(peak.hour), hourLabel((peak.hour + 1) % 24), ARABIC_WEEKDAYS[bestDay.weekday]),
    });
  }
  if (concentration && productList.length >= 5) {
    insights.push({
      tone: "info",
      text: tr("{0} منتج بس من {1} بيعملوا {2} من مبيعاتك. خلي بالك إن مخزونهم ميخلصش.", formatNumber(concentration.products), formatNumber(productList.length), formatPercent(concentration.share * 100)),
    });
  }
  if (outstandingOrders > 0) {
    insights.push({
      tone: "warning",
      text: tr("{0} طلب بـ {1} لسه فلوسهم متحصّلتش (قيد المراجعة أو مع شركة الشحن).", formatNumber(outstandingOrders), formatMoney(outstanding)),
    });
  }
  if (productsMissingCost > 0 && cur.netBeforeReturns > 0) {
    insights.push({
      tone: "warning",
      text:
        cur.costCoverage === 0
          ? tr("مفيش ولا منتج من اللي اتباعوا ({0} منتج) ليه سعر تكلفة، فمش هنقدر نحسب ربحك. ضيف سعر التكلفة من صفحة المنتج.", formatNumber(productsMissingCost))
          : tr("{0} منتج اتباعوا من غير سعر تكلفة، فالربح محسوب على {1} من المبيعات بس. ضيف سعر التكلفة للمنتجات عشان الربح يبقى دقيق.", formatNumber(productsMissingCost), formatPercent(cur.costCoverage * 100)),
    });
  }
  if (runningOut.length > 0) {
    insights.push({
      tone: "warning",
      text: tr("{0} منتج هيخلصوا خلال أسبوعين بمعدل البيع الحالي، أولهم \"{1}\".", formatNumber(runningOut.length), runningOut[0].name),
    });
  }
  if (inventory.deadStockCount > 0) {
    insights.push({
      tone: "warning",
      text: tr("بضاعة قيمتها {0} ({1} منتج) متباعتش ولا قطعة من ٩٠ يوم. ممكن تعمل عليها عرض.", formatMoney(inventory.deadStockValue), formatNumber(inventory.deadStockCount)),
    });
  }
  if (byCustomer.size >= 5 && returningRevenue > 0) {
    insights.push({
      tone: "positive",
      text: tr("{0} من مبيعات العملاء المعروفين جت من ناس اشتروا منك قبل كده.", formatPercent(ratio(returningRevenue, newRevenue + returningRevenue) * 100)),
    });
  }
  if (cur.grossSales > 0 && ratio(cur.discounts, cur.grossSales) >= 0.15) {
    insights.push({
      tone: "warning",
      text: tr("الخصومات أخدت {0} من إجمالي المبيعات ({1}).", formatPercent(ratio(cur.discounts, cur.grossSales) * 100), formatMoney(cur.discounts)),
    });
  }
  if (channels.length > 1) {
    const top = channels[0];
    insights.push({
      tone: "info",
      text: tr("{0} جاب {1} من صافي المبيعات.", ORDER_CHANNELS[top.source].label, formatPercent(top.share * 100)),
    });
  }
  if (pos && pos.shifts.shortage < 0) {
    insights.push({
      tone: "warning",
      text: tr("عجز في درج الكاش {0} في {1} وردية.", formatMoney(Math.abs(pos.shifts.shortage)), formatNumber(pos.shifts.shortageShifts)),
    });
  }

  return {
    range: {
      preset: range.preset,
      fromKey: range.fromKey,
      toKey: range.toKey,
      days: range.days,
      granularity: range.granularity,
      label: formatRange(range.fromKey, range.toKey),
      previousLabel: formatRange(range.prevFromKey, range.prevToKey),
    },
    hasEverSold: !!everSold,
    kpis: {
      netSales: { current: cur.netSales, previous: prev.netSales },
      grossProfit: { current: cur.grossProfit, previous: prev.grossProfit },
      orders: { current: cur.validOrders, previous: prev.validOrders },
      aov: { current: cur.aov, previous: prev.aov },
      visitors: { current: visits.visitors, previous: visits.prevVisitors },
      conversion: {
        current: conversion(cur.onlineOrders, visits.visitors),
        previous: conversion(prev.onlineOrders, visits.prevVisitors),
      },
      customers: { current: cur.customers, previous: prev.customers },
      cancelRate: { current: cur.cancelRate, previous: prev.cancelRate },
    },
    pnl: {
      grossSales: { current: cur.grossSales, previous: prev.grossSales },
      discounts: { current: cur.discounts, previous: prev.discounts },
      returns: { current: cur.returns, previous: prev.returns },
      netSales: { current: cur.netSales, previous: prev.netSales },
      cogs: cur.cogs,
      grossProfit: { current: cur.grossProfit, previous: prev.grossProfit },
      margin: { current: cur.margin, previous: prev.margin },
      shipping: cur.shipping,
      costCoverage: cur.costCoverage,
      productsMissingCost,
      units: { current: cur.units, previous: prev.units },
      itemsPerOrder: ratio(cur.units, cur.validOrders),
      collected,
      outstanding,
      outstandingOrders,
      canceledOrders: cur.canceled,
      canceledValue: orders.filter((o) => o.status === OrderStatus.CANCELED).reduce((s, o) => s + o.total, 0),
      visits: visits.current,
    },
    series,
    channels,
    payments,
    statuses,
    heatmap,
    weekdays,
    products: productList.slice(0, 100),
    productsSoldCount: productList.length,
    concentration,
    categories,
    unsold: unsoldAll.slice(0, 12),
    unsoldCount: unsoldAll.length,
    customers: {
      unique: { current: cur.customers, previous: prev.customers },
      new: newCount,
      returning: byCustomer.size - newCount,
      repeatRate: ratio(repeaters, byCustomer.size) * 100,
      avgSpend: byCustomer.size ? Math.round((newRevenue + returningRevenue) / byCustomer.size) : 0,
      newRevenue,
      returningRevenue,
      walkInOrders,
      walkInSales,
      crmTotal,
      crmNew,
    },
    topCustomers: topCustomers.slice(0, 10),
    loyalty: { earned: loyaltySum(LoyaltyTransactionType.EARNED), redeemed: loyaltySum(LoyaltyTransactionType.REDEEMED) },
    inventory,
    runningOut: runningOut.slice(0, 10),
    deadStock: deadStock.slice(0, 10),
    outOfStock: outOfStock.slice(0, 10),
    reviews,
    pos,
    coupons: couponRows,
    couponShare: ratio(couponSales, valid.reduce((s, o) => s + o.total, 0)),
    insights: insights.slice(0, 7),
  };
}
