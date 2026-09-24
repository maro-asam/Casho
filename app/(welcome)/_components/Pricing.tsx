"use client";

import { ArrowRight, Check, Clock, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { plans as plansPrices } from "@/constants/welcome/pricing.constants";
import { useLang } from "../_i18n/LanguageContext";

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

export default function PricingSection() {
  const { t } = useLang();
  const pr = t.pricing;
  const planPrice = plansPrices[0];

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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="relative mx-auto mt-12 max-w-4xl sm:mt-16"
        >
          <div className="absolute -inset-4 -z-10 hidden rounded-[2rem] bg-primary/10 blur-3xl sm:block" />

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 ring-1 ring-black/5 dark:ring-white/5">
            <div aria-hidden className="h-1 w-full bg-linear-to-r from-primary via-sky-400 to-primary" />

            <div className="grid lg:grid-cols-[21rem_1fr]">
              {/* Price */}
              <div className="flex flex-col border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-e">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  <Sparkles className="size-3" />
                  {pr.kicker}
                </span>

                <h3 className="mt-4 text-xl font-extrabold text-foreground">{pr.plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{pr.plan.description}</p>

                <div className="mt-6 flex items-end gap-1.5">
                  <span className="text-5xl font-black tracking-tight text-foreground">
                    {planPrice.price}
                  </span>
                  <div className="mb-1.5 text-sm leading-4 text-muted-foreground">
                    <div>{pr.currency}</div>
                    <div>/ {pr.plan.period}</div>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="group mt-6 h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35"
                >
                  <Link href="/register">
                    {pr.startNow}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                </Button>

                <p className="mt-3 text-center text-xs leading-5 text-muted-foreground lg:text-start">
                  {pr.footnote}
                </p>
              </div>

              {/* Features */}
              <div className="p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {pr.featuresLabel}
                </p>

                <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {pr.plan.features.map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: (i % 7) * 0.04, ease: EASE }}
                      className="flex items-center gap-2.5"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <p className="text-sm text-foreground/90">{feature}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {pr.trust.map((item, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm"
                >
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
