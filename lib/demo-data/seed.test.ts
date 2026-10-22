import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: Record<string, unknown[]> = {};
const record = (model: string) => ({
  createMany: vi.fn(({ data }: { data: unknown[] }) => {
    calls[model] = data;
    return { count: data.length };
  }),
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { ...record("product"), findFirst: vi.fn(async () => null) },
    category: record("category"),
    customer: record("customer"),
    order: record("order"),
    orderItem: record("orderItem"),
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

const { seedDemoData, DEMO_ORDER_COUNT } = await import("./seed");
const { demoKitFor, DEMO_SKU_PREFIX, DEMO_SESSION_PREFIX } = await import("./kits");

type Row = Record<string, unknown>;

describe("seedDemoData", () => {
  beforeEach(() => {
    for (const key of Object.keys(calls)) delete calls[key];
  });

  it.each(["ملابس وأزياء", "خدمات رقمية", "كتب وتعليم", "نشاط مش معروف"])("builds a consistent catalog for %s", async (type) => {
    const result = await seedDemoData("store-1234-5678", type);
    const kit = demoKitFor(type);
    const products = calls.product as Row[];
    const categories = calls.category as Row[];
    const orders = calls.order as Row[];
    const items = calls.orderItem as Row[];

    expect(result).toEqual({ products: kit.products.length, orders: DEMO_ORDER_COUNT, customers: (calls.customer as Row[]).length });
    expect(products.every((p) => String(p.sku).startsWith(DEMO_SKU_PREFIX))).toBe(true);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
    expect(products.every((p) => categories.some((c) => c.id === p.categoryId))).toBe(true);
    expect((calls.customer as Row[]).every((c) => /^01[0125]\d{8}$/.test(String(c.phone)))).toBe(true);

    for (const order of orders) {
      expect(String(order.guestSessionId).startsWith(DEMO_SESSION_PREFIX)).toBe(true);
      const lines = items.filter((i) => i.orderId === order.id);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.every((l) => products.some((p) => p.id === l.productId))).toBe(true);
      const subtotal = lines.reduce((sum, l) => sum + Number(l.price) * Number(l.quantity), 0);
      expect(order.subtotal).toBe(subtotal);
      expect(order.total).toBe(subtotal + Number(order.shipping));
      expect(Number.isInteger(order.total)).toBe(true);
    }
  });

  it("never offers cash on delivery for a digital-only order", async () => {
    await seedDemoData("store-1", "خدمات رقمية");
    for (const order of calls.order as Row[]) {
      expect(order.paymentMethod).not.toBe("cash_on_delivery");
      expect(order.shipping).toBe(0);
    }
  });
});
