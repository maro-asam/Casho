"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Gem, Minus, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { PlanChangeDialog } from "./plan-change-dialog";
import { featureValueLabel, priceOf, yearlySaving, type Cycle, type PlanForUI } from "./plan-types";
import { tr } from "@/lib/i18n/dashboard";

const TIER_ICON: Record<string, typeof Sparkles> = { SILVER: ShieldCheck, GOLD: Sparkles, PLATINUM: Gem };

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{tr("غيّر باقتك")}</h2>
          <p className="text-sm text-muted-foreground">
            {inTrial ? tr("اختار براحتك — مفيش خصم لحد ما التجربة تخلص.") : tr("هتشوف المبلغ بالظبط قبل ما تأكد. الأيام اللي فاضلة من باقتك بتتحسبلك.")}
          </p>
        </div>
        <div role="radiogroup" aria-label={tr("دورة الدفع")} className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          {(["MONTHLY", "YEARLY"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setParams({ cycle: c === "YEARLY" ? "yearly" : "monthly" })}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                cycle === c ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "MONTHLY" ? tr("شهري") : tr("سنوي")}
              {c === "YEARLY" && bestSaving > 0 && (
                <span className="rounded bg-emerald-500/10 px-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {tr("وفّر لحد {0}٪", bestSaving)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = covered && plan.id === currentPlanId && cycle === currentCycle;
          const isCurrentPlan = plan.id === currentPlanId;
          const recommended = plan.id === recommendedPlanId;
          const price = priceOf(plan, cycle);
          const original = cycle === "YEARLY" ? plan.originalYearlyPrice : plan.originalMonthlyPrice;
          const saving = cycle === "YEARLY" ? yearlySaving(plan) : 0;
          const Icon = TIER_ICON[plan.key] ?? ShieldCheck;
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
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-5 transition-shadow",
                recommended ? "border-primary/60 shadow-md shadow-primary/5 ring-1 ring-primary/20" : "border-border",
                isCurrentPlan && !recommended && "bg-muted/20",
              )}
            >
              {(recommended || isCurrentPlan) && (
                <span
                  className={cn(
                    "absolute -top-2.5 start-4 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    recommended ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground",
                  )}
                >
                  {recommended ? (recommendReason ? tr("مقترحة ليك") : tr("الأكثر اختيارًا")) : tr("باقتك")}
                </span>
              )}

              <div className="flex items-center gap-2.5">
                <span className={cn("grid size-9 place-items-center rounded-lg", recommended ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>
                  <Icon className="size-4" />
                </span>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
              </div>
              {plan.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>}

              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">{formatMoney(price)}</span>
                  <span className="text-sm text-muted-foreground">/ {cycle === "YEARLY" ? tr("سنة") : tr("شهر")}</span>
                </div>
                <p className="mt-1 h-5 text-xs text-muted-foreground">
                  {cycle === "YEARLY" ? (
                    saving > 0 ? (
                      <>
                        {tr("يعني {0} في الشهر ·", formatMoney(Math.round(price / 12)))}{" "}
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">{tr("بتوفّر {0}", formatMoney(saving))}</span>
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

              {recommended && recommendReason && (
                <p className="mt-3 rounded-md bg-primary/5 px-2.5 py-1.5 text-xs leading-5 text-primary">{recommendReason}</p>
              )}

              <ul className="mt-4 flex-1 space-y-2.5 border-t border-border pt-4">
                {plan.features.map((feature) => {
                  const value = featureValueLabel(feature);
                  return (
                    <li key={feature.key} className="flex items-start gap-2.5 text-sm">
                      {feature.enabled ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      ) : (
                        <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={cn("leading-5", !feature.enabled && "text-muted-foreground/70")}>
                        {feature.name}
                        {value && <span className="text-muted-foreground"> · {value}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Button
                className="mt-5 w-full gap-1.5"
                variant={isCurrent ? "outline" : recommended ? "default" : "outline"}
                disabled={isCurrent}
                onClick={() => setParams({ plan: plan.slug, cycle: cycle === "YEARLY" ? "yearly" : "monthly" })}
              >
                {cta}
                {!isCurrent && <ArrowLeft className="size-4 ltr:-scale-x-100" />}
              </Button>
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
    </div>
  );
}
