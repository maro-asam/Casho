"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock, CreditCard, Gem, RefreshCw, ShieldCheck, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";
import { planNameLabel, featureNameLabel } from "./pricing-labels";

export type WelcomePlanFeature = {
  key: string;
  name: string;
  unit: string | null;
  isUnlimited: boolean;
  limitValue: number | null;
};

export type WelcomePlan = {
  id: string;
  key: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthlyPrice: number | null;
  discountPercent: number | null;
  sortOrder: number;
  features: WelcomePlanFeature[];
};

type BillingCycle = "MONTHLY" | "YEARLY";

const PLAN_ICONS: Record<string, typeof ShieldCheck> = {
  SILVER: ShieldCheck,
  GOLD: Sparkles,
  PLATINUM: Gem,
};

const TRUST_ICONS = [Clock, RefreshCw, CreditCard];

const HIGHLIGHTED_PLAN = "GOLD";

function formatPiasters(value: number) {
  return (value / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function yearlySavingsPercent(plan: WelcomePlan) {
  const fullYear = plan.monthlyPrice * 12;
  if (fullYear <= 0 || plan.yearlyPrice >= fullYear) return 0;
  return Math.round((1 - plan.yearlyPrice / fullYear) * 100);
}

export default function PricingSection({ plans }: { plans: WelcomePlan[] }) {
  const { t } = useLang();
  const pr = t.pricing;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");

  if (plans.length === 0) return null;

  const maxSavings = Math.max(...plans.map(yearlySavingsPercent));

  return (
    <section id="pricing" className="scroll-mt-28 py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <FadeIn className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Tag className="size-4" />
            {pr.badge}
          </span>

          <h2 className="mt-5 text-balance text-3xl font-normal leading-tight tracking-tight text-foreground md:text-4xl">
            {pr.title} <span className="font-extrabold text-primary">{pr.titleAccent}</span>
          </h2>

          <p className="mt-5 text-pretty text-base leading-8 text-muted-foreground md:text-lg">{pr.subtitle}</p>

          <BillingToggle
            value={billingCycle}
            onChange={setBillingCycle}
            savings={maxSavings}
            className="mt-8"
          />
        </FadeIn>

        <FadeIn delay={80} className="mt-12 md:mt-14">
          <div className="mx-auto grid max-w-md items-stretch gap-6 md:max-w-none md:grid-cols-3 md:gap-5 lg:gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} billingCycle={billingCycle} />
            ))}
          </div>
        </FadeIn>

        <div className="mt-10 flex flex-col items-center gap-4">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {pr.trust.map((item, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Icon className="size-4 text-primary" />
                  {item}
                </li>
              );
            })}
          </ul>
          <p className="max-w-xl text-center text-xs leading-5 text-muted-foreground">{pr.footnote}</p>
        </div>
      </div>
    </section>
  );
}

function BillingToggle({
  value,
  onChange,
  savings,
  className,
}: {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  savings: number;
  className?: string;
}) {
  const { t } = useLang();
  const pr = t.pricing;

  return (
    <div
      role="group"
      aria-label={pr.billingLabel}
      className={cn("inline-flex items-center rounded-xl border border-border bg-muted/50 p-1", className)}
    >
      {(["MONTHLY", "YEARLY"] as const).map((cycle) => {
        const active = value === cycle;
        return (
          <button
            key={cycle}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(cycle)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {cycle === "MONTHLY" ? pr.monthly : pr.yearly}
            {cycle === "YEARLY" && savings > 0 ? (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                {pr.save} {savings}%
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({ plan, billingCycle }: { plan: WelcomePlan; billingCycle: BillingCycle }) {
  const { t, lang } = useLang();
  const pr = t.pricing;

  const highlighted = plan.key === HIGHLIGHTED_PLAN;
  const Icon = PLAN_ICONS[plan.key] ?? ShieldCheck;
  const isYearly = billingCycle === "YEARLY";
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const original = isYearly ? null : plan.originalMonthlyPrice;
  const hasDiscount = original !== null && original > price;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-xl border bg-card p-6 transition-colors sm:p-7",
        highlighted
          ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary"
          : "border-border hover:border-foreground/20",
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 inset-s-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          <Sparkles className="size-3.5" />
          {pr.mostPopular}
        </span>
      )}

      <header className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            highlighted ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
        <h3 className="text-lg font-bold text-foreground">{planNameLabel(plan.key, plan.name, lang)}</h3>
      </header>

      <div className="mt-6 min-h-24">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
            {formatPiasters(price)}
          </span>
          <span className="text-sm text-muted-foreground">
            {pr.currency} / {isYearly ? pr.yearly : pr.monthly}
          </span>
        </div>

        <div className="mt-2 flex min-h-6 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {isYearly ? (
            <span>{pr.perMonthEquivalent.replace("{amount}", formatPiasters(Math.round(price / 12)))}</span>
          ) : hasDiscount && original !== null ? (
            <>
              <span className="line-through tabular-nums">
                {formatPiasters(original)} {pr.currency}
              </span>
              {plan.discountPercent ? (
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  -{plan.discountPercent}%
                </span>
              ) : null}
            </>
          ) : (
            <span>{pr.billedMonthly}</span>
          )}
        </div>
      </div>

      <Button
        asChild
        size="lg"
        variant={highlighted ? "default" : "outline"}
        className="group mt-6 h-11 w-full rounded-lg text-sm font-semibold"
      >
        <Link href="/register">
          {pr.startNow}
          <ArrowRight className="size-4 transition-transform rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 motion-safe:rtl:group-hover:-translate-x-0.5" />
        </Link>
      </Button>

      <div className="mt-7 flex-1 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{pr.whatsIncluded}</p>
        <ul className="mt-4 space-y-3">
          {plan.features.map((feature) => (
            <FeatureRow key={feature.key} feature={feature} />
          ))}
        </ul>
      </div>
    </article>
  );
}

function FeatureRow({ feature }: { feature: WelcomePlanFeature }) {
  const { t, lang } = useLang();
  const pr = t.pricing;

  let value: string | null = null;
  if (feature.isUnlimited) {
    value = pr.currentFeatures;
  } else if (feature.limitValue !== null) {
    const n = feature.limitValue.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
    value = feature.unit ? `${n} ${feature.unit}` : n;
  }

  return (
    <li className="flex items-start gap-3 text-sm">
      <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
      <span className="flex-1 text-foreground/90">{featureNameLabel(feature.key, feature.name, lang)}</span>
      {value ? <span className="shrink-0 font-medium text-foreground tabular-nums">{value}</span> : null}
    </li>
  );
}
