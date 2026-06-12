"use client";

import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";

export default function CTASection() {
  const { t } = useLang();
  const cta = t.cta;

  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="wrapper">
        <FadeIn className="relative overflow-hidden rounded-[32px] border border-border bg-linear-to-br from-card via-card to-primary/4 px-6 py-10 shadow-sm sm:px-8 md:px-10 md:py-14">
          {/* background accents */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[-60px] top-[-60px] h-40 w-40 rounded-xl bg-primary/10 blur-3xl" />
            <div className="absolute left-[-40px] bottom-[-60px] h-36 w-36 rounded-xl bg-sky-500/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
            {/* content */}
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                {cta.badge}
              </div>

              <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {cta.title}
                <span className="mt-2 block text-primary">{cta.titleAccent}</span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg lg:mx-0">
                {cta.subtitle}
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="h-12 rounded-xl px-8 text-sm font-medium shadow-sm">
                  <Link href="/signup">
                    {cta.ctaPrimary}
                    <ArrowLeft className="ms-2 size-4.5" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-border bg-card px-8 text-sm font-medium">
                  <Link href="#pricing">{cta.ctaSecondary}</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                {cta.checks.map((check) => (
                  <span key={check} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    {check}
                  </span>
                ))}
              </div>
            </div>

            {/* side card */}
            <div className="mx-auto w-full max-w-md">
              <div className="rounded-[28px] border border-primary/15 bg-card p-5 shadow-sm">
                <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5">
                  <p className="text-sm font-medium text-muted-foreground">{cta.offerCard.remaining}</p>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-extrabold tracking-tight text-foreground">17</p>
                      <p className="mt-1 text-sm text-muted-foreground">{cta.offerCard.merchantsLeft}</p>
                    </div>
                    <div className="rounded-xl border border-primary/15 bg-white px-4 py-2 text-sm font-medium text-primary">
                      {cta.offerCard.specialPrice}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{cta.offerCard.bookingRate}</span>
                      <span className="font-medium text-foreground">66%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-xl bg-primary/10">
                      <div className="h-full w-2/3 rounded-xl bg-primary" />
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-muted-foreground">
                    {cta.offerCard.note}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-sm text-foreground">
                    {cta.offerCard.tagline}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
