"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CouponActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getMerchantStore(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true },
  });

  if (!store) throw new Error("لم يتم العثور على المتجر");
  return store;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value?.toString() || "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = value?.toString();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function CreateCouponAction(
  _prevState: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  try {
    const userId = await requireUserId();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!store) return { error: "لم يتم العثور على المتجر" };

    const code = formData.get("code")?.toString().trim().toUpperCase() || "";
    const type = formData.get("type")?.toString() || "PERCENTAGE";
    const value = Number(formData.get("value")?.toString() || 0);
    const minSubtotal = parseOptionalNumber(formData.get("minSubtotal"));
    const maxDiscount = parseOptionalNumber(formData.get("maxDiscount"));
    const usageLimit = parseOptionalNumber(formData.get("usageLimit"));
    const startsAt = parseOptionalDate(formData.get("startsAt"));
    const expiresAt = parseOptionalDate(formData.get("expiresAt"));

    if (!code) return { error: "كود الكوبون مطلوب" };
    if (!["PERCENTAGE", "FIXED"].includes(type)) return { error: "نوع الخصم غير صالح" };
    if (!Number.isFinite(value) || value <= 0) return { error: "قيمة الخصم يجب أن تكون أكبر من 0" };
    if (type === "PERCENTAGE" && value > 100) return { error: "النسبة المئوية لا يمكن أن تكون أكبر من 100" };
    if (startsAt && expiresAt && startsAt >= expiresAt) {
      return { error: "تاريخ الانتهاء لازم يكون بعد تاريخ البداية" };
    }

    const existingCoupon = await prisma.coupon.findFirst({
      where: { storeId: store.id, code },
      select: { id: true },
    });

    if (existingCoupon) return { error: "كود الكوبون مستخدم بالفعل" };

    await prisma.coupon.create({
      data: {
        storeId: store.id,
        code,
        type: type as "PERCENTAGE" | "FIXED",
        value,
        minSubtotal,
        maxDiscount,
        usageLimit: usageLimit ? Math.floor(usageLimit) : null,
        startsAt,
        expiresAt,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/coupons");
    return { success: true, message: "تم إنشاء الكوبون بنجاح" };
  } catch {
    return { error: "حدث خطأ أثناء إنشاء الكوبون" };
  }
}

// ─── Delete / Toggle ──────────────────────────────────────────────────────────

export async function DeleteCouponAction(couponId: string) {
  const userId = await requireUserId();
  const store = await getMerchantStore(userId);

  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, storeId: store.id },
    select: { id: true },
  });

  if (!coupon) throw new Error("الكوبون غير موجود");

  await prisma.appliedCoupon.deleteMany({ where: { couponId: coupon.id } });
  await prisma.coupon.delete({ where: { id: coupon.id } });

  revalidatePath("/dashboard/coupons");
}

export async function ToggleCouponStatusAction(couponId: string) {
  const userId = await requireUserId();
  const store = await getMerchantStore(userId);

  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, storeId: store.id },
    select: { id: true, isActive: true },
  });

  if (!coupon) throw new Error("الكوبون غير موجود");

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { isActive: !coupon.isActive },
  });

  revalidatePath("/dashboard/coupons");
}
