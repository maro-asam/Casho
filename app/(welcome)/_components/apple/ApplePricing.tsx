"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { featureNameLabel, planNameLabel } from "../pricing-labels";
import type { WelcomePlan, WelcomePlanFeature } from "../Pricing";
import { useLandingCopy } from "./copy";
import Reveal from "./Reveal";

type Cycle = "MONTHLY" | "YEARLY";

const HIGHLIGHTED_PLAN = "GOLD";
const COLLAPSED_FEATURES = 5;

function formatPiasters(value: number) {
  return (value / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function yearlySavingsPercent(plan: WelcomePlan) {
  const fullYear = plan.monthlyPrice * 12;
  if (fullYear <= 0 || plan.yearlyPrice >= fullYear) return 0;
  return Math.round((1 - plan.yearlyPrice / fullYear) * 100);
}

export default function ApplePricing({ plans }: { plans: WelcomePlan[] }) {
  const c = useLandingCopy().pricing;
  const [cycle, setCycle] = useState<Cycle>("MONTHLY");

  if (plans.length === 0) return null;
  const maxSavings = Math.max(...plans.map(yearlySavingsPercent));

  return (
    <section id="pricing" className="al-section al-section-surface scroll-mt-16">
      <div className="al-container-wide">
        <Reveal className="mx-auto max-w-[700px] text-center">
          <p className="al-eyebrow">{c.eyebrow}</p>
          <h2 className="al-section-title mt-3">{c.title}</h2>
          <p className="al-subhead mt-5 text-pretty">{c.subtitle}</p>

          <div
            role="radiogroup"
            aria-label={c.eyebrow}
            className="mt-9 inline-flex rounded-full bg-black/[0.06] p-1 dark:bg-white/10"
          >
            {(["MONTHLY", "YEARLY"] as const).map((value) => {
              const active = cycle === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCycle(value)}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-2 rounded-full px-5 text-[15px] transition-[background-color,color,box-shadow] duration-200",
                    active
                      ? "bg-(--al-card) font-semibold text-(--al-text) shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                      : "font-medium text-(--al-muted) hover:text-(--al-text)",
                  )}
                >
                  {value === "MONTHLY" ? c.monthly : c.yearly}
                  {value === "YEARLY" && maxSavings > 0 ? (
                    <span className="text-[12px] font-semibold text-(--al-new)">
                      {c.save} {maxSavings}%
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-md gap-5 md:mt-16 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 80} className="h-full">
              <PlanCard plan={plan} cycle={cycle} />
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-[13px] text-(--al-faint)">{c.footnote}</p>
      </div>
    </section>
  );
}

function PlanCard({ plan, cycle }: { plan: WelcomePlan; cycle: Cycle }) {
  const c = useLandingCopy().pricing;
  const { lang } = useLang();
  const highlighted = plan.key === HIGHLIGHTED_PLAN;
  const yearly = cycle === "YEARLY";
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const original = yearly ? null : plan.originalMonthlyPrice;
  const hasDiscount = original !== null && original > price;
  // Long feature lists collapse below lg so stacked cards stay scannable.
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, plan.features.length - COLLAPSED_FEATURES);

  return (
    <article
      className={cn(
        "al-card flex h-full flex-col p-8 md:p-9",
        highlighted && "ring-2 ring-(--al-tint)",
      )}
    >
      <p className="min-h-5 text-[13px] font-semibold text-(--al-new)">{highlighted ? c.popular : ""}</p>
      <h3 className="mt-1 text-[28px] font-bold">{planNameLabel(plan.key, plan.name, lang)}</h3>

      <div className="mt-6">
        <p className="flex items-baseline gap-2">
          <span className="text-[48px] font-bold leading-none tabular-nums">{formatPiasters(price)}</span>
          <span className="text-[15px] text-(--al-muted)">
            {c.currency} {yearly ? c.perYear : c.perMonth}
          </span>
        </p>
        <p className="mt-3 min-h-5 text-[13px] text-(--al-muted)">
          {yearly ? (
            c.perMonthEquivalent.replace("{amount}", formatPiasters(Math.round(price / 12)))
          ) : hasDiscount && original !== null ? (
            <>
              <span className="line-through tabular-nums">
                {formatPiasters(original)} {c.currency}
              </span>
              {plan.discountPercent ? (
                <span className="ms-2 font-semibold text-[#1a8a3e] dark:text-[#30d158]">-{plan.discountPercent}%</span>
              ) : null}
            </>
          ) : (
            c.billedMonthly
          )}
        </p>
      </div>

      <Link
        href="/register"
        className={cn("al-btn mt-8 w-full", highlighted ? "al-btn-filled" : "al-btn-gray")}
      >
        {c.cta}
      </Link>

      <div className="mt-8 flex-1 border-t border-(--al-hair) pt-6">
        <p className="text-[13px] font-semibold text-(--al-muted)">{c.included}</p>
        <ul className="mt-3">
          {plan.features.map((feature, i) => (
            <FeatureRow key={feature.key} feature={feature} hiddenOnSmall={!expanded && i >= COLLAPSED_FEATURES} />
          ))}
        </ul>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="al-link mt-2 min-h-11 text-[15px] lg:hidden"
          >
            {expanded ? c.showLess : c.showAll.replace("{count}", String(hiddenCount))}
          </button>
        )}
      </div>
    </article>
  );
}

function FeatureRow({ feature, hiddenOnSmall }: { feature: WelcomePlanFeature; hiddenOnSmall?: boolean }) {
  const c = useLandingCopy().pricing;
  const { lang } = useLang();

  let value: string | null = null;
  if (feature.isUnlimited) value = c.unlimited;
  else if (feature.limitValue !== null) {
    const n = feature.limitValue.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
    value = feature.unit ? `${n} ${feature.unit}` : n;
  }

  return (
    <li className={cn("flex items-start gap-3 border-b border-(--al-hair) py-3 text-[15px] last:border-0", hiddenOnSmall && "hidden lg:flex")}>
      <Check className="mt-1 size-4 shrink-0 text-(--al-muted)" strokeWidth={2.2} />
      <span className="flex-1">{featureNameLabel(feature.key, feature.name, lang)}</span>
      {value ? <span className="shrink-0 text-(--al-muted) tabular-nums">{value}</span> : null}
    </li>
  );
}
