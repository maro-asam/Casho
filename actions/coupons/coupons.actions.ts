"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";
import { assertCanUse, FEATURE_KEYS, isEntitlementError, entitlementErrorMessage } from "@/lib/entitlements";

export type CouponMutationResult =
  | { ok: true; id: string }
  | { ok: false; code: "NOT_FOUND" | "INVALID" | "HAS_USES" | "FAILED"; message: string };

export type CouponInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  /** Percent, or pounds for FIXED. */
  value: number;
  minSubtotal?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  /** ISO strings */
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
};

const CODE_REGEX = /^[A-Z0-9_-]{3,30}$/;

async function ownedStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });
}

function revalidateCoupons(storeSlug: string) {
  revalidatePath("/dashboard/coupons");
  revalidateStorefront(storeSlug);
}

const positiveOrNull = (v: unknown) => {
  const n = Number(v);
  return v === null || v === undefined || v === "" || !Number.isFinite(n) || n <= 0 ? null : n;
};

function parseDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function validate(input: CouponInput) {
  const code = String(input.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!CODE_REGEX.test(code)) return { error: "الكود من ٣ لـ ٣٠ حرف إنجليزي أو رقم (من غير مسافات)." } as const;
  if (input.type !== "PERCENTAGE" && input.type !== "FIXED") return { error: "اختار نوع الخصم." } as const;

  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) return { error: "اكتب قيمة الخصم." } as const;
  if (input.type === "PERCENTAGE" && value > 100) return { error: "النسبة مينفعش تزيد عن ١٠٠٪." } as const;

  const minSubtotal = positiveOrNull(input.minSubtotal);
  const maxDiscount = input.type === "PERCENTAGE" ? positiveOrNull(input.maxDiscount) : null;
  const usageLimitRaw = positiveOrNull(input.usageLimit);
  const usageLimit = usageLimitRaw ? Math.floor(usageLimitRaw) : null;

  if (input.type === "FIXED" && minSubtotal && value > minSubtotal) {
    return { error: "قيمة الخصم أكبر من الحد الأدنى للطلب — كده الطلب ممكن يبقى ببلاش." } as const;
  }

  const startsAt = parseDate(input.startsAt);
  const expiresAt = parseDate(input.expiresAt);
  if (startsAt === undefined || expiresAt === undefined) return { error: "التاريخ مش صحيح." } as const;
  if (startsAt && expiresAt && expiresAt <= startsAt) return { error: "تاريخ الانتهاء لازم يكون بعد البداية." } as const;

  return { data: { code, type: input.type, value, minSubtotal, maxDiscount, usageLimit, startsAt, expiresAt } } as const;
}

export async function SaveCouponAction(couponId: string | null, input: CouponInput): Promise<CouponMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, code: "NOT_FOUND", message: "المتجر مش موجود." };

  const existing = couponId
    ? await prisma.coupon.findFirst({ where: { id: couponId, storeId: store.id }, select: { id: true, code: true, usedCount: true } })
    : null;
  if (couponId && !existing) return { ok: false, code: "NOT_FOUND", message: "الكود مش موجود." };

  if (!existing) {
    try {
      await assertCanUse(store.id, FEATURE_KEYS.DISCOUNT_CODES);
    } catch (error) {
      if (isEntitlementError(error)) return { ok: false, code: "INVALID", message: entitlementErrorMessage(error) };
      throw error;
    }
  }

  const parsed = validate(input);
  if ("error" in parsed) return { ok: false, code: "INVALID", message: parsed.error! };
  const data = parsed.data;

  // Customers (and old orders / popups) already know a used code by its name.
  if (existing && existing.usedCount > 0 && existing.code !== data.code) {
    return { ok: false, code: "INVALID", message: "الكود ده اتستخدم قبل كده فمينفعش تغيّر اسمه. اعمل نسخة منه باسم جديد." };
  }
  if (existing && data.usageLimit !== null && data.usageLimit < existing.usedCount) {
    return { ok: false, code: "INVALID", message: `الكود اتستخدم ${existing.usedCount} مرة — الحد لازم يكون أكبر من كده.` };
  }

  const duplicate = await prisma.coupon.findFirst({
    where: { storeId: store.id, code: data.code, ...(existing && { NOT: { id: existing.id } }) },
    select: { id: true },
  });
  if (duplicate) return { ok: false, code: "INVALID", message: "عندك كود بنفس الاسم ده." };

  try {
    const saved = existing
      ? await prisma.coupon.update({
          where: { id: existing.id },
          data: { ...data, ...(typeof input.isActive === "boolean" && { isActive: input.isActive }) },
          select: { id: true },
        })
      : await prisma.coupon.create({
          data: { ...data, storeId: store.id, isActive: input.isActive ?? true },
          select: { id: true },
        });
    revalidateCoupons(store.slug);
    return { ok: true, id: saved.id };
  } catch (error) {
    console.error("SaveCouponAction error:", error);
    return { ok: false, code: "FAILED", message: "مقدرناش نحفظ الكود. جرّب تاني." };
  }
}

export async function SetCouponActiveAction(couponId: string, isActive: boolean): Promise<CouponMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, code: "NOT_FOUND", message: "المتجر مش موجود." };
  const coupon = await prisma.coupon.findFirst({ where: { id: couponId, storeId: store.id }, select: { id: true } });
  if (!coupon) return { ok: false, code: "NOT_FOUND", message: "الكود مش موجود." };

  await prisma.coupon.update({ where: { id: coupon.id }, data: { isActive } });
  revalidateCoupons(store.slug);
  return { ok: true, id: coupon.id };
}

export async function DuplicateCouponAction(couponId: string): Promise<CouponMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, code: "NOT_FOUND", message: "المتجر مش موجود." };
  const coupon = await prisma.coupon.findFirst({ where: { id: couponId, storeId: store.id } });
  if (!coupon) return { ok: false, code: "NOT_FOUND", message: "الكود مش موجود." };

  let code = "";
  for (let i = 2; i < 50; i++) {
    const candidate = `${coupon.code.slice(0, 26)}${i}`;
    const taken = await prisma.coupon.findFirst({ where: { storeId: store.id, code: candidate }, select: { id: true } });
    if (!taken) {
      code = candidate;
      break;
    }
  }
  if (!code) return { ok: false, code: "FAILED", message: "مقدرناش نلاقي اسم متاح للنسخة." };

  const copy = await prisma.coupon.create({
    data: {
      storeId: store.id,
      code,
      type: coupon.type,
      value: coupon.value,
      minSubtotal: coupon.minSubtotal,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      startsAt: null,
      expiresAt: coupon.expiresAt && coupon.expiresAt > new Date() ? coupon.expiresAt : null,
      isActive: false,
    },
    select: { id: true },
  });
  revalidateCoupons(store.slug);
  return { ok: true, id: copy.id };
}

/** Used codes stay (orders + reports reference them) — pause instead. */
export async function DeleteCouponAction(couponId: string): Promise<CouponMutationResult> {
  const store = await ownedStore();
  if (!store) return { ok: false, code: "NOT_FOUND", message: "المتجر مش موجود." };
  const coupon = await prisma.coupon.findFirst({ where: { id: couponId, storeId: store.id }, select: { id: true, usedCount: true } });
  if (!coupon) return { ok: false, code: "NOT_FOUND", message: "الكود مش موجود." };

  if (coupon.usedCount > 0) {
    return { ok: false, code: "HAS_USES", message: "الكود ده اتستخدم في طلبات، فبنحتفظ بيه عشان التقارير. تقدر توقفه بدل كده." };
  }

  await prisma.$transaction([
    prisma.appliedCoupon.deleteMany({ where: { couponId: coupon.id } }),
    prisma.coupon.delete({ where: { id: coupon.id } }),
  ]);
  revalidateCoupons(store.slug);
  return { ok: true, id: coupon.id };
}
