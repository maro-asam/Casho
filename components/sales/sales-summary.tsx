import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeDollarSign, CalendarClock, Repeat, TrendingUp, UserCheck, UserPlus, Users, Wallet } from "lucide-react";
import { SalesCommissionStatus } from "@prisma/client";
import { StatusPill } from "@/components/saas-page";
import type { SalesSummary } from "@/lib/sales/queries";
import { TIER_LABELS, formatRateBps, type SalesTier } from "@/lib/sales/rules";
import {
  COMMISSION_STATUS_META,
  KIND_LABELS,
  fmtCohort,
  fmtEligibleThrough,
  fmtMoney,
  fmtNum,
  fmtPct,
} from "@/lib/sales/format";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  actions,
  flush = false,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  /** Edge-to-edge body for tables. */
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-sm", className)}>
      <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className={flush ? undefined : "p-4"}>{children}</div>
    </section>
  );
}

const TIER_ORDER: SalesTier[] = ["STARTER", "GROWTH", "PRO"];
const STATUS_ORDER: SalesCommissionStatus[] = ["PENDING", "APPROVED", "ON_HOLD", "PAID", "REVERSED", "REJECTED"];

/** KPI grid. `program` = whole team (no per-rep level). */
export function SalesKpis({ summary, scope }: { summary: SalesSummary; scope: "rep" | "program" }) {
  const s = summary;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={UserPlus} label="تسجيلات من الإحالة" value={fmtNum(s.signups)} hint="كل الحسابات المنسوبة — منذ البداية" />
      <StatCard
        icon={UserCheck}
        label="عملاء دفعوا (مكتسبين)"
        value={fmtNum(s.acquired)}
        hint={`نسبة التحويل ${fmtPct(s.conversionRate)} — أول دفعة اشتراك موثّقة`}
      />
      <StatCard
        icon={Users}
        label="مؤهلين حاليًا"
        value={fmtNum(s.eligible)}
        hint={`${fmtNum(s.expired)} انتهت أهليتهم (6 شهور من شهر الاكتساب)`}
      />
      {scope === "rep" ? (
        <StatCard
          icon={TrendingUp}
          label="المستوى الحالي"
          value={<span className="text-lg">{TIER_LABELS[s.level]}</span>}
          hint={`العميل الجاي هياخد ${formatRateBps(s.nextAcquisition.rateBps)}`}
        />
      ) : (
        <StatCard icon={TrendingUp} label="نسبة التحويل" value={fmtPct(s.conversionRate)} hint="عملاء دفعوا ÷ تسجيلات" />
      )}
      <StatCard
        icon={Wallet}
        label="إيراد اشتراكات موثّق"
        value={fmtMoney(s.revenue.net)}
        hint={`خصومات اشتراك ${fmtMoney(s.revenue.charged)} − مرتجعات ${fmtMoney(s.revenue.refunded)} (العملاء المنسوبين حاليًا)`}
      />
      <StatCard icon={BadgeDollarSign} label="عمولات الاكتساب" value={fmtMoney(s.commissions.acquisitionEarned)} hint="غير الملغاة والمرفوضة" />
      <StatCard icon={Repeat} label="عمولات التجديد (6%)" value={fmtMoney(s.commissions.renewalEarned)} hint="غير الملغاة والمرفوضة" />
      <StatCard
        icon={CalendarClock}
        label={s.payable === null ? "إجمالي المصروف فعليًا" : "مستحق للصرف الآن"}
        value={fmtMoney(s.payable ?? s.payouts.total)}
        hint={s.payable === null ? `${fmtNum(s.payouts.count)} عملية صرف مسجلة` : `اتصرف فعليًا ${fmtMoney(s.payouts.total)}`}
      />
    </div>
  );
}

export function CommissionBreakdown({ summary }: { summary: SalesSummary }) {
  const { byKind, byStatus, countByStatus, adjustments } = summary.commissions;
  return (
    <Panel title="العمولات حسب الحالة" description="كل المبالغ بالجنيه المصري — منذ البداية. التسويات (استرداد / تعديل يدوي) محسوبة لوحدها.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="h-9 bg-muted/40 text-right text-xs text-muted-foreground">
              <th className="ps-3 font-medium">الحالة</th>
              <th className="font-medium">{KIND_LABELS.ACQUISITION}</th>
              <th className="font-medium">{KIND_LABELS.RENEWAL}</th>
              <th className="pe-3 text-left font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {STATUS_ORDER.map((status) => (
              <tr key={status} className="h-10">
                <td className="ps-3">
                  <StatusPill tone={COMMISSION_STATUS_META[status].tone}>{COMMISSION_STATUS_META[status].label}</StatusPill>
                  <span className="ms-2 text-xs text-muted-foreground tabular-nums">({fmtNum(countByStatus[status])})</span>
                </td>
                <td className="tabular-nums">{fmtMoney(byKind.ACQUISITION[status])}</td>
                <td className="tabular-nums">{fmtMoney(byKind.RENEWAL[status])}</td>
                <td className="pe-3 text-left font-medium tabular-nums">{fmtMoney(byStatus[status])}</td>
              </tr>
            ))}
            <tr className="h-10">
              <td className="ps-3 text-muted-foreground">تسويات (+/−)</td>
              <td colSpan={2} />
              <td className="pe-3 text-left font-medium tabular-nums">{fmtMoney(adjustments)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function TierPanel({ summary }: { summary: SalesSummary }) {
  const { rule, allocation, eligible } = summary;
  const ranges: Record<SalesTier, string> = {
    STARTER: `العملاء 1–${rule.starterMaxPosition}`,
    GROWTH: `العملاء ${rule.starterMaxPosition + 1}–${rule.growthMaxPosition}`,
    PRO: `العميل ${rule.growthMaxPosition + 1} وما بعده`,
  };
  const rates: Record<SalesTier, number> = { STARTER: rule.starterRateBps, GROWTH: rule.growthRateBps, PRO: rule.proRateBps };
  return (
    <Panel
      title="توزيع المستويات"
      description={`نظام شرائح: كل عميل جديد بياخد نسبة ترتيبه وسط العملاء المؤهلين حاليًا (${fmtNum(eligible)}). العمولات المسجلة قبل كده مبتتغيرش.`}
    >
      <ul className="grid gap-3 sm:grid-cols-3">
        {TIER_ORDER.map((tier) => (
          <li key={tier} className={cn("rounded-lg border p-3", summary.level === tier && "border-primary bg-primary/5")}>
            <p className="text-sm font-medium">{TIER_LABELS[tier]}</p>
            <p className="text-xs text-muted-foreground">
              {ranges[tier]} · {formatRateBps(rates[tier])}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{fmtNum(allocation[tier])}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">عمولة التجديد: {formatRateBps(rule.renewalRateBps)} على كل دفعة خلال فترة أهلية العميل ({fmtNum(rule.eligibilityMonths)} شهور تقويمية).</p>
    </Panel>
  );
}

export function ExpiringCohorts({ summary }: { summary: SalesSummary }) {
  const cohorts = summary.expiringCohorts.slice(0, 6);
  return (
    <Panel title="انتهاء الأهلية القادم" description="العملاء بيخرجوا من العدد المؤهل مع بعض في أول الشهر السابع من شهر اكتسابهم (توقيت القاهرة).">
      {cohorts.length === 0 ? (
        <p className="text-sm text-muted-foreground">مفيش عملاء مؤهلين حاليًا.</p>
      ) : (
        <ul className="divide-y text-sm">
          {cohorts.map((c) => (
            <li key={`${c.cohortMonth}`} className="flex items-center justify-between gap-3 py-2">
              <span>
                دفعة {fmtCohort(c.cohortMonth)}
                <span className="ms-2 text-xs text-muted-foreground">مؤهلين لحد {fmtEligibleThrough(c.eligibleUntil)}</span>
              </span>
              <span className="font-medium tabular-nums">{fmtNum(c.count)} عميل</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
