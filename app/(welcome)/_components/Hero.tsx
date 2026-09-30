"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowRight,
  Check,
  Globe,
  Lock,
  Package,
  RefreshCw,
  ScanBarcode,
  Store,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "../_i18n/LanguageContext";
import type { translations } from "../_i18n/translations";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Starting figures for the demo dashboard; live orders are added on top.
const BASE_ONLINE_SALES = 11250;
const BASE_POS_SALES = 7200;
const BASE_STOCK = 14;

function useNumberFormat(options?: Intl.NumberFormatOptions) {
  const { lang } = useLang();
  const style = options?.style;
  return useMemo(
    () =>
      new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
        style,
        maximumFractionDigits: 1,
      }),
    [lang, style],
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const nf = useNumberFormat();
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    if (reduce) {
      current.current = value;
      return;
    }
    const controls = animate(current.current, value, {
      duration: 0.8,
      ease: EASE,
      onUpdate: (v) => {
        current.current = v;
        setDisplay(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span className="font-bold tabular-nums">
      {nf.format(reduce ? value : display)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

function HeroCopy() {
  const { t } = useLang();
  const h = t.heroMain;

  return (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
      <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
        <Store className="size-4 shrink-0" />
        <span className="truncate font-medium">{h.eyebrow}</span>
      </span>

      <h1
        id="hero-title"
        className="mt-6 text-balance text-4xl font-normal leading-[1.3] tracking-tight text-foreground sm:text-5xl sm:leading-tight xl:text-[3.5rem] max-w-2xl"
      >
        {h.titleBefore}{" "}
        <span className="font-extrabold text-primary">{h.titleHighlight}</span>{" "}
        {h.titleAfter}
      </h1>

      <p className="mt-5 max-w-xl text-pretty text-base leading-8 text-muted-foreground sm:mt-6 sm:text-lg">
        {h.subtitle}
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <Button
          asChild
          size="lg"
          className="group h-12 rounded-xl px-7 text-base font-semibold"
        >
          <Link href="/register">
            {h.ctaPrimary}
            <ArrowRight className="size-4 transition-transform rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 motion-safe:rtl:group-hover:-translate-x-0.5" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 rounded-xl px-7 text-base font-semibold"
        >
          <Link href="#pricing">{h.ctaSecondary}</Link>
        </Button>
      </div>

      <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
        {h.trust.map((item) => (
          <li
            key={item}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <Check className="size-4 text-primary" strokeWidth={2.5} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product showcase — one dashboard for online + in-store (POS) sales  */
/* ------------------------------------------------------------------ */

type DemoOrder =
  (typeof translations)["ar"]["heroMain"]["mockup"]["orders"][number];
type FeedItem = { key: number; order: DemoOrder };

function useLiveFeed(orders: readonly DemoOrder[], stockProduct: string) {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  const n = orders.length;

  // Newest first; tick t "delivers" orders[(t + 2) % n].
  const feed: FeedItem[] = [0, 1, 2].map((offset) => {
    const key = tick + 2 - offset;
    return { key, order: orders[key % n] };
  });

  // How many times each order has been delivered after `tick` ticks.
  let online = BASE_ONLINE_SALES;
  let pos = BASE_POS_SALES;
  let stockSold = 0;
  orders.forEach((order, j) => {
    const times = Math.floor(tick / n) + ((j - 3 + n) % n < tick % n ? 1 : 0);
    if (order.channel === "pos") pos += order.amount * times;
    else online += order.amount * times;
    if (order.product === stockProduct) stockSold += times;
  });

  // Wraps around like a restock so the demo never runs dry.
  const stock = BASE_STOCK - (stockSold % 10);

  return { feed, tick, online, pos, stock };
}

function ChannelBadge({ channel }: { channel: string }) {
  const { t } = useLang();
  const m = t.heroMain.mockup;
  const isPos = channel === "pos";
  const Icon = isPos ? Store : Globe;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
        isPos
          ? "bg-foreground/5 text-foreground"
          : "bg-primary/10 text-primary",
      )}
    >
      <Icon className="size-3" />
      {isPos ? m.posLabel : m.onlineLabel}
    </span>
  );
}

function Kpi({
  label,
  icon: Icon,
  children,
  hint,
  className,
}: {
  label: string;
  icon?: typeof Globe;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-3",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <div className="mt-1 text-lg font-bold text-foreground">{children}</div>
      {hint && <div className="mt-0.5 text-[11px] font-medium">{hint}</div>}
    </div>
  );
}

function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
        {aside}
      </div>
      {children}
    </div>
  );
}

function ChannelSplit({ online, pos }: { online: number; pos: number }) {
  const { t } = useLang();
  const m = t.heroMain.mockup;
  const pct = useNumberFormat({ style: "percent" });
  const onlineShare = online / (online + pos);

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${onlineShare * 100}%` }}
        />
        <div className="h-full flex-1 bg-primary/35" />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" />
          {m.onlineLabel}
          <span className="font-semibold text-foreground tabular-nums">
            {pct.format(onlineShare)}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-primary/35" />
          {m.posLabel}
          <span className="font-semibold text-foreground tabular-nums">
            {pct.format(1 - onlineShare)}
          </span>
        </span>
      </div>
    </div>
  );
}

function Toast({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute z-10 hidden rounded-xl border border-border bg-card p-3 shadow-lg shadow-black/5 sm:block dark:shadow-black/30",
        className,
      )}
    >
      {children}
    </div>
  );
}

const successText = "text-emerald-600 dark:text-emerald-400";
const warningText = "text-amber-600 dark:text-amber-400";

function Showcase() {
  const { t } = useLang();
  const m = t.heroMain.mockup;
  const nf = useNumberFormat();
  const { feed, tick, online, pos, stock } = useLiveFeed(
    m.orders,
    m.stockProduct,
  );
  const latest = feed[0].order;
  const latestIsPos = latest.channel === "pos";

  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-135 select-none lg:max-w-none xl:max-w-135"
    >
      {/* Browser window */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/6 dark:shadow-black/40">
        <div
          className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5"
          dir="ltr"
        >
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">
            <Lock className="size-3" />
            <span className="font-medium text-foreground">{m.url}</span>
          </div>
          <div className="hidden w-10 sm:block" />
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          {/* Store header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Image src="/white-logo.svg" alt="" width={18} height={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-foreground">
                  {m.storeName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {m.greeting}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold",
                successText,
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {m.live}
            </span>
          </div>

          {/* KPIs — total, then each channel */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Kpi
              label={m.salesLabel}
              className="col-span-2 sm:col-span-1"
              hint={
                <span
                  className={cn("inline-flex items-center gap-1", successText)}
                >
                  <TrendingUp className="size-3" />
                  {m.salesTrend}
                </span>
              }
            >
              <AnimatedNumber value={online + pos} />{" "}
              <span className="text-xs font-medium text-muted-foreground">
                {m.currency}
              </span>
            </Kpi>
            <Kpi label={m.onlineLabel} icon={Globe}>
              <AnimatedNumber value={online} />
            </Kpi>
            <Kpi label={m.posLabel} icon={Store}>
              <AnimatedNumber value={pos} />
            </Kpi>
          </div>

          <Panel title={m.channelSplit}>
            <ChannelSplit online={online} pos={pos} />
          </Panel>

          <Panel title={m.liveOrders}>
            <ul className="space-y-1">
              <AnimatePresence initial={false} mode="popLayout">
                {feed.map(({ key, order }, i) => (
                  <motion.li
                    key={key}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md px-2 py-1.5",
                      i === 0 && "bg-muted/60",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {order.product}
                        </p>
                        <ChannelBadge channel={order.channel} />
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {order.name} · {order.city}
                      </p>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-xs font-semibold text-foreground tabular-nums">
                        {nf.format(order.amount)} {m.currency}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-medium",
                          order.paid ? successText : warningText,
                        )}
                      >
                        {order.paid ? order.method : m.cod}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Panel>

          {/* One stock count, drawn down by both channels */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Package className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {m.sharedStock}
                </p>
                <p className="truncate text-xs font-semibold text-foreground">
                  {m.stockProduct}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-end">
              <p className="text-xs font-bold text-foreground tabular-nums">
                {m.stockLeft.replace("{count}", nf.format(stock))}
              </p>
              <p
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium",
                  successText,
                )}
              >
                <RefreshCw className="size-3" />
                {m.synced}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Where the latest sale came from */}
      <Toast className="-top-5 -inset-s-4 w-56 xl:-inset-s-8">
        <div
          key={tick}
          className="flex items-center gap-2.5 motion-safe:animate-in motion-safe:fade-in"
        >
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              latestIsPos
                ? "bg-muted text-foreground"
                : "bg-primary/10 text-primary",
            )}
          >
            {latestIsPos ? (
              <ScanBarcode className="size-4" />
            ) : (
              <Globe className="size-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {latestIsPos ? m.posSale : m.onlineSale}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              +{nf.format(latest.amount)} {m.currency} · {latest.city}
            </p>
          </div>
        </div>
      </Toast>

      {/* Stock sync confirmation */}
      <Toast className="-bottom-5 -inset-e-3 w-60 xl:-inset-e-6">
        <div
          key={tick}
          className="flex items-center gap-2.5 motion-safe:animate-in motion-safe:fade-in"
        >
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10",
              successText,
            )}
          >
            <RefreshCw className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {m.stockUpdated}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {latest.product} · −1 · {m.justNow}
            </p>
          </div>
        </div>
      </Toast>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    <section
      aria-labelledby="hero-title"
      className="pb-12 pt-4 sm:pb-16 sm:pt-8 lg:flex lg:min-h-[calc(100svh-7rem)] lg:items-center lg:pb-20 lg:pt-12"
    >
      <div className="mx-auto grid w-full max-w-screen-2xl items-center gap-14 px-4 sm:gap-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-10 xl:gap-16">
        <motion.div {...enter(0)}>
          <HeroCopy />
        </motion.div>
        <motion.div {...enter(0.15)}>
          <Showcase />
        </motion.div>
      </div>
    </section>
  );
}
