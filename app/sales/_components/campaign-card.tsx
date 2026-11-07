import { Check, Gift, Sparkles } from "lucide-react";
import { campaignDaysLeft, isWithinCampaign } from "@/lib/sales/campaign";
import type { RepCampaign } from "@/lib/sales/campaign-queries";
import { fmtDayMonth, fmtMoney, fmtNum, fmtPounds } from "@/lib/sales/format";
import { formatRateBps } from "@/lib/sales/rules";
import { cn } from "@/lib/utils";

/**
 * The launch offer, as a dark promo tile: what it pays, until when, and how far
 * the rep is from the bonus. Always the same dark surface in both appearances.
 */
export function CampaignCard({
  campaign: c,
  renewalRateBps,
  now = new Date(),
}: {
  campaign: RepCampaign;
  /** The normal renewal rate — the offer only covers a new customer's first payment. */
  renewalRateBps: number;
  now?: Date;
}) {
  const running = isWithinCampaign(c, now);
  const lastDay = fmtDayMonth(new Date(c.endsAt.getTime() - 1));
  const daysLeft = campaignDaysLeft(c, now);
  const target = c.bonusTarget;
  const done = Math.min(c.acquiredInWindow, target);
  const awarded = c.bonusAwardedAt !== null;
  const remaining = Math.max(0, target - c.acquiredInWindow);

  const rates = [
    { rate: c.baseRateBps, label: "أي عميل جديد يشترك" },
    { rate: c.pharmacyRateBps, label: "لو العميل صيدلية" },
    { rate: c.posRateBps, label: "باقة بلاتينيوم (الكاشير)" },
  ];

  return (
    <section
      aria-labelledby="campaign-title"
      className="relative isolate overflow-hidden rounded-[22px] bg-[#0b0b10] px-5 py-6 text-white sm:px-7 sm:py-7 dark:ring-1 dark:ring-white/10"
    >
      {/* Light from behind — the offer's only decoration. */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -end-20 -z-10 size-96 rounded-full bg-[#1447e6]/50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-36 -start-16 -z-10 size-80 rounded-full bg-[#a855f7]/30 blur-3xl" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/70">
            <Sparkles className="size-4" strokeWidth={2} />
            {c.name} · لأول {fmtNum(c.maxMembers)} مندوبين بس
          </p>
          <h2 id="campaign-title" className="text-[28px] leading-[1.25] font-bold sm:text-[34px]">
            عمولة أعلى على كل عميل جديد
            <span className="block text-white/60">لحد {lastDay}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex h-8 items-center rounded-full bg-white/12 px-3.5 text-[13px] font-semibold tabular-nums">
              {running ? (daysLeft === 1 ? "آخر يوم النهارده" : `فاضل ${fmtNum(daysLeft)} يوم`) : `بيبدأ ${fmtDayMonth(c.startsAt)}`}
            </span>
            <span className="text-[13px] text-white/55">على أول اشتراك للعميل · التجديد <span dir="ltr">{formatRateBps(renewalRateBps)}</span> زي العادي</span>
          </div>
        </div>

        <ul className="grid grid-cols-3 gap-2 lg:w-[27rem]">
          {rates.map((r) => (
            <li key={r.label} className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10 ring-inset">
              <p dir="ltr" className="text-right text-[28px] leading-none font-bold tabular-nums sm:text-[32px]">
                {formatRateBps(r.rate)}
              </p>
              <p className="mt-2 text-[12px] leading-4 text-white/70 sm:text-[13px]">{r.label}</p>
            </li>
          ))}
        </ul>
      </div>

      {target > 0 && (
        <div className="mt-7 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              <Gift className="size-[18px] text-[#ffd60a]" strokeWidth={2} />
              بونص {fmtPounds(c.bonusAmount)} لما {fmtNum(target)} عملاء يدفعوا
            </p>
            <p className="text-[13px] text-white/60 tabular-nums">
              {fmtNum(done)} من {fmtNum(target)}
            </p>
          </div>

          {/* One segment per customer — progress you can count. */}
          <ol aria-label={`${fmtNum(done)} من ${fmtNum(target)} عملاء`} className="mt-3 flex h-2 gap-1.5">
            {Array.from({ length: Math.min(target, 30) }, (_, i) => (
              <li
                key={i}
                className={cn(
                  "flex-1 rounded-full",
                  i < Math.round((done / target) * Math.min(target, 30)) ? (awarded ? "bg-[#30d158]" : "bg-white") : "bg-white/15",
                )}
              />
            ))}
          </ol>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
            {awarded ? (
              <p className="inline-flex items-center gap-1.5 font-semibold text-[#30d158]">
                <Check className="size-4" strokeWidth={2.6} />
                البونص اتضاف لفلوسك
              </p>
            ) : (
              <p className="text-white/70">
                {running
                  ? remaining === 1
                    ? "فاضلك عميل واحد وتاخد البونص"
                    : `فاضلك ${fmtNum(remaining)} عملاء وتاخد البونص`
                  : "العدّ بيبدأ مع أول يوم في العرض"}
              </p>
            )}
            {c.campaignEarned > 0 && <p className="text-white/60">كسبت من العرض لحد دلوقتي {fmtMoney(c.campaignEarned)}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
