"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "../_i18n/LanguageContext";
import { planNameLabel, featureNameLabel } from "./pricing-labels";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const rise = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay, ease: EASE },
  }),
};

const TRUST_ICONS = [Clock, RefreshCw, ShieldCheck];

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

function formatPiasters(value: number) {
  return (value / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function PricingSection({ plans }: { plans: WelcomePlan[] }) {
  const { t, lang } = useLang();
  const pr = t.pricing;
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  if (plans.length === 0) return null;

  return (
    <section id="pricing" className="relative isolate scroll-mt-28 overflow-hidden rounded-xl py-16 sm:py-20 lg:py-24">
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center"
        >
          <motion.span
            variants={rise}
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur sm:text-sm"
          >
            <Sparkles className="size-3.5 text-primary" />
            {pr.badge}
          </motion.span>

          <motion.h2
            variants={rise}
            custom={0.1}
            style={{ fontFamily: "var(--font-cairo), var(--font-sans), sans-serif" }}
            className="text-balance text-3xl font-black leading-[1.3] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
          >
            {pr.title}{" "}
            <span className="relative inline-block bg-linear-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent rtl:bg-linear-to-l">
              {pr.titleAccent}
            </span>
          </motion.h2>

          <motion.p
            variants={rise}
            custom={0.2}
            className="text-pretty text-[15px] leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            {pr.subtitle}
          </motion.p>

          <motion.div variants={rise} custom={0.3} className="mt-2 inline-flex rounded-full border border-border bg-muted/40 p-1">
            {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  billingCycle === cycle ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {cycle === "MONTHLY" ? pr.monthly : pr.yearly}
              </button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="relative mx-auto mt-12 sm:mt-16"
        >
          <div className="absolute -inset-4 -z-10 hidden rounded-[2rem] bg-primary/10 blur-3xl sm:block" />

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => {
              const price = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
              const highlighted = plan.key === "GOLD";

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-lg sm:p-8",
                    highlighted ? "border-primary shadow-primary/15 ring-1 ring-primary/20" : "border-border shadow-primary/5",
                  )}
                >
                  {highlighted && (
                    <span className="absolute -top-px right-6 rounded-b-md bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                      {pr.mostPopular}
                    </span>
                  )}

                  <h3 className="text-lg font-extrabold text-foreground">{planNameLabel(plan.key, plan.name, lang)}</h3>

                  <div className="mt-4 flex items-end gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-foreground">{formatPiasters(price)}</span>
                    <div className="mb-1.5 text-sm leading-4 text-muted-foreground">
                      <div>{pr.currency}</div>
                      <div>/ {billingCycle === "YEARLY" ? pr.yearly : pr.monthly}</div>
                    </div>
                  </div>
                  {plan.discountPercent ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      -{plan.discountPercent}%
                    </p>
                  ) : null}

                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "group mt-6 h-11 w-full rounded-xl text-sm font-bold",
                      highlighted && "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35",
                    )}
                    variant={highlighted ? "default" : "outline"}
                  >
                    <Link href="/register">
                      {pr.startNow}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  </Button>

                  <div className="mt-6 flex-1 space-y-2.5 border-t border-border pt-6">
                    {plan.features.map((feature) => (
                      <div key={feature.key} className="flex items-center gap-2.5">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <p className="text-sm text-foreground/90">
                          {featureNameLabel(feature.key, feature.name, lang)}
                          {feature.isUnlimited ? ` — ${pr.currentFeatures}` : ""}
                          {!feature.isUnlimited && feature.limitValue !== null
                            ? ` — ${feature.limitValue.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}${feature.unit ? ` ${feature.unit}` : ""}`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">{pr.footnote}</p>

          {/* Trust bar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {pr.trust.map((item, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <div key={item} className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-3.5" />
                  </span>
                  {item}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
