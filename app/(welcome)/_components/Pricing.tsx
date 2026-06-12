"use client";

import { Check, Lock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { plans as plansPrices } from "@/constants/welcome/pricing.constants";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";

export default function PricingSection() {
  const { t } = useLang();
  const pr = t.pricing;

  const plans = pr.plans.map((p, i) => ({
    ...p,
    price: plansPrices[i].price,
    highlighted: plansPrices[i].highlighted,
    locked: plansPrices[i].locked,
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

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <FadeIn
              key={plan.name}
              delay={index * 80}
              className={[
                "relative rounded-xl border p-6 md:p-7 transition-all",
                plan.highlighted
                  ? "border-primary/25 bg-card shadow-xl shadow-primary/10"
                  : "border-border bg-card/70",
                plan.locked ? "opacity-55 blur-xs" : "",
              ].join(" ")}
            >
              {plan.highlighted && "badge" in plan && plan.badge ? (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-primary/20 bg-background px-4 py-1.5 text-xs font-medium text-primary shadow-sm">
                  {plan.badge}
                </span>
              ) : null}

              {plan.locked ? (
                <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                    <Lock className="size-3.5" />
                    {pr.soon}
                  </span>
                </div>
              ) : null}

              <div className={plan.locked ? "pointer-events-none select-none" : ""}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{plan.description}</p>

                  <div className="mt-6 flex items-end justify-center gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                      {plan.price}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">{pr.currency} {plan.period}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xl ${
                          plan.highlighted
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Check className="size-3.5" />
                      </div>
                      <p className="text-sm leading-7 text-foreground/90">{feature}</p>
                    </div>
                  ))}
                </div>

                <Button
                  asChild={!plan.locked}
                  size="lg"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={plan.locked}
                  className="mt-8 h-12 w-full rounded-xl text-sm font-medium"
                >
                  {plan.locked ? (
                    <span>{pr.soon}</span>
                  ) : (
                    <Link href="/register">{pr.startNow}</Link>
                  )}
                </Button>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={80} className="mt-6 text-center">
          <p className="text-sm leading-7 text-muted-foreground">
            {pr.footnote}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
