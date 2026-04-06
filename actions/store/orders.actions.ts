"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { MustOwnStore, MustSession } from "../auth/auth-helpers.actions";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@/lib/generated/prisma/enums";
import { requireUserId } from "../auth/require-user-id.actions";
import { calculateCouponDiscount } from "@/helpers/coupon";

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
    select: { id: true, slug: true },
  });

  if (!store) throw new Error("Store not found");

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
        status: "PENDING",

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
          usedCount: {
            increment: 1,
          },
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

  revalidatePath(`/dashboard/orders`);
  revalidatePath(`/store/${store.slug}`);
  revalidatePath(`/store/${store.slug}/cart`);

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