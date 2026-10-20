import Link from "next/link";
import { CalendarClock, TrendingUp } from "lucide-react";

import { StatusText } from "@/components/saas-page";
import { couponStatusMeta, formatCouponValue, type CouponStatus } from "@/lib/coupons/coupon-status";
import { cn } from "@/lib/utils";
import { CouponActiveSwitch, CouponRowActions } from "./coupon-row-actions";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type CouponRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  status: CouponStatus;
  /** Piasters, from real orders that used the code. */
  revenue: number;
  popupNames: string[];
};

const nf = lazyIntl.number({ maximumFractionDigits: 2 });
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short" });

/** Wallet-pass stub color per state: live codes are tinted, dead ones go gray. */
const STUB: Record<CouponStatus, string> = {
  active: "bg-linear-to-b from-primary/85 to-primary",
  scheduled: "bg-linear-to-b from-[#7d7aff] to-[#5e5ce6]",
  used_up: "bg-linear-to-b from-[#ffb340] to-[#ff8d28]",
  expired: "bg-linear-to-b from-[#aeaeb2] to-[#8e8e93]",
  paused: "bg-linear-to-b from-[#aeaeb2] to-[#8e8e93]",
};

type Props = { coupons: CouponRow[]; editHref: (id: string) => string; shareUrl: (code: string) => string };

function conditions(c: CouponRow) {
  return [
    c.type === "PERCENTAGE" && c.maxDiscount && tr("أقصى {0} ج.م", nf.format(c.maxDiscount)),
    c.minSubtotal && tr("من {0} ج.م", nf.format(c.minSubtotal)),
  ]
    .filter(Boolean)
    .join(" · ");
}

function Usage({ c }: { c: CouponRow }) {
  if (!c.usageLimit) {
    return (
      <p className="text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{nf.format(c.usedCount)}</span> {tr("مرة · مفتوح")}
      </p>
    );
  }
  const ratio = Math.min(1, c.usedCount / c.usageLimit);
  return (
    <div className="space-y-1">
      <p className="text-[13px] text-muted-foreground tabular-nums">
        <span className="font-semibold text-foreground">{nf.format(c.usedCount)}</span> {tr("من {0}", nf.format(c.usageLimit))}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-(--fill-3)" role="img" aria-label={tr("اتستخدم {0} من {1}", c.usedCount, c.usageLimit)}>
        <div className={cn("h-full rounded-full", ratio >= 1 ? "bg-(--sys-orange)" : "bg-primary")} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function validity(c: CouponRow) {
  if (!c.startsAt && !c.expiresAt) return tr("من غير تاريخ");
  return `${c.startsAt ? df.format(c.startsAt) : tr("الآن")} ← ${c.expiresAt ? df.format(c.expiresAt) : tr("مفتوح")}`;
}

/** Codes as Wallet passes: a tinted stub with the discount, a perforation, then the details. */
export function CouponsTable({ coupons, editHref, shareUrl }: Props) {
  return (
    <ul className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 2xl:grid-cols-3">
      {coupons.map((c) => {
        const meta = couponStatusMeta(c.status);
        const cond = conditions(c);
        return (
          <li key={c.id} className="group relative flex min-h-40 overflow-hidden rounded-[18px] bg-(--fill-3)/55 transition-colors hover:bg-(--fill-3)/80">
            {/* Stub */}
            <div className={cn("flex w-26 shrink-0 flex-col items-center justify-center gap-0.5 px-2 text-center text-white", STUB[c.status])}>
              <span className="text-[26px] leading-8 font-bold tabular-nums ltr:tracking-[-0.02em]">{formatCouponValue(c.type, c.value)}</span>
              <span className="text-[12px] font-medium text-white/80">{tr("خصم")}</span>
            </div>

            {/* Perforation with punched notches */}
            <div aria-hidden className="relative w-0 border-s-2 border-dashed border-card">
              <span className="absolute -top-2 -start-2 size-4 rounded-full bg-card" />
              <span className="absolute -bottom-2 -start-2 size-4 rounded-full bg-card" />
            </div>

            {/* Details */}
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={editHref(c.id)}
                    scroll={false}
                    dir="ltr"
                    className="block truncate font-mono text-[17px] font-bold tracking-[0.08em] after:absolute after:inset-0 after:rounded-[18px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring rtl:text-right"
                  >
                    {c.code}
                  </Link>
                  <p className="truncate text-[13px] text-muted-foreground">{cond || tr("على أي طلب")}</p>
                </div>
                <CouponRowActions
                  coupon={{ id: c.id, code: c.code, usedCount: c.usedCount, isActive: c.isActive, popupNames: c.popupNames }}
                  editHref={editHref(c.id)}
                  shareUrl={shareUrl(c.code)}
                />
              </div>

              <Usage c={c} />

              <div className="space-y-0.5 text-[12px] text-muted-foreground">
                <p className="flex items-center gap-1.5 tabular-nums">
                  <CalendarClock className="size-3.5 shrink-0" />
                  {validity(c)}
                </p>
                <p className="flex items-center gap-1.5 tabular-nums">
                  <TrendingUp className="size-3.5 shrink-0" />
                  {c.revenue ? tr("{0} مبيعات بالكود", money.format(c.revenue / 100)) : tr("لسه مفيش مبيعات")}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <StatusText tone={meta.tone}>{meta.label}</StatusText>
                <CouponActiveSwitch key={String(c.isActive)} couponId={c.id} code={c.code} isActive={c.isActive} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
