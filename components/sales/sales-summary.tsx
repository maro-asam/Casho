import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import type { SalesCommissionKind, SalesCommissionStatus } from "@prisma/client";
import { Card, initialOf, toneDotClass } from "@/components/saas-page";
import type { SalesSummary } from "@/lib/sales/queries";
import { formatRateBps, type CommissionRuleSet, type SalesTier } from "@/lib/sales/rules";
import { COMMISSION_STATUS_META, KIND_LABELS, fmtCohort, fmtDateTime, fmtEligibleThrough, fmtMoney, fmtNum } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { TIER, TIER_ORDER } from "./tier";

/* ── Small marks shared by the admin sales pages ──────────────────────────── */

/** Person monogram: brand-tinted circle; gray when the person is inactive. */
export function Monogram({ name, muted = false, size = "md" }: { name: string; muted?: boolean; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-linear-to-b font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)]",
        size === "lg" ? "size-14 text-[22px]" : "size-10 text-[15px]",
        muted ? "from-[#a1a1a6] to-[#8e8e93]" : "from-primary/80 to-primary text-primary-foreground",
      )}
    >
      {initialOf(name)}
    </span>
  );
}

/** Empty line inside a card. */
export function CardEmpty({ children }: { children: ReactNode }) {
  return <p className="px-5 pt-1 pb-6 text-[15px] text-muted-foreground">{children}</p>;
}

/* ── Commissions by status: one total, a segmented bar, a row per status ─── */

const STATUS_ORDER: SalesCommissionStatus[] = ["PENDING", "ON_HOLD", "APPROVED", "PAID", "REVERSED", "REJECTED"];
const LIVE: SalesCommissionStatus[] = ["PENDING", "ON_HOLD", "APPROVED", "PAID"];
const KINDS: SalesCommissionKind[] = ["ACQUISITION", "RENEWAL", "BONUS"];

export function CommissionBreakdown({ summary, className }: { summary: SalesSummary; className?: string }) {
  const { byKind, byStatus, countByStatus, adjustments } = summary.commissions;
  const earned = LIVE.reduce((s, status) => s + byStatus[status], 0);
  const rows = STATUS_ORDER.filter((status) => countByStatus[status] > 0);
  const bar = LIVE.filter((status) => byStatus[status] > 0);

  return (
    <Card title="العمولات حسب الحالة" subtitle="من أول يوم. المرفوض والملغي مش داخلين في الإجمالي." className={className}>
      {rows.length === 0 ? (
        <CardEmpty>مفيش عمولات لسه.</CardEmpty>
      ) : (
        <>
          <div className="px-5 pb-3">
            <p className="text-[34px] leading-[41px] font-bold tabular-nums">{fmtMoney(earned)}</p>
            <p className="text-[13px] text-muted-foreground">
              {adjustments !== 0 ? `قبل التسويات (${fmtMoney(adjustments)})` : "مفيش تسويات"}
            </p>

            {/* Segmented bar: 2px surface gaps between parts. */}
            <div role="img" aria-label={`إجمالي العمولات ${fmtMoney(earned)}`} className="mt-4 h-3 w-full overflow-hidden rounded-full bg-(--fill-3)">
              {earned > 0 && (
                <div className="apple-grow-x flex h-full w-full gap-[2px]">
                  {bar.map((status) => (
                    <span
                      key={status}
                      className={cn("h-full", toneDotClass(COMMISSION_STATUS_META[status].tone))}
                      style={{ flexGrow: byStatus[status], flexBasis: 0 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <dl className="apple-rows pb-2 [--row-inset:40px]">
            {rows.map((status) => {
              const split = KINDS.filter((k) => byKind[k][status] !== 0).map((k) => `${KIND_LABELS[k]} ${fmtMoney(byKind[k][status])}`);
              const dead = !LIVE.includes(status);
              return (
                <div key={status} className="flex min-h-11 items-center gap-3 px-5 py-2.5">
                  <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", toneDotClass(COMMISSION_STATUS_META[status].tone))} />
                  <dt className="min-w-0 flex-1">
                    <span className="text-[15px]">{COMMISSION_STATUS_META[status].label}</span>
                    <span className="ms-1.5 text-[13px] text-muted-foreground tabular-nums">{fmtNum(countByStatus[status])}</span>
                    {split.length > 1 && <span className="block truncate text-[12px] text-muted-foreground">{split.join(" · ")}</span>}
                  </dt>
                  <dd className={cn("text-[15px] font-semibold tabular-nums", dead && "font-normal text-muted-foreground")}>
                    {fmtMoney(byStatus[status])}
                  </dd>
                </div>
              );
            })}
            {adjustments !== 0 && (
              <div className="flex min-h-11 items-center gap-3 px-5 py-2.5">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full border-[1.5px] border-(--sys-gray)" />
                <dt className="min-w-0 flex-1 text-[15px]">تسويات (+/−)</dt>
                <dd className="text-[15px] font-semibold tabular-nums">{fmtMoney(adjustments)}</dd>
              </div>
            )}
          </dl>
        </>
      )}
    </Card>
  );
}

/* ── Tier ladder: range, rate and (for a rep) how many customers sit in each ─ */

export function TierLadder({
  rule,
  allocation,
  current,
  title = "المستويات",
  subtitle,
  className,
}: {
  rule: CommissionRuleSet;
  /** Per-tier customer counts (a rep's), shown under each range. */
  allocation?: Record<SalesTier, number>;
  /** Highlighted step — the tier the rep's next customer lands in. */
  current?: SalesTier;
  title?: string;
  subtitle?: ReactNode;
  className?: string;
}) {
  const ranges: Record<SalesTier, string> = {
    STARTER: `العملاء ${fmtNum(1)}–${fmtNum(rule.starterMaxPosition)}`,
    GROWTH: `العملاء ${fmtNum(rule.starterMaxPosition + 1)}–${fmtNum(rule.growthMaxPosition)}`,
    PRO: `من العميل ${fmtNum(rule.growthMaxPosition + 1)}`,
  };
  const rates: Record<SalesTier, number> = { STARTER: rule.starterRateBps, GROWTH: rule.growthRateBps, PRO: rule.proRateBps };

  return (
    <Card title={title} subtitle={subtitle} className={className}>
      <ol className="space-y-1 px-3 pb-2">
        {TIER_ORDER.map((tier) => {
          const here = tier === current;
          return (
            <li
              key={tier}
              aria-current={here ? "step" : undefined}
              className={cn("flex min-h-13 items-center gap-3 rounded-xl px-3 py-2", TIER[tier].color, here && "bg-(--fill-3)")}
            >
              <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-(--tier)" />
              <div className="min-w-0 flex-1">
                <p className={cn("text-[15px]", here && "font-semibold")}>
                  {TIER[tier].number} <span className="text-muted-foreground">— {TIER[tier].name}</span>
                  {here && <span className="ms-1.5 text-[12px] font-normal text-muted-foreground">العميل الجاي هنا</span>}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {ranges[tier]}
                  {allocation && ` · ${fmtNum(allocation[tier])} عنده`}
                </p>
              </div>
              <span dir="ltr" className="text-[17px] font-semibold tabular-nums">
                {formatRateBps(rates[tier])}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="border-t-[0.5px] border-border px-5 py-3 text-[13px] text-muted-foreground">
        التجديد <span dir="ltr" className="font-semibold text-foreground">{formatRateBps(rule.renewalRateBps)}</span> على كل دفعة لمدة{" "}
        {fmtNum(rule.eligibilityMonths)} شهور تقويمية من شهر أول دفعة.
      </p>
    </Card>
  );
}

/* ── Who leaves the eligible count next ───────────────────────────────────── */

export function ExpiringCohorts({ summary, className }: { summary: SalesSummary; className?: string }) {
  const cohorts = summary.expiringCohorts.slice(0, 6);
  return (
    <Card title="انتهاء الأهلية القادم" subtitle="كل دفعة بتخرج من العدد المؤهل مع بعض أول الشهر السابع (توقيت القاهرة)." className={className}>
      {cohorts.length === 0 ? (
        <CardEmpty>مفيش عملاء مؤهلين دلوقتي.</CardEmpty>
      ) : (
        <ul className="apple-rows pb-2 [--row-inset:61px]">
          {cohorts.map((c) => (
            <li key={`${c.cohortMonth}-${c.eligibleUntil?.toISOString()}`} className="flex min-h-13 items-center gap-3 px-5 py-2.5">
              <span className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-orange) text-white">
                <CalendarClock className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">دفعة {fmtCohort(c.cohortMonth)}</p>
                <p className="text-[13px] text-muted-foreground">مؤهلين لحد {fmtEligibleThrough(c.eligibleUntil)}</p>
              </div>
              <span className="text-[15px] font-semibold tabular-nums">
                {fmtNum(c.count)} <span className="font-normal text-muted-foreground">{c.count === 1 ? "عميل" : "عملاء"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ── Audit trail rows ─────────────────────────────────────────────────────── */

type AuditLog = {
  id: string;
  action: string;
  reason: string | null;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

export function AuditRows({ logs, labels }: { logs: AuditLog[]; labels: Record<string, string> }) {
  if (logs.length === 0) return <CardEmpty>مفيش إجراءات لسه.</CardEmpty>;
  return (
    <ul className="apple-rows pb-2 [--row-inset:20px]">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start justify-between gap-4 px-5 py-2.5">
          <div className="min-w-0">
            <p className="text-[15px]">{labels[log.action] ?? log.action}</p>
            <p className="text-[13px] text-muted-foreground">{log.actor ? (log.actor.name ?? log.actor.email) : "النظام"}</p>
            {log.reason && <p className="text-[13px] text-foreground/75">{log.reason}</p>}
          </div>
          <time dateTime={log.createdAt.toISOString()} className="shrink-0 pt-0.5 text-[12px] text-muted-foreground tabular-nums">
            {fmtDateTime(log.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
