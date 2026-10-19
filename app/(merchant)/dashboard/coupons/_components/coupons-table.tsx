import Link from "next/link";

import { StatusPill } from "@/components/saas-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { couponStatusMeta, formatCouponValue, type CouponStatus } from "@/lib/coupons/coupon-status";
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
      <div className="text-sm">
        <span className="tabular-nums">{nf.format(c.usedCount)}</span> <span className="text-xs text-muted-foreground">{tr("مرة · مفتوح")}</span>
      </div>
    );
  }
  const ratio = Math.min(1, c.usedCount / c.usageLimit);
  return (
    <div className="w-28 space-y-1">
      <p className="text-sm tabular-nums">
        {nf.format(c.usedCount)} <span className="text-xs text-muted-foreground">{tr("من {0}", nf.format(c.usageLimit))}</span>
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={tr("اتستخدم {0} من {1}", c.usedCount, c.usageLimit)}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function Validity({ c }: { c: CouponRow }) {
  if (!c.startsAt && !c.expiresAt) return <span className="text-sm text-muted-foreground">{tr("من غير تاريخ")}</span>;
  return (
    <span className="text-sm tabular-nums">
      {c.startsAt ? df.format(c.startsAt) : tr("الآن")} <span className="text-muted-foreground">←</span> {c.expiresAt ? df.format(c.expiresAt) : tr("مفتوح")}
    </span>
  );
}

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
export function CouponsTable({ coupons, editHref, shareUrl }: Props) {
  const controls = (c: CouponRow) => (
    <div className="flex items-center justify-end gap-2">
      <CouponActiveSwitch key={String(c.isActive)} couponId={c.id} code={c.code} isActive={c.isActive} />
      <CouponRowActions
        coupon={{ id: c.id, code: c.code, usedCount: c.usedCount, isActive: c.isActive, popupNames: c.popupNames }}
        editHref={editHref(c.id)}
        shareUrl={shareUrl(c.code)}
      />
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-start text-xs font-medium text-muted-foreground">{tr("الكود")}</TableHead>
              <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("الاستخدام")}</TableHead>
              <TableHead className="hidden h-10 text-start text-xs font-medium text-muted-foreground lg:table-cell">{tr("الصلاحية")}</TableHead>
              <TableHead className="hidden h-10 text-end text-xs font-medium text-muted-foreground xl:table-cell">{tr("مبيعات بالكود")}</TableHead>
              <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("الحالة")}</TableHead>
              <TableHead className="h-10 w-28 pe-4 text-end text-xs font-medium text-muted-foreground">{tr("تشغيل")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => {
              const meta = couponStatusMeta(c.status);
              return (
                <TableRow key={c.id} className="relative">
                  <TableCell className="py-3 ps-4">
                    <Link
                      href={editHref(c.id)}
                      scroll={false}
                      dir="ltr"
                      className="font-mono text-sm font-semibold tracking-wide after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    >
                      {c.code}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{formatCouponValue(c.type, c.value)}</span>
                      {conditions(c) && ` · ${conditions(c)}`}
                    </p>
                  </TableCell>
                  <TableCell className="py-3">
                    <Usage c={c} />
                  </TableCell>
                  <TableCell className="hidden py-3 lg:table-cell">
                    <Validity c={c} />
                  </TableCell>
                  <TableCell className="hidden py-3 text-end text-sm tabular-nums xl:table-cell">
                    {c.revenue ? money.format(c.revenue / 100) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </TableCell>
                  <TableCell className="py-3 pe-4">{controls(c)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {coupons.map((c) => {
          const meta = couponStatusMeta(c.status);
          return (
            <li key={c.id} className="relative space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={editHref(c.id)} scroll={false} dir="ltr" className="block truncate font-mono text-sm font-semibold after:absolute after:inset-0">
                    {c.code}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatCouponValue(c.type, c.value)}
                    {conditions(c) && ` · ${conditions(c)}`}
                  </p>
                </div>
                {controls(c)}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                <span className="tabular-nums">
                  {nf.format(c.usedCount)}
                  {c.usageLimit ? tr(" من {0}", nf.format(c.usageLimit)) : ""}{" "}{tr("استخدام{0}", c.revenue ? ` · ${money.format(c.revenue / 100)}` : "")}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
