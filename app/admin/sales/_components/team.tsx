import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { Card, StatusText, Unavailable } from "@/components/saas-page";
import { CopyButton } from "@/components/sales/copy-button";
import { MonthBars } from "@/components/sales/month-bars";
import { Monogram } from "@/components/sales/sales-summary";
import { TierTag } from "@/components/sales/tier";
import { buildReferralLink } from "@/lib/sales/attribution";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/sales/format";
import type { MonthlyTrend, SalesSummary, listSalesReps } from "@/lib/sales/queries";
import { cn } from "@/lib/utils";
import { CreateRepDialog } from "./sales-dialogs";

type Rep = Awaited<ReturnType<typeof listSalesReps>>[number] & { payable: number };

/* ── Team commissions, month by month ─────────────────────────────────────── */

export function TeamTrendCard({ trend, title = "عمولات الفريق", className }: { trend: MonthlyTrend; title?: string; className?: string }) {
  const total = trend.reduce((s, t) => s + t.commissions, 0);
  const average = total / Math.max(trend.length, 1);
  return (
    <Card title={title} subtitle={`آخر ${fmtNum(trend.length)} شهور، حسب شهر دفع العميل`} className={className}>
      <div className="px-5 pb-5">
        <p className="text-[34px] leading-[41px] font-bold tabular-nums">{fmtMoney(total)}</p>
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span aria-hidden className="w-4 border-t border-dashed border-(--sys-gray)" />
          متوسط {fmtMoney(Math.round(average))} في الشهر
        </p>
        <div className="mt-6">
          <MonthBars trend={trend} />
        </div>
      </div>
    </Card>
  );
}

/* ── Funnel: signed up → paid → still eligible ────────────────────────────── */

export function TeamFunnelCard({ summary, className }: { summary: SalesSummary; className?: string }) {
  const base = Math.max(summary.signups, 1);
  const stages = [
    { label: "سجّلوا من روابط الفريق", value: summary.signups, fill: "bg-primary/35", note: null },
    { label: "دفعوا أول اشتراك", value: summary.acquired, fill: "bg-primary/65", note: `${fmtPct(summary.conversionRate)} من التسجيلات` },
    {
      label: "مؤهلين دلوقتي",
      value: summary.eligible,
      fill: "bg-primary",
      note: summary.expired > 0 ? `${fmtNum(summary.expired)} خلصت أهليتهم` : null,
    },
  ];
  return (
    <Card title="رحلة العملاء" subtitle="من أول تسجيل لحد الدفع — من أول يوم" className={className}>
      <ol className="space-y-4 px-5 pb-5">
        {stages.map((stage, i) => (
          <li key={stage.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[15px]">{stage.label}</span>
              <span className="text-[22px] leading-7 font-bold tabular-nums">{fmtNum(stage.value)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-(--fill-3)">
              {stage.value > 0 && (
                <div
                  className={cn("apple-grow-x h-full rounded-full", stage.fill)}
                  style={{ width: `${Math.max(3, (stage.value / base) * 100)}%`, animationDelay: `${i * 90}ms` }}
                />
              )}
            </div>
            {stage.note && <p className="mt-1 text-[12px] text-muted-foreground">{stage.note}</p>}
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ── The team: one row per rep, best earners first ────────────────────────── */

const earnedOf = (rep: Rep) => rep.acquisitionCommissions + rep.renewalCommissions + rep.bonusCommissions;

export function RepsCard({ reps, campaign }: { reps: Rep[]; campaign: { name: string; seatsLeft: number } | null }) {
  const active = reps.filter((r) => r.status === "ACTIVE").length;
  const disabled = reps.length - active;
  const sorted = [...reps].sort((a, b) => Number(a.status === "DISABLED") - Number(b.status === "DISABLED") || earnedOf(b) - earnedOf(a));

  return (
    <Card
      id="reps"
      title="المندوبين"
      subtitle={
        reps.length === 0
          ? "كل مندوب ليه رابط إحالة للتجار، وكل تاجر يسجل منه بيتنسب له."
          : `${fmtNum(active)} نشط${disabled ? ` · ${fmtNum(disabled)} موقوف` : ""} — الأعلى عمولات الأول`
      }
      action={reps.length > 0 && <CreateRepDialog campaign={campaign} />}
    >
      {reps.length === 0 ? (
        <Unavailable
          icon={Users}
          title="مفيش مندوبين لسه"
          description="ضيف أول مندوب، وبعدها ابعتله رابط الدخول من صفحته."
          action={<CreateRepDialog campaign={campaign} />}
          className="py-12"
        />
      ) : (
        <ul className="apple-rows pb-2 [--row-inset:72px]">
          {sorted.map((rep) => {
            const name = rep.user.name ?? rep.user.email;
            const off = rep.status === "DISABLED";
            return (
              <li key={rep.id} className="relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-(--fill-3)/50">
                <Monogram name={name} muted={off} />

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={`/admin/sales/reps/${rep.id}`}
                      className="truncate text-[15px] font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    >
                      {name}
                    </Link>
                    {off && (
                      <StatusText tone="danger" className="text-[12px]">
                        موقوف
                      </StatusText>
                    )}
                  </div>
                  <p dir="ltr" className="truncate text-right text-[13px] text-muted-foreground">
                    {rep.user.email}
                  </p>
                </div>

                <div className="hidden w-28 shrink-0 md:block">
                  <TierTag tier={rep.level} compact />
                </div>

                <div className="hidden w-36 shrink-0 lg:block">
                  <p className="text-[15px] tabular-nums">
                    <span className="font-semibold">{fmtNum(rep.eligible)}</span> مؤهل
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground tabular-nums">
                    {fmtNum(rep.acquired)} دفعوا · {fmtNum(rep.signups)} سجّلوا
                  </p>
                </div>

                <div className="hidden w-20 shrink-0 xl:block">
                  <p className="text-[15px] font-semibold tabular-nums">{fmtPct(rep.conversionRate)}</p>
                  <p className="text-[12px] text-muted-foreground">تحويل</p>
                </div>

                <div className="shrink-0 text-end sm:w-32">
                  <p className="text-[15px] font-semibold tabular-nums">{fmtMoney(earnedOf(rep))}</p>
                  <p className="truncate text-[12px] text-muted-foreground tabular-nums">
                    {rep.payable > 0 ? (
                      <span className="text-foreground/80">مستحق {fmtMoney(rep.payable)}</span>
                    ) : (
                      `إيراد ${fmtMoney(rep.revenueNet)}`
                    )}
                  </p>
                </div>

                {rep.user.referralCode ? (
                  <CopyButton value={buildReferralLink(rep.user.referralCode)} label={`نسخ رابط إحالة ${name}`} iconOnly className="hidden sm:inline-flex" />
                ) : (
                  <span aria-hidden className="hidden size-9 sm:block" />
                )}
                <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--label-3)" strokeWidth={2.2} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
