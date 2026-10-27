"use server";

import { revalidatePath } from "next/cache";
import { OrderSource, OrderStatus, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/in-app";
import { queueLowStockEmails } from "@/lib/notifications/email/store-alerts";
import { NotificationType } from "@prisma/client";
import { assertCanSellInBranch, requirePosContext } from "@/lib/pos/pos-context";
import { changeBranchStock, getBranchQuantities } from "@/lib/inventory/branch-stock";

/** Replaces Product.stock (store-wide) with what this branch actually has. */
async function withBranchStock<T extends { id: string; stock: number }>(branchId: string, products: T[]): Promise<T[]> {
  const qty = await getBranchQuantities(prisma, branchId, products.map((p) => p.id));
  return products.map((p) => ({ ...p, stock: qty.get(p.id) ?? 0 }));
}

// ─── Product Search ───────────────────────────────────────────

export async function SearchPosProductsAction(query: string, categoryId?: string) {
  const ctx = await requirePosContext();

  const where = {
    storeId: ctx.storeId,
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(query.trim()
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { sku: { contains: query, mode: "insensitive" as const } },
            { barcode: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      costPrice: true,
      stock: true,
      lowStockThreshold: true,
      sku: true,
      barcode: true,
      categoryId: true,
      category: { select: { name: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: 60,
  });
  return withBranchStock(ctx.branch.id, products);
}

export async function GetPosCategoriesAction() {
  const ctx = await requirePosContext();

  return prisma.category.findMany({
    where: { storeId: ctx.storeId },
    select: { id: true, name: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function FindProductByBarcodeAction(barcode: string) {
  const ctx = await requirePosContext();

  const product = await prisma.product.findFirst({
    where: {
      storeId: ctx.storeId,
      isActive: true,
      OR: [{ barcode }, { sku: barcode }],
    },
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      costPrice: true,
      stock: true,
      lowStockThreshold: true,
      sku: true,
      barcode: true,
    },
  });
  return product ? (await withBranchStock(ctx.branch.id, [product]))[0] : null;
}

// ─── Hold Orders ──────────────────────────────────────────────

export type HeldCartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  costPrice: number;
  quantity: number;
  discountAmount: number;
  stock: number;
  sku?: string;
};

export type HeldCartData = {
  items: HeldCartItem[];
  invoiceDiscount: { type: "percentage" | "fixed"; value: number } | null;
  customer: { id?: string; name: string; phone: string } | null;
  note: string;
};

export async function HoldOrderAction(input: {
  label?: string;
  cartData: HeldCartData;
}) {
  const ctx = await requirePosContext();

  const itemCount = input.cartData.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = input.cartData.items.reduce(
    (sum, i) => sum + i.price * i.quantity - i.discountAmount,
    0,
  );

  const held = await prisma.posHeldOrder.create({
    data: {
      storeId: ctx.storeId,
      branchId: ctx.branch.id,
      cashierId: ctx.userId,
      label: input.label ?? `طلب ${new Date().toLocaleTimeString("ar-EG")}`,
      cartData: input.cartData as object,
      itemCount,
      total: subtotal,
    },
  });

  revalidatePath("/pos");
  return held;
}

export async function GetHeldOrdersAction() {
  const ctx = await requirePosContext();

  return prisma.posHeldOrder.findMany({
    where: { storeId: ctx.storeId, branchId: ctx.branch.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      note: true,
      itemCount: true,
      total: true,
      createdAt: true,
      cashier: { select: { name: true } },
    },
  });
}

export async function ResumeHeldOrderAction(heldOrderId: string): Promise<HeldCartData> {
  const ctx = await requirePosContext();

  const held = await prisma.posHeldOrder.findFirst({
    where: { id: heldOrderId, storeId: ctx.storeId, branchId: ctx.branch.id },
    select: { id: true, cartData: true },
  });
  if (!held) throw new Error("الطلب المعلق غير موجود");

  await prisma.posHeldOrder.delete({ where: { id: heldOrderId } });

  revalidatePath("/pos");
  return held.cartData as HeldCartData;
}

export async function DeleteHeldOrderAction(heldOrderId: string) {
  const ctx = await requirePosContext();

  await prisma.posHeldOrder.deleteMany({
    where: { id: heldOrderId, storeId: ctx.storeId, branchId: ctx.branch.id },
  });
  revalidatePath("/pos");
  return { success: true };
}

// ─── Complete POS Sale ────────────────────────────────────────

export type PosCartItem = {
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  discountAmount: number;
};

export type SplitPaymentEntry = {
  paymentMethod: string;
  amount: number;
  reference?: string;
};

export async function CompletePOSSaleAction(input: {
  /** Kept for older clients; the sale always goes to the cashier's own open shift. */
  shiftId?: string;
  cartItems: PosCartItem[];
  invoiceDiscount: { type: "percentage" | "fixed"; value: number } | null;
  payments: SplitPaymentEntry[];
  customer?: { name: string; phone: string };
  notes?: string;
}) {
  const ctx = await requirePosContext();
  const { userId, storeId } = ctx;

  if (input.cartItems.length === 0) throw new Error("السلة فارغة");

  // The shift (and so the branch) comes from the server, never from the client.
  const shift = ctx.shift;
  if (!shift) throw new Error("افتح وردية الأول عشان تقدر تبيع");
  if (input.shiftId && input.shiftId !== shift.id) throw new Error("الوردية دي مش ورديتك المفتوحة — حدّث الصفحة");
  assertCanSellInBranch(ctx);
  const branchId = shift.branchId;

  // Verify products, prices and stock in DB (don't trust client)
  const productIds = [...new Set(input.cartItems.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId, isActive: true },
    select: { id: true, price: true, costPrice: true, name: true, lowStockThreshold: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const branchStock = await getBranchQuantities(prisma, branchId, productIds);

  const wanted = new Map<string, number>();
  for (const item of input.cartItems) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`المنتج غير موجود: ${item.productId}`);
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error("كمية غير صالحة");
    if (item.price !== Math.round(product.price * 100)) {
      throw new Error(`سعر "${product.name}" اتغير — حدّث الصفحة`);
    }
    if (item.discountAmount < 0 || item.discountAmount > item.price * item.quantity) {
      throw new Error(`خصم غير صالح على "${product.name}"`);
    }
    wanted.set(item.productId, (wanted.get(item.productId) ?? 0) + item.quantity);
  }
  for (const [productId, qty] of wanted) {
    const available = branchStock.get(productId) ?? 0;
    if (available < qty) {
      throw new Error(`المخزون غير كافٍ في الفرع للمنتج: ${productMap.get(productId)!.name} (متاح: ${available})`);
    }
  }

  // Calculate totals
  const subtotal = input.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity - item.discountAmount,
    0,
  );

  let invoiceDiscountAmount = 0;
  if (input.invoiceDiscount) {
    if (input.invoiceDiscount.type === "percentage") {
      const pct = Math.min(100, Math.max(0, input.invoiceDiscount.value));
      invoiceDiscountAmount = Math.round(subtotal * (pct / 100));
    } else {
      invoiceDiscountAmount = Math.min(Math.max(0, Math.round(input.invoiceDiscount.value * 100)), subtotal);
    }
  }

  const itemDiscounts = input.cartItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const totalDiscount = itemDiscounts + invoiceDiscountAmount;
  const total = Math.max(0, subtotal - invoiceDiscountAmount);

  const costTotal = input.cartItems.reduce((sum, item) => {
    const cost = productMap.get(item.productId)!.costPrice;
    return sum + Math.round((cost ?? 0) * 100) * item.quantity;
  }, 0);
  const profitTotal = total - costTotal;

  // Validate payments cover the total
  if (input.payments.some((p) => !Number.isFinite(p.amount) || p.amount < 0)) throw new Error("مبلغ دفع غير صالح");
  const totalPaid = input.payments.reduce((sum, p) => sum + p.amount, 0);
  if (totalPaid < total) {
    throw new Error(`المبلغ المدفوع (${(totalPaid / 100).toFixed(2)}) أقل من الإجمالي (${(total / 100).toFixed(2)})`);
  }

  // Determine primary payment method label
  const primaryPayment = input.payments[0]?.paymentMethod ?? "cash";

  const lowStock: { id: string; name: string; left: number; threshold: number }[] = [];

  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const created = await tx.order.create({
      data: {
        guestSessionId: `pos-${userId}-${Date.now()}`,
        storeId,
        branchId,
        source: OrderSource.POS,
        status: OrderStatus.PAID,
        paymentMethod: primaryPayment,
        paymentStatus: "PAID",
        paidAt: new Date(),
        paymentProvider: "POS",
        subtotal,
        shipping: 0,
        discount: totalDiscount,
        total,
        costTotal,
        profitTotal,
        notes: input.notes,
        fullName: input.customer?.name ?? "عميل نقدي",
        phone: input.customer?.phone ?? "-",
        address: "بيع مباشر",
        cashierId: userId,
        posShiftId: shift.id,
        items: {
          create: input.cartItems.map((item) => {
            const dbProduct = productMap.get(item.productId)!;
            // null (not 0) when the product has no cost, so reports don't show 100% margin.
            const costPiasters = dbProduct.costPrice == null ? null : Math.round(dbProduct.costPrice * 100);
            const itemProfit =
              costPiasters === null ? null : item.price * item.quantity - item.discountAmount - costPiasters * item.quantity;
            return {
              productId: item.productId,
              price: item.price,
              costPrice: costPiasters,
              profitAmount: itemProfit,
              discountAmount: item.discountAmount,
              quantity: item.quantity,
            };
          }),
        },
        splitPayments: {
          create: input.payments.map((p) => ({
            paymentMethod: p.paymentMethod,
            amount: p.amount,
            reference: p.reference,
          })),
        },
      },
      select: { id: true, total: true },
    });

    // Take stock from this branch only. Conditional: another register in the same
    // branch may have sold the last pieces meanwhile.
    for (const [productId, quantity] of wanted) {
      const product = productMap.get(productId)!;
      const moved = await changeBranchStock(tx, { storeId, branchId, productId, delta: -quantity, requireAvailable: true });
      if (!moved) {
        throw new Error(`الكمية المطلوبة من "${product.name}" مبقتش متاحة في الفرع`);
      }

      await tx.stockMovement.create({
        data: {
          storeId,
          branchId,
          productId,
          type: StockMovementType.SALE,
          quantity: -quantity,
          stockBefore: moved.before,
          stockAfter: moved.after,
          reference: created.id,
          note: `بيع POS — فاتورة #${created.id.slice(-6).toUpperCase()}`,
          userId,
        },
      });

      const threshold = product.lowStockThreshold ?? 5;
      if (moved.after <= threshold) lowStock.push({ id: productId, name: product.name, left: moved.after, threshold });
    }

    await tx.posShift.update({
      where: { id: shift.id },
      data: {
        totalSales: { increment: total },
        totalDiscount: { increment: totalDiscount },
        transactionCount: { increment: 1 },
      },
    });

    return created;
  });

  // Low stock notifications for the store owner (createNotification never throws)
  queueLowStockEmails(
    storeId,
    lowStock.map((p) => ({ id: p.id, name: p.name, stock: p.left, branchName: ctx.branch.name })),
  );
  for (const p of lowStock) {
    await createNotification({
      storeId,
      type: p.left <= 0 ? NotificationType.OUT_OF_STOCK : NotificationType.LOW_STOCK,
      title: p.left <= 0 ? `نفد المخزون — ${ctx.branch.name}` : `تنبيه مخزون منخفض — ${ctx.branch.name}`,
      message:
        p.left <= 0
          ? `المنتج "${p.name}" خلص من فرع ${ctx.branch.name}.`
          : `المنتج "${p.name}" وصل للحد الأدنى في فرع ${ctx.branch.name} (${p.left} قطعة متبقية).`,
      href: `/dashboard/products/${p.id}/edit`,
      data: { productId: p.id, stock: p.left, branchId },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/products");
  revalidatePath("/pos");

  return { orderId: order.id, total: order.total };
}

// ─── Get POS Order (for receipt) ─────────────────────────────

export async function GetPOSOrderAction(orderId: string) {
  const ctx = await requirePosContext();

  return prisma.order.findFirst({
    where: { id: orderId, storeId: ctx.storeId, source: "POS", branchId: { in: ctx.branches.map((b) => b.id) } },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, image: true, sku: true } },
        },
      },
      splitPayments: true,
      cashierUser: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true, address: true, phone: true } },
    },
  });
}

// ─── Low Stock (current branch) ───────────────────────────────

export async function GetLowStockProductsAction() {
  const ctx = await requirePosContext();

  const settings = await prisma.storeSettings.findUnique({
    where: { storeId: ctx.storeId },
    select: { defaultLowStockThreshold: true },
  });
  const defaultThreshold = settings?.defaultLowStockThreshold ?? 5;

  return prisma.$queryRaw<
    { id: string; name: string; stock: number; threshold: number; image: string }[]
  >`
    SELECT p.id, p.name, COALESCE(bi.quantity, 0) AS stock,
           COALESCE(p."lowStockThreshold", ${defaultThreshold}) as threshold,
           p.image
    FROM "Product" p
    LEFT JOIN "BranchInventory" bi
      ON bi."productId" = p.id AND bi."branchId" = ${ctx.branch.id} AND bi."variantId" IS NULL
    WHERE p."storeId" = ${ctx.storeId}
      AND p."isActive" = true
      AND COALESCE(bi.quantity, 0) <= COALESCE(p."lowStockThreshold", ${defaultThreshold})
    ORDER BY stock ASC
    LIMIT 20
  `;
}
