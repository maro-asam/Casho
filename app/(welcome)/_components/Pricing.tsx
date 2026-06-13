"use client";

import { Check, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { plans as plansPrices } from "@/constants/welcome/pricing.constants";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";

const planAccents = [
  { gradient: "from-sky-500 to-primary", iconBg: "bg-sky-500/15 text-sky-600" },
];

export default function PricingSection() {
  const { t } = useLang();
  const pr = t.pricing;

  const plans = pr.plans.map((p, i) => ({
    ...p,
    price: plansPrices[i].price,
    highlighted: plansPrices[i].highlighted,
    locked: plansPrices[i].locked,
    badge:
      "badge" in plansPrices[i]
        ? (plansPrices[i] as { badge?: string }).badge
        : undefined,
    accent: planAccents[i],
  }));

  return (
    <section id="pricing" className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            {pr.badge}
          </span>

          <h2 className="mt-5 text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            {pr.title}
            <span className="mt-2 block font-semibold bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              {pr.titleAccent}
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            {pr.subtitle}
          </p>
        </FadeIn>

        <div className="mt-14 flex justify-center">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 80} className="relative w-full max-w-sm">
              <div
                className={[
                  "relative h-full rounded-2xl border-2 bg-card transition-all duration-200",
                  plan.highlighted
                    ? "border-primary/30 shadow-xl shadow-primary/10"
                    : "border-border",
                ].join(" ")}
              >
                {/* Recommended badge */}
                {plan.highlighted && plan.badge && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full bg-linear-to-l ${plan.accent.gradient} px-3 py-1 text-xs font-semibold text-white shadow-sm`}
                    >
                      <Zap className="size-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 md:p-7">
                  {/* Plan name */}
                  <div className="mb-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      باقة
                    </p>
                    <h3 className="mt-0.5 text-xl font-bold text-foreground">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 flex items-end gap-1.5">
                    <span
                      className={[
                        "text-5xl font-extrabold leading-none tracking-tight",
                        plan.highlighted
                          ? `bg-linear-to-l ${plan.accent.gradient} bg-clip-text text-transparent`
                          : "text-foreground",
                      ].join(" ")}
                    >
                      {plan.price}
                    </span>
                    <span className="mb-1.5 text-sm text-muted-foreground">
                      {pr.currency} {plan.period}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="mb-5 h-px bg-border" />

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <span
                          className={[
                            "flex size-5 shrink-0 items-center justify-center rounded-full",
                            plan.highlighted
                              ? `bg-linear-to-br ${plan.accent.gradient} text-white`
                              : "bg-emerald-500/10 text-emerald-600",
                          ].join(" ")}
                        >
                          <Check className="size-3" />
                        </span>
                        <p className="text-sm leading-5 text-foreground/90">
                          {feature}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    size="lg"
                    variant={plan.highlighted ? "default" : "outline"}
                    className="mt-7 h-11 w-full rounded-xl text-sm font-semibold"
                  >
                    <Link href="/register">{pr.startNow}</Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={80} className="mt-8 text-center">
          <p className="text-sm leading-7 text-muted-foreground">
            {pr.footnote}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
