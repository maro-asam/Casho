/**
 * Writes normalized records into a Kasho store.
 *
 * Idempotency: every created Kasho row gets an ImportRecordMap row in the SAME
 * transaction, keyed by (store, provider, external shop, entity, external id)
 * with a unique constraint. A second run finds the map and updates instead of
 * creating; a concurrent duplicate create hits the constraint and rolls back.
 *
 * Side effects deliberately NOT triggered for imported history: stock is not
 * taken for imported orders, no order notifications/webhooks/loyalty points.
 */
import { OrderStatus, Prisma, type ImportEntityType, type ImportProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkLimit, FEATURE_KEYS } from "@/lib/entitlements";
import { adjustBranchQuantity, findDefaultBranchId } from "@/lib/inventory/branch-stock";
import { isUniqueViolation } from "./errors";
import { buildProductFields, orderLineFeatures, slugFor, toPiasters, variantStock } from "./kasho-fields";
import {
  ImportItemFailure,
  PROVIDER_LABELS,
  type ApplyOutcome,
  type ImportSink,
  type NormalizedCollection,
  type NormalizedCustomer,
  type NormalizedOrder,
  type NormalizedProduct,
  type NormalizedRecord,
  type NormalizedVariant,
} from "./types";

export { UNTRACKED_STOCK_QTY } from "./kasho-fields";

type Tx = Prisma.TransactionClient;
type Db = Tx | typeof prisma;

export type SinkContext = {
  storeId: string;
  provider: ImportProvider;
  externalShopId: string;
};

const PLACEHOLDER_EXTERNAL_ID = "__unavailable_product__";
const FALLBACK_CATEGORY = { name: "منتجات مستوردة", slug: "imported-products" };
const IMPORT_GUEST_SESSION = "import";
const MAX_CUSTOMER_TAGS = 20;
/** Products with hundreds of variants need more than Prisma's 5s default. */
const LONG_TX = { timeout: 30_000, maxWait: 10_000 };


// ─── Sink ────────────────────────────────────────────────────────────────────

export function createPrismaSink(ctx: SinkContext): ImportSink {
  let productQuota = Infinity;
  const categoryBySlug = new Map<string, string>();
  let placeholderProductId: string | null = null;

  const mapWhere = (entityType: ImportEntityType, externalId: string) => ({
    storeId_provider_externalShopId_entityType_externalId: {
      storeId: ctx.storeId,
      provider: ctx.provider,
      externalShopId: ctx.externalShopId,
      entityType,
      externalId,
    },
  });

  async function findMap(db: Db, entityType: ImportEntityType, externalId: string) {
    return db.importRecordMap.findUnique({
      where: mapWhere(entityType, externalId),
      select: { id: true, localId: true },
    });
  }

  /**
   * Links an external record to a freshly created local row. `staleMapId` is set
   * when a map existed but its Kasho row was deleted — the map is re-pointed.
   * Otherwise a plain create, so a concurrent duplicate fails on the constraint.
   */
  async function linkMap(tx: Tx, entityType: ImportEntityType, externalId: string, localId: string, staleMapId?: string) {
    if (staleMapId) {
      await tx.importRecordMap.update({ where: { id: staleMapId }, data: { localId } });
      return;
    }
    await tx.importRecordMap.create({
      data: {
        storeId: ctx.storeId,
        provider: ctx.provider,
        externalShopId: ctx.externalShopId,
        entityType,
        externalId,
        localId,
      },
    });
  }

  /**
   * Runs a create-path; if it loses a race on the unique map key, re-runs the
   * whole apply once (which then takes the "already imported" path).
   */
  async function createOrRecheck(
    entityType: ImportEntityType,
    record: NormalizedRecord,
    create: () => Promise<ApplyOutcome>,
  ): Promise<ApplyOutcome> {
    try {
      return await create();
    } catch (err) {
      if (isUniqueViolation(err) && (await findMap(prisma, entityType, record.externalId))) {
        return apply(record);
      }
      throw err;
    }
  }

  // ── Categories ──

  async function findOrCreateCategory(name: string, slug: string) {
    const cached = categoryBySlug.get(slug);
    if (cached) return cached;
    const category = await prisma.category.upsert({
      where: { storeId_slug: { storeId: ctx.storeId, slug } },
      create: { storeId: ctx.storeId, name, slug },
      update: {},
      select: { id: true },
    });
    categoryBySlug.set(slug, category.id);
    return category.id;
  }

  async function applyCollection(r: NormalizedCollection): Promise<ApplyOutcome> {
    const map = await findMap(prisma, "COLLECTION", r.externalId);
    if (map) {
      const existing = await prisma.category.findFirst({ where: { id: map.localId, storeId: ctx.storeId }, select: { id: true } });
      if (existing) {
        await prisma.category.update({
          where: { id: existing.id },
          data: { name: r.name, ...(r.imageUrl ? { image: r.imageUrl } : {}) },
        });
        return { result: "updated" };
      }
    }

    const slug = slugFor(r.handle || r.name, "collection", r.externalId);
    return createOrRecheck("COLLECTION", r, () =>
      prisma.$transaction(async (tx) => {
        // A Kasho category with the same slug is adopted instead of duplicated.
        const category = await tx.category.upsert({
          where: { storeId_slug: { storeId: ctx.storeId, slug } },
          create: { storeId: ctx.storeId, name: r.name, slug, image: r.imageUrl },
          update: {},
          select: { id: true },
        });
        await linkMap(tx, "COLLECTION", r.externalId, category.id, map?.id);
        return { result: "imported" } as const;
      }),
    );
  }

  async function resolveCategoryId(r: NormalizedProduct) {
    for (const collectionId of r.collectionExternalIds) {
      const map = await findMap(prisma, "COLLECTION", collectionId);
      if (map) {
        const exists = await prisma.category.findFirst({ where: { id: map.localId, storeId: ctx.storeId }, select: { id: true } });
        if (exists) return exists.id;
      }
    }
    if (r.productType?.trim()) {
      const name = r.productType.trim();
      return findOrCreateCategory(name, slugFor(name, "type", r.externalId));
    }
    return findOrCreateCategory(FALLBACK_CATEGORY.name, FALLBACK_CATEGORY.slug);
  }

  // ── Products ──

  async function bookStockChange(tx: Tx, productId: string, before: number, after: number, initial: boolean) {
    const delta = after - before;
    if (delta === 0) return;
    const branchId = await findDefaultBranchId(tx, ctx.storeId);
    if (branchId) await adjustBranchQuantity(tx, { storeId: ctx.storeId, branchId, productId, delta });
    await tx.stockMovement.create({
      data: {
        storeId: ctx.storeId,
        productId,
        branchId,
        type: initial ? "INITIAL" : "ADJUSTMENT",
        quantity: delta,
        stockBefore: before,
        stockAfter: after,
        reference: `import:${ctx.provider.toLowerCase()}`,
        note: initial ? "رصيد افتتاحي — مستورد" : "مزامنة المخزون من الاستيراد",
      },
    });
  }

  async function freeSku(tx: Tx, sku: string | null, exceptVariantId?: string) {
    if (!sku) return null;
    const taken = await tx.productVariant.findFirst({
      where: { storeId: ctx.storeId, sku, ...(exceptVariantId ? { NOT: { id: exceptVariantId } } : {}) },
      select: { id: true },
    });
    return taken ? null : sku;
  }

  async function upsertVariants(tx: Tx, productId: string, variants: NormalizedVariant[]) {
    for (const v of variants) {
      const data = {
        name: v.title.slice(0, 200) || "افتراضي",
        barcode: v.barcode,
        attributes: v.options,
        price: v.price,
        costPrice: v.costPrice,
        stock: variantStock(v),
        imageUrl: v.imageUrl,
      };
      const map = await findMap(tx, "VARIANT", v.externalId);
      const existing = map
        ? await tx.productVariant.findFirst({ where: { id: map.localId, storeId: ctx.storeId, productId }, select: { id: true } })
        : null;
      if (existing) {
        await tx.productVariant.update({
          where: { id: existing.id },
          data: { ...data, sku: await freeSku(tx, v.sku, existing.id) },
        });
      } else {
        const created = await tx.productVariant.create({
          data: { ...data, sku: await freeSku(tx, v.sku), storeId: ctx.storeId, productId },
          select: { id: true },
        });
        await linkMap(tx, "VARIANT", v.externalId, created.id, map?.id);
      }
    }
  }

  async function applyProduct(r: NormalizedProduct): Promise<ApplyOutcome> {
    const fields = buildProductFields(r);
    const categoryId = await resolveCategoryId(r);
    const map = await findMap(prisma, "PRODUCT", r.externalId);
    const existing = map
      ? await prisma.product.findFirst({ where: { id: map.localId, storeId: ctx.storeId }, select: { id: true, stock: true } })
      : null;

    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id: existing.id }, data: { ...fields, categoryId } });
        await bookStockChange(tx, existing.id, existing.stock, fields.stock, false);
        if (fields.hasVariants) await upsertVariants(tx, existing.id, r.variants);
      }, LONG_TX);
      return { result: "updated" };
    }

    if (productQuota <= 0) {
      throw new ImportItemFailure("وصلت للحد الأقصى لعدد المنتجات في باقتك — رقِّ الباقة ثم أعد محاولة العناصر الفاشلة");
    }

    const outcome = await createOrRecheck("PRODUCT", r, () =>
      prisma.$transaction(async (tx) => {
        const slug = `${slugFor(r.handle || r.name, "product", r.externalId)}-${crypto.randomUUID().slice(0, 6)}`;
        const product = await tx.product.create({
          data: { ...fields, slug, storeId: ctx.storeId, categoryId, ...(r.createdAt ? { createdAt: r.createdAt } : {}) },
          select: { id: true },
        });
        await linkMap(tx, "PRODUCT", r.externalId, product.id, map?.id);
        await bookStockChange(tx, product.id, 0, fields.stock, true);
        if (fields.hasVariants) await upsertVariants(tx, product.id, r.variants);
        return { result: "imported" } as const;
      }, LONG_TX),
    );
    if (outcome.result === "imported") productQuota--;
    return outcome;
  }

  /** Inactive stand-in for order lines whose product no longer exists in the source. */
  async function getPlaceholderProductId() {
    if (placeholderProductId) return placeholderProductId;
    const map = await findMap(prisma, "PRODUCT", PLACEHOLDER_EXTERNAL_ID);
    if (map && (await prisma.product.findFirst({ where: { id: map.localId, storeId: ctx.storeId }, select: { id: true } }))) {
      placeholderProductId = map.localId;
      return map.localId;
    }
    const categoryId = await findOrCreateCategory(FALLBACK_CATEGORY.name, FALLBACK_CATEGORY.slug);
    try {
      placeholderProductId = await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name: "منتج غير متاح (من طلبات مستوردة)",
            slug: `imported-unavailable-${crypto.randomUUID().slice(0, 8)}`,
            description: "يمثل منتجات اتحذفت من المتجر القديم وموجودة في طلبات قديمة فقط.",
            price: 0,
            stock: 0,
            isActive: false,
            storeId: ctx.storeId,
            categoryId,
          },
          select: { id: true },
        });
        await linkMap(tx, "PRODUCT", PLACEHOLDER_EXTERNAL_ID, product.id, map?.id);
        return product.id;
      });
    } catch (err) {
      const raced = isUniqueViolation(err) ? await findMap(prisma, "PRODUCT", PLACEHOLDER_EXTERNAL_ID) : null;
      if (!raced) throw err;
      placeholderProductId = raced.localId;
    }
    return placeholderProductId;
  }

  // ── Customers ──

  async function assignCustomerTags(tx: Tx, customerId: string, tags: string[]) {
    for (const name of tags.slice(0, MAX_CUSTOMER_TAGS)) {
      const tag = await tx.customerTag.upsert({
        where: { storeId_name: { storeId: ctx.storeId, name } },
        create: { storeId: ctx.storeId, name },
        update: {},
        select: { id: true },
      });
      await tx.customerTagAssignment.createMany({ data: [{ customerId, tagId: tag.id }], skipDuplicates: true });
    }
  }

  async function applyCustomer(r: NormalizedCustomer): Promise<ApplyOutcome> {
    if (!r.phone) return { result: "skipped", reason: "NO_PHONE" };
    const phone = r.phone;

    const map = await findMap(prisma, "CUSTOMER", r.externalId);
    const existing = map
      ? await prisma.customer.findFirst({ where: { id: map.localId, storeId: ctx.storeId }, select: { id: true } })
      : null;

    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.customer.update({
          where: { id: existing.id },
          data: {
            ...(r.name ? { name: r.name } : {}),
            ...(r.email ? { email: r.email } : {}),
            ...(r.address ? { address: r.address } : {}),
          },
        });
        await assignCustomerTags(tx, existing.id, r.tags);
      });
      return { result: "updated" };
    }

    return createOrRecheck("CUSTOMER", r, () =>
      prisma.$transaction(async (tx) => {
        // Kasho identifies customers by phone: an existing customer is linked, and
        // only their empty fields are filled — merchant edits are never overwritten.
        const byPhone = await tx.customer.findUnique({
          where: { storeId_phone: { storeId: ctx.storeId, phone } },
          select: { id: true, name: true, email: true, address: true, notes: true },
        });
        let customerId: string;
        if (byPhone) {
          await tx.customer.update({
            where: { id: byPhone.id },
            data: {
              ...(!byPhone.name && r.name ? { name: r.name } : {}),
              ...(!byPhone.email && r.email ? { email: r.email } : {}),
              ...(!byPhone.address && r.address ? { address: r.address } : {}),
              ...(!byPhone.notes && r.note ? { notes: r.note } : {}),
            },
          });
          customerId = byPhone.id;
        } else {
          const created = await tx.customer.create({
            data: {
              storeId: ctx.storeId,
              phone,
              name: r.name,
              email: r.email,
              address: r.address,
              notes: r.note,
              ...(r.createdAt ? { createdAt: r.createdAt } : {}),
            },
            select: { id: true },
          });
          customerId = created.id;
        }
        await linkMap(tx, "CUSTOMER", r.externalId, customerId, map?.id);
        await assignCustomerTags(tx, customerId, r.tags);
        return { result: "imported" } as const;
      }),
    );
  }

  // ── Orders ──

  async function applyOrder(r: NormalizedOrder): Promise<ApplyOutcome> {
    const map = await findMap(prisma, "ORDER", r.externalId);
    if (map) {
      const exists = await prisma.order.findFirst({ where: { id: map.localId, storeId: ctx.storeId }, select: { id: true } });
      // Orders are history: once imported they belong to Kasho (status changes,
      // shipping…) and a re-run never overwrites them.
      if (exists) return { result: "unchanged" };
    }

    let customerId: string | null = null;
    if (r.customerExternalId) {
      const customerMap = await findMap(prisma, "CUSTOMER", r.customerExternalId);
      if (customerMap) customerId = customerMap.localId;
    }
    if (!customerId && r.phone) {
      const byPhone = await prisma.customer.findUnique({
        where: { storeId_phone: { storeId: ctx.storeId, phone: r.phone } },
        select: { id: true },
      });
      customerId = byPhone?.id ?? null;
    }

    const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    for (const line of r.lines) {
      const productMap = line.productExternalId ? await findMap(prisma, "PRODUCT", line.productExternalId) : null;
      const productId = productMap?.localId ?? (await getPlaceholderProductId());
      const features = orderLineFeatures(line, !!productMap);
      items.push({
        product: { connect: { id: productId } },
        price: toPiasters(line.unitPrice),
        quantity: Math.max(1, line.quantity),
        discountAmount: line.discount > 0 ? toPiasters(line.discount) : null,
        ...(Object.keys(features).length > 0 ? { selectedFeatures: features } : {}),
        createdAt: r.createdAt,
      });
    }

    const notes = [`مستورد من ${PROVIDER_LABELS[ctx.provider]} ${r.name}`, r.currencyCode && r.currencyCode !== "EGP" ? `العملة الأصلية: ${r.currencyCode}` : null, r.note]
      .filter(Boolean)
      .join(" — ");

    return createOrRecheck("ORDER", r, () =>
      prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            guestSessionId: `${IMPORT_GUEST_SESSION}:${ctx.provider.toLowerCase()}`,
            storeId: ctx.storeId,
            source: "ONLINE",
            status: OrderStatus[r.status],
            paymentMethod: r.paymentMethod.slice(0, 100),
            paymentProvider: ctx.provider,
            paymentStatus: r.paymentStatus,
            paymentReference: r.name,
            paidAt: r.paymentStatus === "PAID" ? r.createdAt : null,
            subtotal: toPiasters(r.subtotal),
            shipping: toPiasters(r.shipping),
            discount: toPiasters(r.discount),
            total: toPiasters(r.total),
            couponCode: r.couponCode,
            notes: notes.slice(0, 5000),
            fullName: r.fullName || "عميل",
            phone: r.phone || "—",
            address: r.address || "—",
            customerId,
            createdAt: r.createdAt,
            items: { create: items },
          },
          select: { id: true },
        });
        await linkMap(tx, "ORDER", r.externalId, order.id, map?.id);
        return { result: "imported" } as const;
      }),
    );
  }

  async function apply(record: NormalizedRecord): Promise<ApplyOutcome> {
    switch (record.entity) {
      case "COLLECTION":
        return applyCollection(record);
      case "PRODUCT":
        return applyProduct(record);
      case "CUSTOMER":
        return applyCustomer(record);
      case "ORDER":
        return applyOrder(record);
    }
  }

  return {
    async prepare() {
      const limit = await checkLimit(ctx.storeId, FEATURE_KEYS.PRODUCTS);
      productQuota = !limit.enabled
        ? 0
        : limit.isUnlimited || limit.limit === null
          ? Infinity
          : Math.max(0, limit.limit - limit.current);
    },
    apply,
  };
}
