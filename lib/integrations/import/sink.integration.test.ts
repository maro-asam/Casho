/**
 * Integration test of the Prisma sink against a real Postgres engine (PGlite,
 * in-process WASM — never your DATABASE_URL). Skipped unless the optional dev
 * packages are installed:
 *
 *   npm i -D @electric-sql/pglite pglite-prisma-adapter
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { execFileSync } from "child_process";

async function optional(name: string) {
  try {
    return await import(/* @vite-ignore */ name);
  } catch {
    return null;
  }
}
const pgliteModule = await optional("@electric-sql/pglite");
const adapterModule = await optional("pglite-prisma-adapter");
const available = !!pgliteModule && !!adapterModule;
const holder = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return holder.client; } }));
vi.mock("@/lib/entitlements", () => ({
  FEATURE_KEYS: { PRODUCTS: "products" },
  checkLimit: vi.fn(async () => ({ enabled: true, isUnlimited: false, limit: 50, current: 0 })),
}));

const { PrismaClient } = await import("@prisma/client");
const { createPrismaSink } = await import("@/lib/integrations/import/sink");
const { mapProduct, mapCustomer, mapOrder, mapCollection } = await import("@/lib/integrations/shopify/mappers");

type P = InstanceType<typeof PrismaClient>;
let prisma: P;
const ctx = { storeId: "store-A", provider: "SHOPIFY" as const, externalShopId: "gid://shopify/Shop/1" };

const variant = (id: number, size: string, qty: number) => ({
  id: `gid://shopify/ProductVariant/${id}`, title: size, sku: `SKU-${id}`, barcode: null, price: "100.00", compareAtPrice: null,
  inventoryQuantity: qty, selectedOptions: [{ name: "Size", value: size }], inventoryItem: { tracked: true, unitCost: { amount: "40" } },
});
const productNode = (qtyS: number) => ({
  id: "gid://shopify/Product/1", title: "Tee", handle: "tee", descriptionHtml: "<p>Soft</p>", vendor: "Acme", productType: "Tops",
  tags: ["new"], status: "ACTIVE", createdAt: "2025-01-01T00:00:00Z", options: [{ name: "Size", values: ["S", "M"] }],
  media: { nodes: [{ image: { url: "https://cdn.shopify.com/tee.jpg" } }] }, collections: { nodes: [{ id: "gid://shopify/Collection/9" }] },
  variants: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [variant(11, "S", qtyS), variant(12, "M", 5)] },
});
const customerNode = (phone: string, id = 5) => ({
  id: `gid://shopify/Customer/${id}`, firstName: "Mona", lastName: "Ali", displayName: "Mona Ali", note: null, tags: ["vip"], createdAt: null,
  defaultEmailAddress: { emailAddress: "mona@example.com" }, defaultPhoneNumber: { phoneNumber: phone }, defaultAddress: null,
});
const orderNode = {
  id: "gid://shopify/Order/100", name: "#1001", createdAt: "2025-02-01T00:00:00Z", cancelledAt: null, displayFinancialStatus: "PAID",
  displayFulfillmentStatus: "FULFILLED", currencyCode: "EGP", email: null, phone: null, note: null, paymentGatewayNames: ["COD"], discountCodes: [],
  subtotalPriceSet: { shopMoney: { amount: "300" } }, totalShippingPriceSet: { shopMoney: { amount: "0" } }, totalDiscountsSet: { shopMoney: { amount: "0" } },
  totalPriceSet: { shopMoney: { amount: "300" } }, customer: { id: "gid://shopify/Customer/5" },
  shippingAddress: { name: "Mona Ali", address1: "Nile St", city: "Cairo", phone: "+201001234567" }, billingAddress: null,
  lineItems: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [
    { title: "Tee", variantTitle: "S", sku: "SKU-11", quantity: 2, originalUnitPriceSet: { shopMoney: { amount: "100" } }, discountAllocations: [], variant: { id: "gid://shopify/ProductVariant/11" }, product: { id: "gid://shopify/Product/1" } },
    { title: "Old hat", variantTitle: null, sku: null, quantity: 1, originalUnitPriceSet: { shopMoney: { amount: "100" } }, discountAllocations: [], variant: null, product: { id: "gid://shopify/Product/deleted" } },
  ] },
};

beforeAll(async () => {
  if (!available) return;
  const pg = new pgliteModule.PGlite();
  // Current schema + the partial unique indexes that only exist in migrations.
  const schemaSql = execFileSync("npx", ["prisma", "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  await pg.exec(schemaSql);
  await pg.exec(`
    CREATE UNIQUE INDEX "BranchInventory_branch_product_no_variant_key" ON "BranchInventory"("branchId", "productId") WHERE "variantId" IS NULL;
    CREATE UNIQUE INDEX "ImportJob_one_active_per_store" ON "ImportJob"("storeId", "provider") WHERE "status" IN ('QUEUED', 'RUNNING', 'PAUSED');
  `);
  prisma = new PrismaClient({ adapter: new adapterModule.PrismaPGlite(pg) }) as P;
  holder.client = prisma;
  await prisma.user.create({ data: { id: "u1", email: "o@x.com" } });
  await prisma.store.create({ data: { id: "store-A", name: "A", slug: "a", userId: "u1" } });
  await prisma.store.create({ data: { id: "store-B", name: "B", slug: "b", userId: "u1" } });
  await prisma.branch.create({ data: { id: "br-A", storeId: "store-A", name: "Main", isDefault: true } });
  // A customer that already exists in Casho with the same phone (must be linked, not duplicated)
  await prisma.customer.create({ data: { storeId: "store-A", phone: "01001234567", name: "Mona (Casho)" } });
});

async function importAll() {
  const sink = createPrismaSink(ctx);
  await sink.prepare!();
  return [
    await sink.apply(mapCollection({ id: "gid://shopify/Collection/9", title: "Summer", handle: "summer", image: null })),
    await sink.apply(mapProduct(productNode(3) as never)),
    await sink.apply(mapCustomer(customerNode("+201001234567") as never)),
    await sink.apply(mapCustomer(customerNode("", 6) as never)),
    await sink.apply(mapOrder(orderNode as never)),
  ].map((o) => o.result);
}

describe.skipIf(!available)("Prisma sink on a real Postgres engine", () => {
  it("imports collections, products+variants+inventory, customers and orders", async () => {
    expect(await importAll()).toEqual(["imported", "imported", "imported", "skipped", "imported"]);

    const product = await prisma.product.findFirstOrThrow({ where: { storeId: "store-A", name: "Tee" }, include: { category: true, variants: true } });
    expect(product).toMatchObject({ price: 100, stock: 8, hasVariants: true, sizes: ["S", "M"], brand: "Acme", image: "https://cdn.shopify.com/tee.jpg", description: "Soft" });
    expect(product.category.name).toBe("Summer");
    expect(product.variants.map((v) => [v.sku, v.stock, v.costPrice])).toEqual([["SKU-11", 3, 40], ["SKU-12", 5, 40]]);
    const branch = await prisma.branchInventory.findFirstOrThrow({ where: { productId: product.id, variantId: null } });
    expect(branch.quantity).toBe(8);
    expect(await prisma.stockMovement.count({ where: { productId: product.id, type: "INITIAL" } })).toBe(1);

    expect(await prisma.customer.count({ where: { storeId: "store-A" } })).toBe(1); // linked to the existing one
    const customer = await prisma.customer.findFirstOrThrow({ where: { storeId: "store-A" }, include: { tags: { include: { tag: true } } } });
    expect(customer).toMatchObject({ name: "Mona (Casho)", email: "mona@example.com" }); // merchant's name kept, blank filled
    expect(customer.tags.map((t) => t.tag.name)).toEqual(["vip"]);

    const order = await prisma.order.findFirstOrThrow({ where: { storeId: "store-A" }, include: { items: { include: { product: true } } } });
    expect(order).toMatchObject({ total: 30000, status: "DELIVERED", customerId: customer.id, paymentReference: "#1001", phone: "01001234567" });
    expect(order.items.map((i) => [i.product.name, i.price, i.quantity])).toEqual(
      expect.arrayContaining([["Tee", 10000, 2], ["منتج غير متاح (من طلبات مستوردة)", 10000, 1]]),
    );
    expect(order.items).toHaveLength(2);
    // imported orders never consume stock
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(8);
  });

  it("duplicate import: a second run updates/keeps — never duplicates", async () => {
    const counts = async () => Promise.all([prisma.product.count(), prisma.productVariant.count(), prisma.category.count(), prisma.customer.count(), prisma.order.count(), prisma.orderItem.count(), prisma.importRecordMap.count()]);
    const before = await counts();
    expect(await importAll()).toEqual(["updated", "updated", "updated", "skipped", "unchanged"]);
    expect(await counts()).toEqual(before);
  });

  it("re-import syncs stock changes through the default branch", async () => {
    const sink = createPrismaSink(ctx);
    await sink.prepare!();
    await sink.apply(mapProduct(productNode(10) as never)); // S: 3 → 10
    const product = await prisma.product.findFirstOrThrow({ where: { storeId: "store-A", name: "Tee" } });
    expect(product.stock).toBe(15);
    expect((await prisma.branchInventory.findFirstOrThrow({ where: { productId: product.id, variantId: null } })).quantity).toBe(15);
    expect(await prisma.stockMovement.count({ where: { productId: product.id, type: "ADJUSTMENT", quantity: 7 } })).toBe(1);
  });

  it("concurrent duplicate create is stopped by the database constraint", async () => {
    const node = { ...productNode(1), id: "gid://shopify/Product/2", title: "Cap", handle: "cap", variants: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ ...variant(21, "One", 1), selectedOptions: [] }] }, options: [] };
    const [a, b] = [createPrismaSink(ctx), createPrismaSink(ctx)];
    await Promise.all([a.prepare!(), b.prepare!()]);
    const results = await Promise.all([a.apply(mapProduct(node as never)), b.apply(mapProduct(node as never))]);
    expect(results.map((r) => r.result).sort()).toEqual(["imported", "updated"]);
    expect(await prisma.product.count({ where: { name: "Cap" } })).toBe(1);
  });

  it("tenant isolation: the same Shopify shop imported into another store stays separate", async () => {
    const sinkB = createPrismaSink({ ...ctx, storeId: "store-B" });
    await sinkB.prepare!();
    expect((await sinkB.apply(mapProduct(productNode(3) as never))).result).toBe("imported");
    expect(await prisma.product.count({ where: { storeId: "store-B" } })).toBe(1);
    const productA = await prisma.product.findFirstOrThrow({ where: { storeId: "store-A", name: "Tee" } });
    expect(productA.stock).toBe(15); // store A untouched
  });

  it("only one unfinished import per store (database-enforced)", async () => {
    await prisma.importConnection.create({
      data: { id: "conn-A", storeId: "store-A", provider: "SHOPIFY", externalShopId: ctx.externalShopId, shopName: "A", shopDomain: "a.myshopify.com" },
    });
    const job = { storeId: "store-A", connectionId: "conn-A", provider: "SHOPIFY" as const, externalShopId: ctx.externalShopId, entities: ["PRODUCT" as const], progress: {} };
    const first = await prisma.importJob.create({ data: job });
    await expect(prisma.importJob.create({ data: job })).rejects.toMatchObject({ code: expect.stringMatching(/^(P2002|23505)$/) });
    await prisma.importJob.update({ where: { id: first.id }, data: { status: "COMPLETED" } });
    await expect(prisma.importJob.create({ data: job })).resolves.toBeTruthy();
  });

  it("plan limit: new products beyond the plan fail with a clear reason", async () => {
    const { checkLimit } = await import("@/lib/entitlements");
    vi.mocked(checkLimit).mockResolvedValueOnce({ enabled: true, isUnlimited: false, limit: 3, current: 3 } as never);
    const sink = createPrismaSink(ctx);
    await sink.prepare!();
    await expect(sink.apply(mapProduct({ ...productNode(1), id: "gid://shopify/Product/3", title: "Bag", handle: "bag" } as never))).rejects.toThrow(/للحد الأقصى لعدد المنتجات/);
  });
});
