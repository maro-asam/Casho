"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NotificationType, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MustOwnStore, MustSession } from "@/actions/auth/auth-helpers.actions";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { calculateCouponDiscount } from "@/helpers/coupon";
import {
  PAYMENT_METHODS,
  KASHIER_ALLOWED_METHODS,
  type KashierAllowedMethod,
  type PaymentMethodKey,
} from "@/constants/welcome/payment-methods";
import { createMerchantKashierHppUrl } from "@/lib/kashier-merchant";
import { decryptSecret } from "@/lib/secrets";
import {
  createNotification,
  formatPiastersAsEgp,
  orderStatusLabels,
} from "@/lib/notifications/in-app";
import { sendWhatsAppOrderNotification } from "@/lib/notifications/whatsapp";

const kashierAllowedMethodKeys = new Set(
  KASHIER_ALLOWED_METHODS.map((method) => method.key),
);

function getAppUrl() {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error(
      "APP_URL environment variable is required for Kashier payments",
    );
  }

  return url.replace(/\/$/, "");
}

function isPaymentMethodKey(value: string): value is PaymentMethodKey {
  return PAYMENT_METHODS.some((method) => method.key === value);
}

function normalizeEnabledPaymentMethods(
  paymentMethods: string[] | null | undefined,
): PaymentMethodKey[] {
  const normalized = (paymentMethods ?? []).filter(isPaymentMethodKey);

  if (normalized.length > 0) {
    return normalized;
  }

  return ["cash_on_delivery"];
}

function toKashierAllowedMethods(methods: string[]) {
  return methods.filter((method): method is KashierAllowedMethod => {
    return kashierAllowedMethodKeys.has(method as KashierAllowedMethod);
  });
}

export async function CreateOrderAction(
  storeSlug: string,
  data: {
    fullName: string;
    phone: string;
    address: string;
    paymentMethod: PaymentMethodKey;
  },
) {
  const { guestSessionId } = await MustSession();

  if (!storeSlug) throw new Error("storeSlug is missing");

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      userId: true,
      slug: true,
      name: true,
      paymentMethods: true,
      settings: {
        select: {
          shippingPrice: true,
          whatsappNumber: true,
          primaryColor: true,
        },
      },
      storePaymentSettings: {
        select: {
          enabledPaymentMethods: true,
          cashOnDeliveryEnabled: true,
          vodafoneCashEnabled: true,
          instapayEnabled: true,
          bankTransferEnabled: true,
          kashierEnabled: true,
          kashierMode: true,
          kashierMerchantId: true,
          kashierApiKeyEncrypted: true,
          kashierAllowedMethods: true,
        },
      },
    },
  });

  if (!store) throw new Error("Store not found");

  const enabledPaymentMethods = normalizeEnabledPaymentMethods(
    store.storePaymentSettings?.enabledPaymentMethods?.length
      ? store.storePaymentSettings.enabledPaymentMethods
      : store.paymentMethods,
  );

  if (!enabledPaymentMethods.includes(data.paymentMethod)) {
    throw new Error("This payment method is not available for this store");
  }

  const [cartItems, appliedCoupon] = await Promise.all([
    prisma.cartItem.findMany({
      where: { guestSessionId, storeId: store.id },
      include: {
        product: {
          select: {
            id: true,
            price: true,
            name: true,
            wholesaleOptions: true,
          },
        },
      },
    }),
    prisma.appliedCoupon.findUnique({
      where: {
        guestSessionId_storeId: {
          guestSessionId,
          storeId: store.id,
        },
      },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
            isActive: true,
            startsAt: true,
            expiresAt: true,
            minSubtotal: true,
            maxDiscount: true,
            usageLimit: true,
            usedCount: true,
          },
        },
      },
    }),
  ]);

  if (cartItems.length === 0) throw new Error("Cart is empty");

  const subtotal = cartItems.reduce((acc, item) => {
    const tiers = item.product.wholesaleOptions as
      | { minQty: number; maxQty?: number; price: number }[]
      | null;
    let unitPrice = item.product.price;
    if (tiers && tiers.length > 0) {
      for (let i = tiers.length - 1; i >= 0; i--) {
        const t = tiers[i];
        if (item.quantity >= t.minQty && (t.maxQty === undefined || item.quantity <= t.maxQty)) {
          unitPrice = t.price;
          break;
        }
      }
    }
    return acc + Math.round(unitPrice * 100) * item.quantity;
  }, 0);

  const cookieStore = await cookies();
  const selectedShippingMethodId = cookieStore.get(`ship_${store.id}`)?.value ?? null;

  const shippingMethods = await prisma.shippingMethod.findMany({
    where: { storeId: store.id, isActive: true },
    select: { id: true, price: true },
  });

  let shipping = (store.settings?.shippingPrice ?? 0) * 100;
  let resolvedShippingMethodId: string | null = null;
  if (shippingMethods.length > 0) {
    const selected = shippingMethods.find((m) => m.id === selectedShippingMethodId);
    const method = selected ?? shippingMethods[0];
    shipping = method.price;
    resolvedShippingMethodId = method.id;
  }
  let discount = 0;
  let couponIdToUse: string | null = null;
  let couponCodeToUse: string | null = null;

  if (appliedCoupon?.coupon) {
    const coupon = appliedCoupon.coupon;
    const now = new Date();
    const startsOk = !coupon.startsAt || coupon.startsAt <= now;
    const expiresOk = !coupon.expiresAt || coupon.expiresAt >= now;
    const usageOk =
      typeof coupon.usageLimit !== "number" || coupon.usedCount < coupon.usageLimit;

    if (coupon.isActive && startsOk && expiresOk && usageOk) {
      const calculatedDiscount = calculateCouponDiscount(subtotal / 100, {
        type: coupon.type,
        value: coupon.value,
        minSubtotal: coupon.minSubtotal,
        maxDiscount: coupon.maxDiscount,
      });

      discount = Math.round(calculatedDiscount * 100);

      if (discount > 0) {
        couponIdToUse = coupon.id;
        couponCodeToUse = coupon.code;
      }
    }
  }

  // Apply loyalty points discount
  const appliedLoyalty = await prisma.appliedLoyaltyPoints.findUnique({
    where: { guestSessionId_storeId: { guestSessionId, storeId: store.id } },
    select: { points: true, customerId: true },
  });
  const loyaltySettings = await prisma.storeSettings.findUnique({
    where: { storeId: store.id },
    select: { loyaltyEnabled: true, loyaltyPointsValuePiasters: true },
  });
  let loyaltyDiscount = 0;
  if (appliedLoyalty && loyaltySettings?.loyaltyEnabled) {
    loyaltyDiscount = appliedLoyalty.points * (loyaltySettings.loyaltyPointsValuePiasters ?? 1);
    discount += loyaltyDiscount;
  }

  const total = Math.max(0, subtotal + shipping - discount);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        guestSessionId,
        storeId: store.id,
        paymentMethod: data.paymentMethod,
        paymentProvider: data.paymentMethod === "kashier" ? "KASHIER" : "MANUAL",
        paymentStatus: "PENDING",
        status: OrderStatus.PENDING,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: couponCodeToUse,
        ...(resolvedShippingMethodId ? { shippingMethodId: resolvedShippingMethodId } : {}),
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        items: {
          create: cartItems.map((item) => {
            const tiers = item.product.wholesaleOptions as
              | { minQty: number; maxQty?: number; price: number }[]
              | null;
            let unitPrice = item.product.price;
            if (tiers && tiers.length > 0) {
              for (let i = tiers.length - 1; i >= 0; i--) {
                const t = tiers[i];
                if (item.quantity >= t.minQty && (t.maxQty === undefined || item.quantity <= t.maxQty)) {
                  unitPrice = t.price;
                  break;
                }
              }
            }
            return {
              productId: item.productId,
              price: Math.round(unitPrice * 100),
              quantity: item.quantity,
              ...(item.selectedFeatures
                ? { selectedFeatures: item.selectedFeatures }
                : {}),
            };
          }),
        },
      },
      select: { id: true },
    });

    if (couponIdToUse) {
      await tx.coupon.update({
        where: { id: couponIdToUse },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.appliedCoupon.deleteMany({
      where: {
        guestSessionId,
        storeId: store.id,
      },
    });

    await tx.cartItem.deleteMany({
      where: { guestSessionId, storeId: store.id },
    });

    return created;
  });

  // Award loyalty points after order creation
  try {
    const loyaltySettings = await prisma.storeSettings.findUnique({
      where: { storeId: store.id },
      select: { loyaltyEnabled: true, loyaltyPointsPerEGP: true, loyaltyPointsValuePiasters: true },
    });

    if (loyaltySettings?.loyaltyEnabled) {
      const totalEgp = total / 100;
      const pointsEarned = Math.floor(totalEgp * (loyaltySettings.loyaltyPointsPerEGP ?? 1));

      const appliedLoyalty = await prisma.appliedLoyaltyPoints.findUnique({
        where: { guestSessionId_storeId: { guestSessionId, storeId: store.id } },
        select: { customerId: true, points: true },
      });

      const customer = await prisma.customer.upsert({
        where: { storeId_phone: { storeId: store.id, phone: data.phone } },
        create: { storeId: store.id, phone: data.phone, name: data.fullName, points: pointsEarned },
        update: {
          name: data.fullName,
          points: {
            increment: pointsEarned - (appliedLoyalty?.points ?? 0),
          },
        },
      });

      await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id, pointsEarned } });

      await prisma.loyaltyTransaction.create({
        data: { customerId: customer.id, orderId: order.id, type: "EARNED", points: pointsEarned, description: `طلب #${order.id.slice(-6)}` },
      });

      if (appliedLoyalty) {
        await prisma.loyaltyTransaction.create({
          data: { customerId: appliedLoyalty.customerId, orderId: order.id, type: "REDEEMED", points: -appliedLoyalty.points, description: `استرداد نقاط - طلب #${order.id.slice(-6)}` },
        });
        await prisma.appliedLoyaltyPoints.deleteMany({ where: { guestSessionId, storeId: store.id } });
      }
    }
  } catch (err) {
    console.error("Loyalty points error (non-fatal):", err);
  }

  await createNotification({
    storeId: store.id,
    userId: store.userId,
    type: NotificationType.NEW_ORDER,
    title: "طلب جديد وصل",
    message: `وصلك طلب جديد من ${data.fullName} بقيمة ${formatPiastersAsEgp(total)}.`,
    href: `/dashboard/orders?order=${order.id}`,
    data: {
      orderId: order.id,
      storeId: store.id,
      customerName: data.fullName,
      customerPhone: data.phone,
      paymentMethod: data.paymentMethod,
      total,
    },
  });

  const whatsappNumber = store.settings?.whatsappNumber;
  if (whatsappNumber) {
    sendWhatsAppOrderNotification(whatsappNumber, {
      id: order.id,
      customerName: data.fullName,
      customerPhone: data.phone,
      address: data.address,
      total,
      paymentMethod: data.paymentMethod,
      itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      storeName: store.name,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/store/${store.slug}`);
  revalidatePath(`/store/${store.slug}/cart`);
  revalidatePath(`/store/${store.slug}/checkout`);

  if (data.paymentMethod === "kashier") {
    const settings = store.storePaymentSettings;

    if (
      !settings?.kashierMerchantId ||
      !settings.kashierApiKeyEncrypted ||
      !settings.kashierAllowedMethods.length
    ) {
      throw new Error("Kashier is not configured for this store");
    }

    const allowedMethods = toKashierAllowedMethods(settings.kashierAllowedMethods);

    if (allowedMethods.length === 0) {
      throw new Error("No valid Kashier allowed methods configured");
    }

    const paymentApiKey = decryptSecret(settings.kashierApiKeyEncrypted);
    const appUrl = getAppUrl();

    const checkoutUrl = createMerchantKashierHppUrl({
      checkoutUrl: process.env.KASHIER_CHECKOUT_URL,
      merchantId: settings.kashierMerchantId,
      paymentApiKey,
      mode: settings.kashierMode === "LIVE" ? "live" : "test",
      orderId: order.id,
      amountInPiasters: total,
      merchantRedirect: `${appUrl}/api/payments/kashier/callback`,
      allowedMethods,
      display: "ar",
      brandColor: store.settings?.primaryColor ?? undefined,
      metaData: {
        storeId: store.id,
        storeName: store.name,
        customerName: data.fullName,
        customerPhone: data.phone,
      },
    });

    redirect(checkoutUrl);
  }

  redirect(`/store/${store.slug}/order/${order.id}`);
}

export async function GetOrdersAction(storeId: string) {
  const userId = await requireUserId();
  await MustOwnStore(storeId, userId);

  return prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      address: true,
      paymentMethod: true,
      paymentProvider: true,
      paymentStatus: true,
      paymentReference: true,
      paidAt: true,
      subtotal: true,
      shipping: true,
      discount: true,
      total: true,
      couponCode: true,
      status: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          price: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
}

export async function UpdateOrderStatusAction(
  orderId: string,
  storeId: string,
  status: OrderStatus,
) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    select: {
      id: true,
      status: true,
      fullName: true,
      total: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  if (order.status !== status) {
    await createNotification({
      storeId,
      userId,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: "تم تحديث حالة الطلب",
      message: `طلب ${order.fullName} أصبح ${orderStatusLabels[status] ?? status}.`,
      href: `/dashboard/orders?order=${order.id}`,
      data: {
        orderId: order.id,
        previousStatus: order.status,
        status,
        total: order.total,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/store/${store.slug}`);

  return { success: true };
}
