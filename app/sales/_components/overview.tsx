import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CalendarClock, ChevronLeft, MessageCircle, PartyPopper } from "lucide-react";
import { SalesCommissionStatus } from "@prisma/client";
import { Card, StatusText, Unavailable, appleButton, initialOf, toneDotClass } from "@/components/saas-page";
import { MonthBars } from "@/components/sales/month-bars";
import { TIER, TIER_ORDER, TierTag } from "@/components/sales/tier";
import { levelProgress, salesGreeting, salesQuote } from "@/lib/sales/insights";
import type { FollowUp, RepMonthlyTrend, SalesSummary } from "@/lib/sales/queries";
import { formatRateBps, type SalesTier } from "@/lib/sales/rules";
import {
  COMMISSION_STATUS_META,
  fmtEligibleThrough,
  fmtMoney,
  fmtMonthName,
  fmtNum,
  fmtPct,
  fmtRelativeDays,
  whatsappLink,
} from "@/lib/sales/format";
import { cn } from "@/lib/utils";

/* ── Hero: the rep's name is the page title ──────────────────────────────── */

export function RepHero({ name, summary, trend }: { name: string; summary: SalesSummary; trend: RepMonthlyTrend }) {
  const now = new Date();
  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2] ?? { commissions: 0, signups: 0, acquired: 0 };
  // Last month's full figure beside this month's running one — a % change would
  // read as a drop every early month.
  const stats = [
    { label: "تسجيلات", value: fmtNum(current.signups), before: fmtNum(previous.signups) },
    { label: "عملاء دفعوا", value: fmtNum(current.acquired), before: fmtNum(previous.acquired) },
    { label: "عمولات", value: fmtMoney(current.commissions), before: fmtMoney(previous.commissions) },
  ];

  return (
    <section aria-labelledby="rep-name" className="apple-card relative isolate overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
      {/* Ambient light behind the name — depth from light, not borders. */}
      <div aria-hidden className="pointer-events-none absolute -top-28 -start-24 -z-10 size-80 rounded-full bg-primary/12 blur-3xl dark:bg-primary/20" />
      <div
        aria-hidden
        className={cn("pointer-events-none absolute -bottom-32 end-10 -z-10 size-72 rounded-full bg-(--tier)/10 blur-3xl", TIER[summary.level].color)}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2.5">
          <p className="text-[15px] font-semibold text-muted-foreground">{salesGreeting(now)}،</p>
          <h1
            id="rep-name"
            // pb + generous leading keep Arabic descenders inside the clipped gradient.
            className="apple-gradient-text pb-1 text-[34px] leading-[1.3] font-bold sm:text-[44px] ltr:tracking-[-0.02em]"
          >
            {name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <TierTag tier={summary.level} />
            <span className="inline-flex h-7 items-center rounded-full bg-(--fill-3) px-3 text-[13px] text-foreground/80 tabular-nums">
              {fmtNum(summary.eligible)} عميل مؤهل
            </span>
          </div>
          <p className="max-w-xl pt-1 text-[15px] leading-6 text-muted-foreground">{salesQuote(now)}</p>
        </div>

        <div className="shrink-0 lg:min-w-[27rem]">
          <p className="mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">
            الشهر ده · {fmtMonthName(current.month)}
          </p>
          <dl className="grid grid-cols-3 rounded-2xl bg-background py-3">
            {stats.map((stat, i) => (
              <div key={stat.label} className={cn("min-w-0 px-3 sm:px-4", i > 0 && "border-s-[0.5px] border-border")}>
                <dt className="truncate text-[12px] text-muted-foreground">{stat.label}</dt>
                <dd className="mt-0.5">
                  <span className="block truncate text-[19px] leading-6 font-bold tabular-nums">{stat.value}</span>
                  <span className="block truncate text-[11px] text-muted-foreground tabular-nums">اللي فات {stat.before}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ── Money: what's owed now, and where every pound stands ─────────────────── */

const EARNED_STATUSES: SalesCommissionStatus[] = ["PENDING", "APPROVED", "ON_HOLD", "PAID"];

const STATUS_HINT: Partial<Record<SalesCommissionStatus, string>> = {
  PENDING: "الإدارة بتراجعها",
  APPROVED: "جاهزة للصرف",
  ON_HOLD: "متوقفة لحد ما تتراجع",
  PAID: "وصلتلك",
};

export function EarningsCard({ summary }: { summary: SalesSummary }) {
  const { byStatus } = summary.commissions;
  const parts = EARNED_STATUSES.map((status) => ({ status, amount: byStatus[status] })).filter(
    (p) => p.amount > 0 || p.status !== "ON_HOLD",
  );
  const total = parts.reduce((s, p) => s + Math.max(0, p.amount), 0);

  return (
    <Card
      title="فلوسك"
      subtitle="كل العمولات من أول يوم"
      action={
        <Link href="/sales/commissions" className={appleButton.plain}>
          التفاصيل
          <ChevronLeft className="size-4" strokeWidth={2.2} />
        </Link>
      }
    >
      <div className="px-5 pb-2">
        <p className="text-[13px] text-muted-foreground">مستحق ليك دلوقتي</p>
        <p className="text-[40px] leading-[48px] font-bold tabular-nums ltr:tracking-[-0.02em]">{fmtMoney(summary.payable ?? 0)}</p>
        <p className="text-[13px] text-muted-foreground">
          {summary.payouts.count > 0
            ? `اتصرف لك لحد دلوقتي ${fmtMoney(summary.payouts.total)} على ${fmtNum(summary.payouts.count)} تحويل`
            : "بيتصرف لما الإدارة تحوّل وتسجل التحويل"}
        </p>

        {/* Segmented bar: 2px surface gaps between parts; a gray track when empty. */}
        <div
          role="img"
          aria-label={`إجمالي العمولات ${fmtMoney(total)}`}
          className="mt-5 h-3 w-full overflow-hidden rounded-full bg-(--fill-3)"
        >
          {total > 0 && (
            <div className="apple-grow-x flex h-full w-full gap-[2px]">
              {parts
                .filter((p) => p.amount > 0)
                .map((p) => (
                  <span
                    key={p.status}
                    className={cn("h-full", toneDotClass(COMMISSION_STATUS_META[p.status].tone))}
                    style={{ flexGrow: p.amount, flexBasis: 0 }}
                  />
                ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          الإجمالي <span className="font-semibold text-foreground tabular-nums">{fmtMoney(total)}</span>
        </p>
      </div>

      <dl className="apple-rows pb-2 [--row-inset:40px]">
        {parts.map((p) => (
          <div key={p.status} className="flex min-h-11 items-center gap-3 px-5 py-2">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", toneDotClass(COMMISSION_STATUS_META[p.status].tone))} />
            <dt className="min-w-0 flex-1 text-[15px]">
              {COMMISSION_STATUS_META[p.status].label}
              <span className="ms-1.5 text-[13px] text-muted-foreground">{STATUS_HINT[p.status]}</span>
            </dt>
            <dd className="text-[15px] font-semibold tabular-nums">{fmtMoney(p.amount)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* ── Level: an activity ring toward the next rate, and the ladder ─────────── */

function Ring({ progress, className, children }: { progress: number; className?: string; children: ReactNode }) {
  const size = 156;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-(--tier) opacity-[0.16]" />
        {p > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p)}
            className="apple-ring-fill stroke-(--tier)"
            style={{ "--ring-from": c } as CSSProperties}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function LevelCard({ summary, promo }: { summary: SalesSummary; promo?: { rateBps: number; name: string } | null }) {
  const { rule, allocation, eligible } = summary;
  const lp = levelProgress(eligible, rule);
  // A running campaign can pay more than the tier; the ring shows what the next customer really earns.
  const promoWins = !!promo && promo.rateBps > lp.next.rateBps;
  const nextRate = promoWins ? promo.rateBps : lp.next.rateBps;
  const ranges: Record<SalesTier, string> = {
    STARTER: `العملاء ${fmtNum(1)}–${fmtNum(rule.starterMaxPosition)}`,
    GROWTH: `العملاء ${fmtNum(rule.starterMaxPosition + 1)}–${fmtNum(rule.growthMaxPosition)}`,
    PRO: `من العميل ${fmtNum(rule.growthMaxPosition + 1)}`,
  };
  const rates: Record<SalesTier, number> = { STARTER: rule.starterRateBps, GROWTH: rule.growthRateBps, PRO: rule.proRateBps };
  const cohorts = summary.expiringCohorts.slice(0, 2);

  return (
    <Card
      title="مستواك"
      subtitle={`النسبة بتعلى مع كل عميل مؤهل، وعلى كل تجديد ${formatRateBps(rule.renewalRateBps)} لمدة ${fmtNum(rule.eligibilityMonths)} شهور`}
    >
      <div className={cn("flex flex-col items-center gap-5 px-5 pb-5 sm:flex-row sm:items-center", TIER[lp.next.tier].color)}>
        <Ring progress={lp.progress}>
          <div>
            <p dir="ltr" className="text-[34px] leading-[38px] font-bold tabular-nums">
              {formatRateBps(nextRate)}
            </p>
            <p className="text-[12px] text-muted-foreground">عمولة عميلك الجاي</p>
            {promoWins && <p className="text-[11px] font-semibold text-foreground/70">{promo.name}</p>}
          </div>
        </Ring>

        <div className="w-full min-w-0 flex-1 space-y-3">
          <div>
            {promoWins ? (
              // While the offer pays more, say what's true now; the ladder below is what follows it.
              <>
                <p className="text-[17px] leading-[22px] font-semibold">
                  دلوقتي أي عميل جديد بـ <span dir="ltr">{formatRateBps(promo.rateBps)}</span> أو أكتر
                </p>
                <p className="text-[13px] text-muted-foreground">
                  من {promo.name}. بعده بترجع للمستويات:{" "}
                  {lp.unlock
                    ? `فاضلك ${fmtNum(lp.unlock.remaining)} ${lp.unlock.remaining === 1 ? "عميل مؤهل" : "عملاء مؤهلين"} للمستوى الجاي`
                    : "إنت في أعلى مستوى"}
                </p>
              </>
            ) : lp.unlock ? (
              <>
                <p className="text-[17px] leading-[22px] font-semibold">
                  فاضلك {fmtNum(lp.unlock.remaining)} {lp.unlock.remaining === 1 ? "عميل مؤهل" : "عملاء مؤهلين"}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  وبعدها كل عميل جديد بـ <span dir="ltr">{formatRateBps(lp.unlock.rateBps)}</span> — {TIER[lp.unlock.tier].number}
                </p>
              </>
            ) : (
              <>
                <p className="text-[17px] leading-[22px] font-semibold">إنت في أعلى مستوى</p>
                <p className="text-[13px] text-muted-foreground">كل عميل جديد بأعلى نسبة — حافظ على عملائك مؤهلين</p>
              </>
            )}
          </div>

          <ol className="space-y-1">
            {TIER_ORDER.map((tier) => {
              const here = tier === lp.next.tier;
              return (
                <li
                  key={tier}
                  aria-current={here ? "step" : undefined}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-2", TIER[tier].color, here && "bg-(--fill-3)")}
                >
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-(--tier)" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[15px]", here && "font-semibold")}>
                      {TIER[tier].number}
                      {here && <span className="ms-1.5 text-[12px] font-normal text-muted-foreground">إنت هنا</span>}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {ranges[tier]} · {fmtNum(allocation[tier])} عندك
                    </p>
                  </div>
                  <span dir="ltr" className="text-[15px] font-semibold tabular-nums">
                    {formatRateBps(rates[tier])}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {cohorts.length > 0 && (
        <ul className="border-t-[0.5px] border-border px-5 py-3">
          {cohorts.map((c) => (
            <li key={c.cohortMonth} className="flex items-start gap-2.5 py-1 text-[13px] text-muted-foreground">
              <CalendarClock className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
              <span>
                <span className="font-semibold text-foreground tabular-nums">{fmtNum(c.count)}</span>{" "}
                {c.count === 1 ? "عميل بيخرج" : "عملاء بيخرجوا"} من العدد المؤهل بعد {fmtEligibleThrough(c.eligibleUntil)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ── 6 months of commissions: Screen Time–style bars ──────────────────────── */

export function TrendCard({ trend }: { trend: RepMonthlyTrend }) {
  const total = trend.reduce((s, t) => s + t.commissions, 0);
  const average = total / trend.length;

  return (
    <Card title={`آخر ${fmtNum(trend.length)} شهور`} subtitle="عمولاتك حسب شهر دفع العميل">
      <div className="px-5 pb-5">
        <p className="text-[28px] leading-[34px] font-bold tabular-nums">{fmtMoney(total)}</p>
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

export function FunnelCard({ summary }: { summary: SalesSummary }) {
  const base = Math.max(summary.signups, 1);
  const stages = [
    { label: "سجّلوا من رابطك", value: summary.signups, fill: "bg-primary/35", note: null },
    {
      label: "دفعوا أول اشتراك",
      value: summary.acquired,
      fill: "bg-primary/65",
      note: `${fmtPct(summary.conversionRate)} من التسجيلات دفعوا`,
    },
    {
      label: "مؤهلين دلوقتي",
      value: summary.eligible,
      fill: "bg-primary",
      note: summary.expired > 0 ? `${fmtNum(summary.expired)} خلصت أهليتهم (${fmtNum(summary.rule.eligibilityMonths)} شهور)` : null,
    },
  ];

  return (
    <Card title="رحلة عملائك" subtitle="من أول تسجيل لحد الدفع — من أول يوم">
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

/* ── Follow-ups: signed up, not paid — the calls worth making today ──────── */

function trialLine(row: FollowUp, now: Date) {
  const store = row.customer.stores[0];
  if (!store) return { tone: "neutral" as const, text: "لسه معملش متجر" };
  if (!row.trialEndDate) return { tone: "neutral" as const, text: "مبدأش تجربة" };
  const msLeft = row.trialEndDate.getTime() - now.getTime();
  if (msLeft <= 0) return { tone: "danger" as const, text: "التجربة خلصت ومدفعش" };
  return { tone: msLeft < 36 * 3_600_000 ? ("warning" as const) : ("info" as const), text: `التجربة بتخلص ${fmtRelativeDays(row.trialEndDate, now)}` };
}

export function FollowUpsCard({ rows, total, repName }: { rows: FollowUp[]; total: number; repName: string }) {
  const now = new Date();
  return (
    <Card
      title="محتاجين متابعة"
      subtitle="سجّلوا ومدفعوش — الأولوية للي تجربتهم قربت تخلص"
      action={
        total > rows.length && (
          <Link href="/sales/customers?state=signup" className={appleButton.plain}>
            الكل {fmtNum(total)}
            <ChevronLeft className="size-4" strokeWidth={2.2} />
          </Link>
        )
      }
    >
      {rows.length === 0 ? (
        <Unavailable
          icon={PartyPopper}
          title="مفيش حد مستني متابعة"
          description="كل اللي سجّلوا من رابطك دفعوا. ابعت الرابط لتجار جداد."
          className="py-10"
        />
      ) : (
        <ul className="apple-rows pb-2 [--row-inset:72px]">
          {rows.map((row) => {
            const store = row.customer.stores[0];
            const title = store?.name ?? row.customer.name ?? row.customer.email;
            const line = trialLine(row, now);
            const firstName = row.customer.name?.trim().split(/\s+/)[0];
            const message = `أهلًا${firstName ? ` ${firstName}` : ""}، معاك ${repName} من كاشو. حبيت أطمن عليك${store ? ` وعلى متجر ${store.name}` : ""} — لو محتاج أي مساعدة في التفعيل أو الباقات أنا موجود.`;
            return (
              <li key={row.id} className="relative flex items-center gap-3 px-5 py-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#8e8e93] text-[15px] font-semibold text-white"
                >
                  {initialOf(title)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/sales/customers/${row.customer.id}`}
                    className="block truncate text-[15px] font-semibold after:absolute after:inset-0 hover:underline"
                  >
                    {title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
                    <StatusText tone={line.tone} className="text-[13px]">
                      {line.text}
                    </StatusText>
                    <span>· سجّل {fmtRelativeDays(row.signedUpAt, now)}</span>
                  </div>
                </div>
                {row.customer.phone_number ? (
                  <a
                    href={whatsappLink(row.customer.phone_number, message)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`كلّم ${title} على واتساب`}
                    className="apple-press relative z-10 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-(--sys-green)/12 px-3.5 text-[14px] font-semibold text-[#248a3d] hover:bg-(--sys-green)/18 dark:text-(--sys-green)"
                  >
                    <MessageCircle className="size-4" />
                    <span className="hidden sm:inline">واتساب</span>
                  </a>
                ) : (
                  <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--label-3)" strokeWidth={2.2} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
