"use client";

import { BarChart3, PackageCheck, ShoppingCart, CreditCard } from "lucide-react";
import FadeIn from "./FadeIn";
import { useLang } from "../_i18n/LanguageContext";

const ICONS = [ShoppingCart, CreditCard, BarChart3, PackageCheck];

export default function CashoFeaturesSection() {
  const { t } = useLang();
  const ft = t.features;

  return (
    <section className="py-24">
      <div className="wrapper">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            {ft.badge}
          </span>

          <h2 className="mt-5 text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            {ft.title}
            <span className="mt-4 block font-semibold bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent">
              {ft.titleAccent}
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            {ft.subtitle}
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          <FadeIn className="relative overflow-hidden rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/8 to-transparent" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PackageCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{ft.orderCard.subtitle}</p>
                  <h3 className="text-xl font-semibold text-foreground">
                    {ft.orderCard.title}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-[15px]">
                {ft.orderCard.desc}
              </p>

              <div className="mt-6 rounded-xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{ft.orderCard.newOrder}</p>
                    <h4 className="mt-1 font-semibold text-foreground">{ft.orderCard.orderNum}</h4>
                  </div>
                  <span className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {ft.orderCard.badge}
                  </span>
                </div>

                <div className="space-y-3 py-4">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{ft.orderCard.product1.name}</p>
                      <p className="text-sm text-muted-foreground">{ft.orderCard.product1.qty}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{ft.orderCard.product1.price}</p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{ft.orderCard.product2.name}</p>
                      <p className="text-sm text-muted-foreground">{ft.orderCard.product2.qty}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{ft.orderCard.product2.price}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">{ft.orderCard.customer}</p>
                    <p className="mt-1 font-medium text-foreground">{ft.orderCard.customerName}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">{ft.orderCard.payment}</p>
                    <p className="mt-1 font-medium text-foreground">{ft.orderCard.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2">
            {ft.items.map((item, index) => {
              const Icon = ICONS[index];
              return (
                <FadeIn
                  key={item.title}
                  delay={index * 80}
                  className="rounded-xl border border-border bg-card p-6 transition-opacity hover:opacity-95"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </FadeIn>
              );
            })}

            <FadeIn
              delay={160}
              className="rounded-xl border border-border bg-card p-6 sm:col-span-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {ft.analyticsCard.title}
                </h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {ft.analyticsCard.desc}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{ft.analyticsCard.newOrders}</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">+128</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{ft.analyticsCard.products}</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">42</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{ft.analyticsCard.paymentMethods}</p>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">4</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
