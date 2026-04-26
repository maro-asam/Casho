"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { MustOwnStore, MustSession } from "../auth/auth-helpers.actions";
import { requireUserId } from "../auth/require-user-id.actions";
import { calculateCouponDiscount } from "@/helpers/coupon";
import {
  KASHIER_ALLOWED_METHODS,
  type KashierAllowedMethod,
  type PaymentMethodKey,
} from "@/constants/welcome/payment-methods";
import { createMerchantKashierHppUrl } from "@/lib/kashier-merchant";
import { resolveEnabledPaymentMethodKeys } from "@/lib/payment-methods";
import { decryptSecret } from "@/lib/secrets";

const kashierAllowedMethodKeys = new Set<string>(
  KASHIER_ALLOWED_METHODS.map((method) => method.key),
);

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function toKashierAllowedMethods(methods: string[]) {
  return methods.filter((method): method is KashierAllowedMethod => {
    return kashierAllowedMethodKeys.has(method);
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
      slug: true,
      name: true,
      paymentMethods: true,
      storePaymentSettings: {
        select: {
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

  const enabledPaymentMethods = resolveEnabledPaymentMethodKeys({
    paymentMethods: store.paymentMethods,
    paymentSettings: store.storePaymentSettings,
  });

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
    const priceInCents = Math.round(item.product.price * 100);
    return acc + priceInCents * item.quantity;
  }, 0);

  const shipping = 0;
  let discount = 0;
  let couponIdToUse: string | null = null;
  let couponCodeToUse: string | null = null;

  if (appliedCoupon?.coupon) {
    const coupon = appliedCoupon.coupon;
    const now = new Date();

    const startsOk = !coupon.startsAt || coupon.startsAt <= now;
    const expiresOk = !coupon.expiresAt || coupon.expiresAt >= now;
    const usageOk =
      typeof coupon.usageLimit !== "number" ||
      coupon.usedCount < coupon.usageLimit;

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

  const total = Math.max(0, subtotal + shipping - discount);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        guestSessionId,
        storeId: store.id,
        paymentMethod: data.paymentMethod,
        paymentProvider:
          data.paymentMethod === "kashier" ? "KASHIER" : "MANUAL",
        paymentStatus: "PENDING",
        status: OrderStatus.PENDING,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: couponCodeToUse,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            price: Math.round(item.product.price * 100),
            quantity: item.quantity,
          })),
        },
      },
      select: { id: true },
    });

    if (couponIdToUse) {
      await tx.coupon.update({
        where: { id: couponIdToUse },
        data: {
          usedCount: { increment: 1 },
        },
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

  revalidatePath("/dashboard/orders");
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

    const allowedMethods = toKashierAllowedMethods(
      settings.kashierAllowedMethods,
    );

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
    where: {
      id: orderId,
      storeId,
    },
    select: { id: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/dashboard/orders");
  revalidatePath(`/store/${store.slug}`);

  return { success: true };
}