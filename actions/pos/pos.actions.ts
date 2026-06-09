"use server";

import { revalidatePath } from "next/cache";
import { OrderSource, OrderStatus, PosShiftStatus, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { createNotification } from "@/lib/notifications/in-app";
import { NotificationType } from "@prisma/client";

async function getStoreForUser(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true },
  });
  if (!store) throw new Error("المتجر غير موجود");
  return store;
}

// ─── Product Search ───────────────────────────────────────────

export async function SearchPosProductsAction(query: string, categoryId?: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const where = {
    storeId: store.id,
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

  return prisma.product.findMany({
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
}

export async function GetPosCategoriesAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.category.findMany({
    where: { storeId: store.id },
    select: { id: true, name: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function FindProductByBarcodeAction(barcode: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.product.findFirst({
    where: {
      storeId: store.id,
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
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const itemCount = input.cartData.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = input.cartData.items.reduce(
    (sum, i) => sum + i.price * i.quantity - i.discountAmount,
    0,
  );

  const held = await prisma.posHeldOrder.create({
    data: {
      storeId: store.id,
      cashierId: userId,
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
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.posHeldOrder.findMany({
    where: { storeId: store.id },
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
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const held = await prisma.posHeldOrder.findFirst({
    where: { id: heldOrderId, storeId: store.id },
    select: { id: true, cartData: true },
  });
  if (!held) throw new Error("الطلب المعلق غير موجود");

  await prisma.posHeldOrder.delete({ where: { id: heldOrderId } });

  revalidatePath("/pos");
  return held.cartData as HeldCartData;
}

export async function DeleteHeldOrderAction(heldOrderId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  await prisma.posHeldOrder.deleteMany({
    where: { id: heldOrderId, storeId: store.id },
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
  shiftId?: string;
  cartItems: PosCartItem[];
  invoiceDiscount: { type: "percentage" | "fixed"; value: number } | null;
  payments: SplitPaymentEntry[];
  customer?: { name: string; phone: string };
  notes?: string;
}) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  if (input.cartItems.length === 0) throw new Error("السلة فارغة");

  // Validate shift if provided
  if (input.shiftId) {
    const shift = await prisma.posShift.findFirst({
      where: { id: input.shiftId, storeId: store.id, status: PosShiftStatus.OPEN },
      select: { id: true },
    });
    if (!shift) throw new Error("الوردية غير موجودة أو مغلقة");
  }

  // Verify products and stock in DB (don't trust client)
  const productIds = input.cartItems.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: store.id, isActive: true },
    select: { id: true, price: true, costPrice: true, stock: true, name: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of input.cartItems) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`المنتج غير موجود: ${item.productId}`);
    if (product.stock < item.quantity) {
      throw new Error(`المخزون غير كافٍ للمنتج: ${product.name} (متاح: ${product.stock})`);
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
      invoiceDiscountAmount = Math.round(subtotal * (input.invoiceDiscount.value / 100));
    } else {
      invoiceDiscountAmount = Math.min(Math.round(input.invoiceDiscount.value * 100), subtotal);
    }
  }

  const itemDiscounts = input.cartItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const totalDiscount = itemDiscounts + invoiceDiscountAmount;
  const total = Math.max(0, subtotal - invoiceDiscountAmount);

  const costTotal = input.cartItems.reduce(
    (sum, item) => sum + Math.round((item.costPrice ?? 0) * item.quantity),
    0,
  );
  const profitTotal = total - costTotal;

  // Validate payments cover the total
  const totalPaid = input.payments.reduce((sum, p) => sum + p.amount, 0);
  if (totalPaid < total) {
    throw new Error(`المبلغ المدفوع (${(totalPaid / 100).toFixed(2)}) أقل من الإجمالي (${(total / 100).toFixed(2)})`);
  }

  // Determine primary payment method label
  const primaryPayment = input.payments[0]?.paymentMethod ?? "cash";

  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const created = await tx.order.create({
      data: {
        guestSessionId: `pos-${userId}-${Date.now()}`,
        storeId: store.id,
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
        ...(input.shiftId ? { posShiftId: input.shiftId } : {}),
        items: {
          create: input.cartItems.map((item) => {
            const dbProduct = productMap.get(item.productId)!;
            const costPiasters = Math.round((dbProduct.costPrice ?? 0) * 100);
            const itemProfit = item.price * item.quantity - item.discountAmount - costPiasters * item.quantity;
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

    // Decrement stock and record movements
    for (const item of input.cartItems) {
      const product = productMap.get(item.productId)!;

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          storeId: store.id,
          productId: item.productId,
          type: StockMovementType.SALE,
          quantity: -item.quantity,
          stockBefore: product.stock,
          stockAfter: product.stock - item.quantity,
          reference: created.id,
          note: `بيع POS — فاتورة #${created.id.slice(-6).toUpperCase()}`,
          userId,
        },
      });
    }

    // Update shift totals
    if (input.shiftId) {
      await tx.posShift.update({
        where: { id: input.shiftId },
        data: {
          totalSales: { increment: total },
          totalDiscount: { increment: totalDiscount },
          transactionCount: { increment: 1 },
        },
      });
    }

    return created;
  });

  // Low stock notifications (fire-and-forget)
  try {
    for (const item of input.cartItems) {
      const updated = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true, lowStockThreshold: true },
      });
      const threshold = updated?.lowStockThreshold ?? 5;
      if (updated && updated.stock <= threshold) {
        await createNotification({
          storeId: store.id,
          userId,
          type: NotificationType.LOW_STOCK,
          title: "تنبيه مخزون منخفض",
          message: `المنتج "${updated.name}" وصل للحد الأدنى (${updated.stock} قطعة متبقية).`,
          href: `/dashboard/products/${updated.id}/edit`,
          data: { productId: updated.id, stock: updated.stock },
        });
      }
    }
  } catch {
    // silent — never break the main flow
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/products");
  revalidatePath("/pos");

  return { orderId: order.id, total: order.total };
}

// ─── Get POS Order (for receipt) ─────────────────────────────

export async function GetPOSOrderAction(orderId: string) {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  return prisma.order.findFirst({
    where: { id: orderId, storeId: store.id, source: "POS" },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, image: true, sku: true } },
        },
      },
      splitPayments: true,
      cashierUser: { select: { id: true, name: true } },
    },
  });
}

// ─── Low Stock Dashboard ──────────────────────────────────────

export async function GetLowStockProductsAction() {
  const userId = await requireUserId();
  const store = await getStoreForUser(userId);

  const settings = await prisma.storeSettings.findUnique({
    where: { storeId: store.id },
    select: { defaultLowStockThreshold: true },
  });
  const defaultThreshold = settings?.defaultLowStockThreshold ?? 5;

  return prisma.$queryRaw<
    { id: string; name: string; stock: number; threshold: number; image: string }[]
  >`
    SELECT id, name, stock,
           COALESCE("lowStockThreshold", ${defaultThreshold}) as threshold,
           image
    FROM "Product"
    WHERE "storeId" = ${store.id}
      AND "isActive" = true
      AND stock <= COALESCE("lowStockThreshold", ${defaultThreshold})
    ORDER BY stock ASC
    LIMIT 20
  `;
}
