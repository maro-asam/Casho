import type { Prisma } from "@prisma/client";
import { intlLocale, tr } from "@/lib/i18n/dashboard";

// One definition of "what state is this code in", shared by the list, its tabs
// and the status pills. Precedence: paused → expired → used up → scheduled → active.

export const COUPON_STATUSES = [
  { value: "active", get label() { return tr("شغّال"); }, tone: "success" },
  { value: "scheduled", get label() { return tr("مجدول"); }, tone: "info" },
  { value: "used_up", get label() { return tr("خلص"); }, tone: "warning" },
  { value: "expired", get label() { return tr("منتهي"); }, tone: "neutral" },
  { value: "paused", get label() { return tr("متوقف"); }, tone: "neutral" },
] as const;

export type CouponStatus = (typeof COUPON_STATUSES)[number]["value"];
export const isCouponStatus = (v: unknown): v is CouponStatus => COUPON_STATUSES.some((s) => s.value === v);
export const couponStatusMeta = (s: CouponStatus) => COUPON_STATUSES.find((x) => x.value === s)!;

type CouponLike = {
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
};

export function couponStatus(c: CouponLike, now = new Date()): CouponStatus {
  if (!c.isActive) return "paused";
  if (c.expiresAt && c.expiresAt < now) return "expired";
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return "used_up";
  if (c.startsAt && c.startsAt > now) return "scheduled";
  return "active";
}

/**
 * Same rules as a Prisma filter. `usedUp` needs a column-to-column comparison,
 * passed in by the caller (prisma.coupon.fields.usageLimit).
 */
export function couponStatusWhere(
  status: CouponStatus,
  now: Date,
  usageLimitField: Prisma.FieldRef<"Coupon", "Int">,
): Prisma.CouponWhereInput {
  const notExpired: Prisma.CouponWhereInput = { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] };
  const usedUp: Prisma.CouponWhereInput = { usageLimit: { not: null }, usedCount: { gte: usageLimitField } };
  const notUsedUp: Prisma.CouponWhereInput = { OR: [{ usageLimit: null }, { usedCount: { lt: usageLimitField } }] };

  switch (status) {
    case "paused":
      return { isActive: false };
    case "expired":
      return { isActive: true, expiresAt: { lt: now } };
    case "used_up":
      return { isActive: true, AND: [notExpired, usedUp] };
    case "scheduled":
      return { isActive: true, startsAt: { gt: now }, AND: [notExpired, notUsedUp] };
    case "active":
      return { isActive: true, AND: [notExpired, notUsedUp, { OR: [{ startsAt: null }, { startsAt: { lte: now } }] }] };
  }
}

export function formatCouponValue(type: "PERCENTAGE" | "FIXED", value: number) {
  const nf = new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 2 });
  return type === "PERCENTAGE" ? tr("{0}٪", nf.format(value)) : tr("{0} ج.م", nf.format(value));
}
