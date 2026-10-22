// Seeds (and later removes) a sample catalog with a week of orders, so a new
// merchant lands on a dashboard that already has numbers, charts and orders to
// click through. Server-only: imported by server actions, never a "use server" file
// itself (that would expose these functions as public endpoints).

import { randomUUID } from "crypto";
import { OrderSource, OrderStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DIGITAL_ADDRESS } from "@/lib/products/digital";
import {
  DEMO_CUSTOMER_NOTE,
  DEMO_CUSTOMERS,
  DEMO_SESSION_PREFIX,
  DEMO_SKU_PREFIX,
  demoKitFor,
} from "./kits";

const DAY = 24 * 60 * 60 * 1000;
const DEMO_SHIPPING = 5000; // piasters

/** Spread over the last ~10 days so the overview chart and KPIs have a shape. */
const ORDER_PLAN: { daysAgo: number; hour: number; status: OrderStatus; lines: [number, number][] }[] = [
  { daysAgo: 9, hour: 13, status: OrderStatus.DELIVERED, lines: [[0, 1], [2, 1]] },
  { daysAgo: 8, hour: 20, status: OrderStatus.DELIVERED, lines: [[1, 2]] },
  { daysAgo: 6, hour: 11, status: OrderStatus.DELIVERED, lines: [[3, 1], [0, 1]] },
  { daysAgo: 5, hour: 22, status: OrderStatus.CANCELED, lines: [[1, 1]] },
  { daysAgo: 4, hour: 16, status: OrderStatus.DELIVERED, lines: [[2, 1]] },
  { daysAgo: 2, hour: 19, status: OrderStatus.SHIPPED, lines: [[4, 1], [1, 1]] },
  { daysAgo: 1, hour: 10, status: OrderStatus.SHIPPED, lines: [[0, 2]] },
  { daysAgo: 0, hour: -2, status: OrderStatus.PENDING, lines: [[3, 1], [2, 1]] },
  { daysAgo: 0, hour: -1, status: OrderStatus.PENDING, lines: [[5, 1]] },
];

export const DEMO_ORDER_COUNT = ORDER_PLAN.length;

function randomPhone() {
  const prefix = ["010", "011", "012", "015"][Math.floor(Math.random() * 4)];
  return prefix + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
}

function atTime(daysAgo: number, hour: number, now: Date) {
  // Negative hour = "that many hours ago" (today's fresh orders).
  if (hour < 0) return new Date(now.getTime() + hour * 60 * 60 * 1000);
  const d = new Date(now.getTime() - daysAgo * DAY);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

export async function hasDemoData(storeId: string) {
  const found = await prisma.product.findFirst({
    where: { storeId, sku: { startsWith: DEMO_SKU_PREFIX } },
    select: { id: true },
  });
  return Boolean(found);
}

export type SeedResult = { products: number; orders: number; customers: number };

/** Idempotent: a store that already has the sample catalog is left alone. */
export async function seedDemoData(storeId: string, businessType: string | null | undefined): Promise<SeedResult> {
  const kit = demoKitFor(businessType);
  if (await hasDemoData(storeId)) return { products: 0, orders: 0, customers: 0 };

  const now = new Date();
  const tag = randomUUID().slice(0, 6);

  const categories = kit.categories.map((name, i) => ({
    id: randomUUID(),
    storeId,
    name,
    slug: `demo-${i + 1}-${tag}`,
  }));

  const products = kit.products.map((p, i) => ({
    id: randomUUID(),
    storeId,
    categoryId: categories[p.category].id,
    name: p.name,
    slug: `${kit.id}-${i + 1}-${tag}`,
    sku: `${DEMO_SKU_PREFIX}${String(i + 1).padStart(3, "0")}`,
    description: p.description,
    price: p.price * 100,
    compareAtPrice: p.compareAt ? p.compareAt * 100 : null,
    costPrice: Math.round(p.price * 0.55) * 100,
    stock: p.digital ? 0 : p.stock,
    isDigital: Boolean(p.digital),
    image: p.image,
    images: [p.image],
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    isActive: true,
    isFeatured: i < 2,
    createdAt: new Date(now.getTime() - 12 * DAY),
  }));

  const customers = DEMO_CUSTOMERS.map((c, i) => ({
    id: randomUUID(),
    storeId,
    name: c.name,
    phone: randomPhone(),
    address: c.address,
    notes: DEMO_CUSTOMER_NOTE,
    createdAt: new Date(now.getTime() - (11 - i) * DAY),
  }));

  const orders: Prisma.OrderCreateManyInput[] = [];
  const items: Prisma.OrderItemCreateManyInput[] = [];

  ORDER_PLAN.forEach((plan, n) => {
    const customer = customers[n % customers.length];
    const governorate = DEMO_CUSTOMERS[n % customers.length].governorate;
    const lines = plan.lines.map(([index, quantity]) => ({ product: products[index % products.length], quantity }));
    // Two lines can land on the same product in small kits — merge them.
    const merged = [...new Map(lines.map((l) => [l.product.id, l])).values()];
    const digitalOnly = merged.every((l) => l.product.isDigital);
    const createdAt = atTime(plan.daysAgo, plan.hour, now);
    const orderId = randomUUID();

    const subtotal = merged.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
    const costTotal = merged.reduce((sum, l) => sum + (l.product.costPrice ?? 0) * l.quantity, 0);
    const shipping = digitalOnly ? 0 : DEMO_SHIPPING;
    const settled = plan.status === OrderStatus.DELIVERED || (digitalOnly && plan.status !== OrderStatus.CANCELED && plan.status !== OrderStatus.PENDING);

    orders.push({
      id: orderId,
      storeId,
      guestSessionId: `${DEMO_SESSION_PREFIX}${orderId}`,
      source: OrderSource.ONLINE,
      status: plan.status,
      paymentMethod: digitalOnly ? "instapay" : "cash_on_delivery",
      paymentStatus: settled ? "PAID" : null,
      paidAt: settled ? new Date(createdAt.getTime() + 2 * DAY) : null,
      subtotal,
      shipping,
      discount: 0,
      total: subtotal + shipping,
      costTotal,
      profitTotal: subtotal - costTotal,
      fullName: customer.name,
      phone: customer.phone,
      address: digitalOnly ? DIGITAL_ADDRESS : customer.address,
      governorate: digitalOnly ? null : governorate,
      customerId: customer.id,
      createdAt,
    });

    for (const line of merged) {
      items.push({
        orderId,
        productId: line.product.id,
        price: line.product.price,
        costPrice: line.product.costPrice,
        profitAmount: (line.product.price - (line.product.costPrice ?? 0)) * line.quantity,
        quantity: line.quantity,
        createdAt,
      });
    }
  });

  // One batched transaction: a handful of round trips instead of dozens, so it
  // never hits the interactive-transaction timeout on a remote database.
  await prisma.$transaction([
    prisma.category.createMany({ data: categories }),
    prisma.product.createMany({ data: products }),
    prisma.customer.createMany({ data: customers }),
    prisma.order.createMany({ data: orders }),
    prisma.orderItem.createMany({ data: items }),
  ]);

  return { products: products.length, orders: orders.length, customers: customers.length };
}

export type ClearResult = { products: number; orders: number; customers: number; kept: number };

/**
 * Removes the sample catalog. Products the merchant has since sold for real (or
 * tied to offers, banners…) can't be deleted; those are hidden instead.
 */
export async function clearDemoData(storeId: string): Promise<ClearResult> {
  const demoOrders = { storeId, guestSessionId: { startsWith: DEMO_SESSION_PREFIX } };

  const [, removedOrders] = await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { order: demoOrders } }),
    prisma.order.deleteMany({ where: demoOrders }),
  ]);

  const products = await prisma.product.findMany({
    where: { storeId, sku: { startsWith: DEMO_SKU_PREFIX } },
    select: { id: true, categoryId: true },
  });

  let removed = 0;
  let kept = 0;
  for (const product of products) {
    try {
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { productId: product.id } }),
        prisma.product.delete({ where: { id: product.id } }),
      ]);
      removed++;
    } catch {
      await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
      kept++;
    }
  }

  const { count: customers } = await prisma.customer.deleteMany({
    where: { storeId, notes: DEMO_CUSTOMER_NOTE, orders: { none: {} } },
  });

  await prisma.category
    .deleteMany({
      where: { storeId, slug: { startsWith: "demo-" }, products: { none: {} }, banners: { none: {} } },
    })
    .catch(() => {});

  return { products: removed, orders: removedOrders.count, customers, kept };
}
