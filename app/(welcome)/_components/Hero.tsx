"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Store,
  ShoppingCart,
  Wallet,
  PackageCheck,
  TrendingUp,
  ChevronLeft,
  Bell,
  Package,
  StoreIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HERO_CHART_DATA,
  HERO_CONTENT,
  HERO_RECENT_ORDERS,
} from "@/constants/welcome/hero.constants";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16">
      <div className="wrapper mx-auto flex max-w-7xl flex-col items-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
        >
          <StoreIcon className="size-4 text-primary" />
          <span className="h-5 w-[0.5px] bg-muted-foreground" />
          <span>{HERO_CONTENT.badge}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-6 max-w-6xl text-4xl font-extrabold leading-normal tracking-tight sm:text-5xl lg:text-6xl"
        >
          {HERO_CONTENT.title}
          <span className="mt-2 block bg-linear-to-l from-primary via-sky-500 to-primary bg-clip-text text-transparent">
            {HERO_CONTENT.highlight}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground"
        >
          {HERO_CONTENT.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link
              href={HERO_CONTENT.cta.primary.href}
              className="flex items-center gap-2 px-10 font-bold"
            >
              <span className="relative z-10">
                {HERO_CONTENT.cta.primary.label}
              </span>
              <Store className="relative z-10 size-4" />
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="px-6" asChild>
            <Link href={HERO_CONTENT.cta.secondary.href}>
              {HERO_CONTENT.cta.secondary.label}
              <ArrowLeft className="ms-2 size-4" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
        >
          {HERO_CONTENT.highlights.map((item, index) => (
            <div key={item} className="flex items-center gap-4">
              <span>{item}</span>
              {index !== HERO_CONTENT.highlights.length - 1 && <span>•</span>}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="relative mt-14 w-full max-w-5xl"
        >
          <div className="absolute inset-x-10 bottom-0 h-24 rounded-xl bg-primary/10 blur-3xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-background/80 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.12)] backdrop-blur-xl md:p-6">
            <div className="mb-5 flex items-center justify-between rounded-xl border border-border/20 bg-background/70 px-4 py-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {HERO_CONTENT.dashboard.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {HERO_CONTENT.dashboard.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Bell className="size-3.5" />
                {HERO_CONTENT.dashboard.liveBadge}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-border/20 bg-background/85 p-4 text-right"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Wallet className="size-4" />
                      </div>
                      <span className="text-xs text-emerald-600">
                        {HERO_CONTENT.dashboard.salesGrowth}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {HERO_CONTENT.dashboard.salesTitle}
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {HERO_CONTENT.dashboard.salesValue}
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-border/20 bg-background/85 p-4 text-right"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <ShoppingCart className="size-4" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {HERO_CONTENT.dashboard.ordersNote}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {HERO_CONTENT.dashboard.ordersTitle}
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {HERO_CONTENT.dashboard.ordersValue}
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-border/20 bg-background/85 p-4 text-right"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <TrendingUp className="size-4" />
                      </div>
                      <span className="text-xs text-emerald-600">
                        {HERO_CONTENT.dashboard.conversionStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {HERO_CONTENT.dashboard.conversionTitle}
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {HERO_CONTENT.dashboard.conversionValue}
                    </p>
                  </motion.div>
                </div>

                <div className="rounded-xl border border-border/20 bg-background/85 p-5 text-right">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {HERO_CONTENT.dashboard.chartTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {HERO_CONTENT.dashboard.chartSubtitle}
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/10 px-3 py-1 text-xs text-primary">
                      {HERO_CONTENT.dashboard.chartBadge}
                    </div>
                  </div>

                  <div className="flex h-44 items-end justify-between gap-2">
                    {HERO_CHART_DATA.map((value, index) => (
                      <div
                        key={index}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: `${value}%`, opacity: 1 }}
                          transition={{
                            duration: 0.7,
                            delay: 0.1 * index,
                            ease: "easeOut",
                          }}
                          className="w-full rounded-t-2xl bg-linear-to-t from-primary via-primary/80 to-sky-300/60"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border/20 bg-background/85 p-5 text-right">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {HERO_CONTENT.dashboard.recentOrdersTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {HERO_CONTENT.dashboard.recentOrdersSubtitle}
                      </p>
                    </div>

                    <button className="flex items-center gap-1 text-xs text-primary">
                      {HERO_CONTENT.dashboard.recentOrdersAction}
                      <ChevronLeft className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {HERO_RECENT_ORDERS.map((order, index) => (
                      <motion.div
                        key={`${order.name}-${index}`}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.15 * index }}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-background/80 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Package className="size-4" />
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{order.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.product}
                            </p>
                          </div>
                        </div>

                        <div className="text-left">
                          <p className="text-sm font-semibold">{order.price}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.status}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 4.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-xl border border-primary/15 bg-primary/5 p-5 text-right"
                >
                  <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                    <PackageCheck className="size-4" />
                  </div>
                  <p className="text-sm font-semibold">
                    {HERO_CONTENT.alertCard.title}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {HERO_CONTENT.alertCard.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">
                      {HERO_CONTENT.alertCard.product}
                    </span>
                    <span className="font-semibold">
                      {HERO_CONTENT.alertCard.price}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.45, delay: 0.5 },
              scale: { duration: 0.45, delay: 0.5 },
              y: {
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.9,
              },
            }}
            className="absolute -right-2 top-8 hidden w-55 rounded-xl border border-border/70 bg-background/85 p-3 shadow-xl backdrop-blur-xl md:block lg:-right-11"
          >
            <div className="flex items-start gap-3 text-right">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {HERO_CONTENT.floatingCards.top.title}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {HERO_CONTENT.floatingCards.top.description}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1, y: [0, 8, 0] }}
            transition={{
              opacity: { duration: 0.45, delay: 0.65 },
              scale: { duration: 0.45, delay: 0.65 },
              y: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.1,
              },
            }}
            className="absolute -left-2 bottom-10 hidden w-55 rounded-xl border border-border/70 bg-background/85 p-3 shadow-xl backdrop-blur-xl md:block lg:-left-11"
          >
            <div className="flex items-start gap-3 text-right">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Wallet className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {HERO_CONTENT.floatingCards.bottom.title}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {HERO_CONTENT.floatingCards.bottom.description}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
