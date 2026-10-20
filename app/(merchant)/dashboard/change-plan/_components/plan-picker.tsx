"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { PlanChangeDialog } from "./plan-change-dialog";
import { featureValueLabel, priceOf, yearlySaving, type Cycle, type PlanForUI } from "./plan-types";
import { TierGlyph } from "./tier-glyph";
import { tr } from "@/lib/i18n/dashboard";

type Props = {
  plans: PlanForUI[];
  currentPlanId: string | null;
  currentCycle: Cycle;
  recommendedPlanId: string | null;
  recommendReason: string | null;
  inTrial: boolean;
  /** Trial or paid period running — otherwise the current plan can be (re)activated. */
  covered: boolean;
};

export function PlanPicker({ plans, currentPlanId, currentCycle, recommendedPlanId, recommendReason, inTrial, covered }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cycleParam = searchParams.get("cycle");
  const cycle: Cycle = cycleParam === "yearly" ? "YEARLY" : cycleParam === "monthly" ? "MONTHLY" : currentCycle;
  const selected = plans.find((p) => p.slug === searchParams.get("plan")) ?? null;
  const currentPlan = plans.find((p) => p.id === currentPlanId) ?? null;

  function setParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const bestSaving = Math.max(0, ...plans.map((p) => Math.round((yearlySaving(p) / (p.monthlyPrice * 12 || 1)) * 100)));

  return (
    <section aria-labelledby="plans-title" className="space-y-8 pt-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="space-y-2">
          <h2 id="plans-title" className="text-[28px] leading-[34px] font-bold sm:text-[40px] sm:leading-[46px] ltr:tracking-[-0.02em]">
            {tr("غيّر باقتك")}
          </h2>
          <p className="mx-auto max-w-xl text-[17px] leading-[25px] text-muted-foreground">
            {inTrial ? tr("اختار براحتك — مفيش خصم لحد ما التجربة تخلص.") : tr("هتشوف المبلغ بالظبط قبل ما تأكد. الأيام اللي فاضلة من باقتك بتتحسبلك.")}
          </p>
        </div>
        <SegmentedButtons
          label={tr("دورة الدفع")}
          value={cycle}
          onChange={(c) => setParams({ cycle: c === "YEARLY" ? "yearly" : "monthly" })}
          className="[&_button]:h-8 [&_button]:px-4"
          options={[
            ["MONTHLY", tr("شهري")],
            [
              "YEARLY",
              <>
                {tr("سنوي")}
                {bestSaving > 0 && <span className="text-[12px] font-semibold text-(--sys-green)">{tr("وفّر لحد {0}٪", bestSaving)}</span>}
              </>,
            ],
          ]}
        />
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = covered && plan.id === currentPlanId && cycle === currentCycle;
          const isCurrentPlan = plan.id === currentPlanId;
          const recommended = plan.id === recommendedPlanId;
          const price = priceOf(plan, cycle);
          const original = cycle === "YEARLY" ? plan.originalYearlyPrice : plan.originalMonthlyPrice;
          const saving = cycle === "YEARLY" ? yearlySaving(plan) : 0;
          const up = !currentPlan || plan.sortOrder > currentPlan.sortOrder;
          const cta = isCurrent
            ? tr("باقتك الحالية")
            : !covered
              ? tr("فعّل {0}", plan.name)
              : isCurrentPlan
              ? tr("حوّل لل{0}", cycle === "YEARLY" ? tr("سنوي") : tr("شهري"))
              : inTrial
                ? tr("اختار {0}", plan.name)
                : up
                  ? tr("رقّي لـ {0}", plan.name)
                  : tr("انزل لـ {0}", plan.name);

          return (
            <article
              key={plan.id}
              aria-current={isCurrentPlan ? "true" : undefined}
              className={cn(
                "apple-card relative flex flex-col p-6 transition-shadow duration-300 ease-(--ease-apple) lg:p-7",
                recommended && "ring-2 ring-primary",
              )}
            >
              <p className={cn("h-5 text-[13px] font-semibold", recommended ? "text-(--sys-orange)" : "text-muted-foreground")}>
                {recommended ? (recommendReason ? tr("مقترحة ليك") : tr("الأكثر اختيارًا")) : isCurrentPlan ? tr("باقتك") : ""}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <TierGlyph tier={plan.key} />
                <h3 className="text-[24px] leading-[30px] font-bold ltr:tracking-[-0.01em]">{plan.name}</h3>
              </div>
              <p className="mt-3 line-clamp-2 min-h-[42px] text-[15px] leading-[21px] text-muted-foreground">{plan.description}</p>

              <div className="mt-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[40px] leading-none font-bold tabular-nums ltr:tracking-[-0.025em]">{formatMoney(price)}</span>
                  <span className="text-[15px] text-muted-foreground">/ {cycle === "YEARLY" ? tr("سنة") : tr("شهر")}</span>
                </div>
                <p className="mt-2 h-5 text-[13px] text-muted-foreground">
                  {cycle === "YEARLY" ? (
                    saving > 0 ? (
                      <>
                        {tr("يعني {0} في الشهر ·", formatMoney(Math.round(price / 12)))}{" "}
                        <span className="font-semibold text-(--sys-green)">{tr("بتوفّر {0}", formatMoney(saving))}</span>
                      </>
                    ) : (
                      <>{tr("يعني {0} في الشهر", formatMoney(Math.round(price / 12)))}</>
                    )
                  ) : original && original > price ? (
                    <>
                      {tr("بدل")}{" "}<span className="line-through">{formatMoney(original)}</span>
                    </>
                  ) : null}
                </p>
              </div>

              <button
                type="button"
                className={cn(
                  isCurrent ? appleButton.tinted : recommended ? appleButton.filled : cn(appleButton.tinted, "text-primary"),
                  "mt-6 h-11 w-full text-[15px]",
                  isCurrent && "text-muted-foreground",
                )}
                disabled={isCurrent}
                onClick={() => setParams({ plan: plan.slug, cycle: cycle === "YEARLY" ? "yearly" : "monthly" })}
              >
                {isCurrent && <Check className="size-4" strokeWidth={2.6} />}
                {cta}
              </button>

              {recommended && recommendReason && (
                <p className="mt-4 rounded-[12px] bg-primary/8 px-3.5 py-2.5 text-[13px] leading-[18px] text-foreground/85">{recommendReason}</p>
              )}

              <ul className="mt-6 flex-1 space-y-3 border-t-[0.5px] border-border pt-6">
                {plan.features
                  .filter((f) => f.enabled)
                  .map((feature) => {
                    const value = featureValueLabel(feature);
                    return (
                      <li key={feature.key} className="flex items-start gap-2.5 text-[15px] leading-5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.6} />
                        <span>
                          {feature.name}
                          {value && <span className="text-muted-foreground"> · {value}</span>}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </article>
          );
        })}
      </div>

      {selected && !(covered && selected.id === currentPlanId && cycle === currentCycle) && (
        <PlanChangeDialog
          plan={selected}
          cycle={cycle}
          currentPlan={currentPlan}
          currentCycle={currentCycle}
          onClose={() => setParams({ plan: null })}
        />
      )}
    </section>
  );
}
