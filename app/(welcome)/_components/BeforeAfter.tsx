"use client";

import { AlertCircle, CheckCircle2, Clock3, Link2, ShoppingCart, ArrowLeftRight } from "lucide-react";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";

const BEFORE_ICONS = [AlertCircle, Clock3, Link2];
const AFTER_ICONS = [ShoppingCart, CheckCircle2, Link2];

export default function BeforeAfterSection() {
  const { t } = useLang();
  const ba = t.beforeAfter;

  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            {ba.badge}
          </span>

          <h2 className="text-3xl md:text-4xl leading-tight text-foreground">
            {ba.title}
            <span className="block bg-linear-to-l mt-4 font-semibold from-primary via-sky-500 to-primary bg-clip-text text-transparent">
              {ba.titleAccent}
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            {ba.subtitle}
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <FadeIn
            from="right"
            className="rounded-xl border border-red-500/20 bg-background/70 p-6 sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-red-500/80">Before</p>
                <h3 className="mt-1 text-2xl font-semibold text-red-600">{ba.beforeLabel}</h3>
              </div>
              <span className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
                {ba.beforeBadge}
              </span>
            </div>

            <div className="space-y-4">
              {ba.before.map((item, index) => {
                const Icon = BEFORE_ICONS[index];
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-red-500/20 bg-card/80 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-500">
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-red-500/20 bg-background/80 p-4 shadow-sm">
              <div className="space-y-3">
                {ba.chatLines.map((line, i) => (
                  <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-sm text-red-700">&quot;{line}&quot;</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn
            from="scale"
            delay={100}
            className="hidden items-center justify-center lg:flex"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary shadow-sm">
              <ArrowLeftRight className="size-6" />
            </div>
          </FadeIn>

          <FadeIn
            from="left"
            className="rounded-xl border border-primary/15 bg-primary/[0.035] p-6 sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-primary/80">After</p>
                <h3 className="mt-1 text-2xl font-semibold text-foreground">{ba.afterLabel}</h3>
              </div>
              <span className="rounded-xl border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-sm">
                {ba.afterBadge}
              </span>
            </div>

            <div className="space-y-4">
              {ba.after.map((item, index) => {
                const Icon = AFTER_ICONS[index];
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-primary/20 bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{ba.orderPreview.label}</p>
                  <h4 className="mt-1 font-medium text-foreground">{ba.orderPreview.title}</h4>
                </div>
                <span className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {ba.orderPreview.badge}
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{ba.orderPreview.product}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ba.orderPreview.qty}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{ba.orderPreview.price}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">{ba.orderPreview.customer}</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{ba.orderPreview.customerName}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">{ba.orderPreview.payment}</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{ba.orderPreview.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
