"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";

const LOYALTY_COOKIE_KEY = "loyalty_phone";

// ─── Storefront ──────────────────────────────────────────────────────────────

export async function CheckLoyaltyPointsAction(phone: string, storeSlug: string) {
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, settings: { select: { loyaltyEnabled: true, loyaltyMinRedemption: true, loyaltyPointsValuePiasters: true } } },
  });
  if (!store || !store.settings?.loyaltyEnabled) {
    return { success: false as const, message: "نظام النقاط غير مفعّل" };
  }

  const customer = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId: store.id, phone: phone.trim() } },
    select: { id: true, points: true, name: true },
  });

  if (!customer) {
    return { success: true as const, points: 0, name: null, customerId: null, minRedemption: store.settings.loyaltyMinRedemption, pointValue: store.settings.loyaltyPointsValuePiasters };
  }

  return {
    success: true as const,
    points: customer.points,
    name: customer.name,
    customerId: customer.id,
    minRedemption: store.settings.loyaltyMinRedemption,
    pointValue: store.settings.loyaltyPointsValuePiasters,
  };
}

export async function ApplyLoyaltyPointsAction(
  phone: string,
  pointsToRedeem: number,
  guestSessionId: string,
  storeSlug: string,
) {
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, settings: { select: { loyaltyEnabled: true, loyaltyMinRedemption: true, loyaltyPointsValuePiasters: true } } },
  });
  if (!store || !store.settings?.loyaltyEnabled) {
    return { success: false as const, message: "نظام النقاط غير مفعّل" };
  }

  const customer = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId: store.id, phone: phone.trim() } },
    select: { id: true, points: true },
  });

  if (!customer) return { success: false as const, message: "لم يتم العثور على رصيد نقاط لهذا الرقم" };
  if (customer.points < (store.settings.loyaltyMinRedemption ?? 100)) {
    return { success: false as const, message: `يجب أن يكون لديك على الأقل ${store.settings.loyaltyMinRedemption} نقطة` };
  }
  if (pointsToRedeem > customer.points) {
    return { success: false as const, message: "النقاط المطلوبة أكبر من رصيدك" };
  }
  if (pointsToRedeem <= 0) {
    return { success: false as const, message: "يجب استرداد نقطة واحدة على الأقل" };
  }

  await prisma.appliedLoyaltyPoints.upsert({
    where: { guestSessionId_storeId: { guestSessionId, storeId: store.id } },
    create: { guestSessionId, storeId: store.id, customerId: customer.id, points: pointsToRedeem },
    update: { customerId: customer.id, points: pointsToRedeem },
  });

  const cookieStore = await cookies();
  cookieStore.set(LOYALTY_COOKIE_KEY, phone.trim(), { path: "/", maxAge: 60 * 60 * 24 });

  revalidatePath(`/store/${storeSlug}/cart`);
  const discount = pointsToRedeem * (store.settings.loyaltyPointsValuePiasters ?? 1);
  return { success: true as const, discount, message: "تم تطبيق النقاط بنجاح" };
}

export async function RemoveLoyaltyPointsAction(guestSessionId: string, storeSlug: string) {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) return;

  await prisma.appliedLoyaltyPoints.deleteMany({
    where: { guestSessionId, storeId: store.id },
  });

  revalidatePath(`/store/${storeSlug}/cart`);
}

export async function GetAppliedLoyaltyAction(guestSessionId: string, storeSlug: string) {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true, settings: { select: { loyaltyEnabled: true, loyaltyPointsValuePiasters: true } } } });
  if (!store || !store.settings?.loyaltyEnabled) return null;

  return prisma.appliedLoyaltyPoints.findUnique({
    where: { guestSessionId_storeId: { guestSessionId, storeId: store.id } },
    select: { points: true, customerId: true },
  });
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function GetCustomersAction(page = 1) {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) return { customers: [], total: 0 };

  const PAGE = 20;
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { storeId: store.id },
      orderBy: { points: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: { id: true, phone: true, name: true, points: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.customer.count({ where: { storeId: store.id } }),
  ]);

  return { customers, total };
}

export async function AdjustCustomerPointsAction(customerId: string, points: number, description: string) {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) return { success: false, message: "المتجر غير موجود" };

  const customer = await prisma.customer.findFirst({ where: { id: customerId, storeId: store.id } });
  if (!customer) return { success: false, message: "العميل غير موجود" };

  const newPoints = Math.max(0, customer.points + points);

  await prisma.$transaction([
    prisma.customer.update({ where: { id: customerId }, data: { points: newPoints } }),
    prisma.loyaltyTransaction.create({
      data: { customerId, type: "MANUAL", points, description },
    }),
  ]);

  revalidatePath("/dashboard/loyalty");
  return { success: true, message: "تم تعديل النقاط" };
}

export async function UpdateLoyaltySettingsAction(formData: FormData) {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true, settings: { select: { id: true } } } });
  if (!store?.settings) return { success: false, message: "المتجر غير موجود" };

  const loyaltyEnabled = formData.get("loyaltyEnabled") === "on";
  const loyaltyPointsPerEGP = Number(formData.get("loyaltyPointsPerEGP") ?? 1);
  const loyaltyPointsValuePiasters = Number(formData.get("loyaltyPointsValuePiasters") ?? 1);
  const loyaltyMinRedemption = Number(formData.get("loyaltyMinRedemption") ?? 100);

  await prisma.storeSettings.update({
    where: { id: store.settings.id },
    data: { loyaltyEnabled, loyaltyPointsPerEGP, loyaltyPointsValuePiasters, loyaltyMinRedemption },
  });

  revalidatePath("/dashboard/loyalty");
  return { success: true, message: "تم حفظ إعدادات نظام النقاط" };
}
