"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";

async function getMerchantStore(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true },
  });

  if (!store) {
    throw new Error("لم يتم العثور على المتجر");
  }

  return store;
}

export async function DeleteCouponAction(couponId: string) {
  const userId = await requireUserId();
  const store = await getMerchantStore(userId);

  const coupon = await prisma.coupon.findFirst({
    where: {
      id: couponId,
      storeId: store.id,
    },
    select: { id: true },
  });

  if (!coupon) {
    throw new Error("الكوبون غير موجود");
  }

  await prisma.appliedCoupon.deleteMany({
    where: {
      couponId: coupon.id,
    },
  });

  await prisma.coupon.delete({
    where: {
      id: coupon.id,
    },
  });

  revalidatePath("/dashboard/coupons");
}

export async function ToggleCouponStatusAction(couponId: string) {
  const userId = await requireUserId();
  const store = await getMerchantStore(userId);

  const coupon = await prisma.coupon.findFirst({
    where: {
      id: couponId,
      storeId: store.id,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!coupon) {
    throw new Error("الكوبون غير موجود");
  }

  await prisma.coupon.update({
    where: {
      id: coupon.id,
    },
    data: {
      isActive: !coupon.isActive,
    },
  });

  revalidatePath("/dashboard/coupons");
}
