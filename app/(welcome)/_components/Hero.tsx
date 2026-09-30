"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, ChartNoAxesCombined, Check, Globe, Package, ScanBarcode, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "../_i18n/LanguageContext";
import type { translations } from "../_i18n/translations";

type Mockup = (typeof translations)["ar"]["heroMain"]["mockup"];
type Channel = "pos" | "online";

/* ------------------------------------------------------------------ */
/* Demo data (EGP). Six closed days + today, which fills up live.      */
/* ------------------------------------------------------------------ */

const PAST_DAYS: { online: number; pos: number }[] = [
  { online: 4200, pos: 3100 },
  { online: 3600, pos: 2800 },
  { online: 4800, pos: 2600 },
  { online: 5200, pos: 3400 },
  { online: 4700, pos: 3900 },
  { online: 6100, pos: 4800 },
];
const TODAY_BASE = { online: 2900, pos: 2100 };
const CHART_MAX = 12000;
const GRID_STEPS = [0, 4000, 8000, 12000];
const STOCK_START = 24;
/** Sales per demo "day" before today's bar starts over, so it never overflows. */
const ROUND = 10;
const TICK_MS = 3200;

function useFormatters() {
  const { lang } = useLang();
  return useMemo(() => {
    const locale = lang === "ar" ? "ar-EG" : "en-US";
    return {
      number: new Intl.NumberFormat(locale),
      compact: new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 0 }),
    };
  }, [lang]);
}

/**
 * Advances the demo every few seconds — only while the hero is on screen, the
 * tab is visible and the visitor hasn't asked for reduced motion.
 */
function useDemoTick(ref: React.RefObject<HTMLElement | null>) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    let timer: number | undefined;
    const sync = () => {
      const run = visible && document.visibilityState === "visible";
      if (run && timer === undefined) timer = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
      if (!run && timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [ref]);

  return tick;
}

function demoState(events: Mockup["events"], tick: number) {
  const done = tick % ROUND;
  const today = { ...TODAY_BASE };
  let sold = 0;
  for (let i = 0; i < done; i++) {
    const e = events[i % events.length];
    today[e.channel as Channel] += e.amount;
    sold += e.qty;
  }
  const latest = tick > 0 ? events[(tick - 1) % events.length] : null;
  return { today, stock: STOCK_START - sold, latest: latest as (Mockup["events"][number] & { channel: Channel }) | null };
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

const PROOF_ICONS = [Boxes, ScanBarcode, ChartNoAxesCombined];

function HeroCopy() {
  const { t } = useLang();
  const h = t.heroMain;

  return (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground sm:text-sm">
        <span className="flex -space-x-1 rtl:space-x-reverse">
          <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
            <Store className="size-3" />
          </span>
          <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-primary ring-2 ring-card">
            <Globe className="size-3" />
          </span>
        </span>
        <span className="truncate font-medium">{h.eyebrow}</span>
      </span>

      <h1
        id="hero-title"
        className="mt-6 max-w-2xl text-balance text-4xl leading-[1.25] tracking-tight text-foreground sm:text-5xl sm:leading-[1.2] xl:text-[3.4rem]"
      >
        <span className="block font-normal">{h.title}</span>
        <span className="block font-extrabold text-primary">{h.titleHighlight}</span>
      </h1>

      <p className="mt-6 max-w-xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">{h.subtitle}</p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <Button asChild size="lg" className="group h-12 rounded-xl px-7 text-base font-semibold">
          <Link href="/register">
            {h.ctaPrimary}
            <ArrowLeft className="size-4 transition-transform ltr:-scale-x-100 motion-safe:group-hover:-translate-x-0.5 motion-safe:ltr:group-hover:translate-x-0.5" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-7 text-base font-semibold">
          <Link href="#why">{h.ctaSecondary}</Link>
        </Button>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-4 text-primary" strokeWidth={2.5} />
        {h.note}
      </p>

      <ul className="mt-10 grid w-full max-w-xl grid-cols-1 gap-4 border-t border-border pt-6 text-start sm:grid-cols-3 sm:gap-6">
        {h.proof.map((item, i) => {
          const Icon = PROOF_ICONS[i] ?? Check;
          return (
            <li key={item.title} className="flex items-start gap-3 sm:flex-col sm:gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chart — stacked bars: shop (POS) at the bottom, online on top       */
/* ------------------------------------------------------------------ */

function SalesChart({ today, m }: { today: { online: number; pos: number }; m: Mockup }) {
  const f = useFormatters();
  const days = [...PAST_DAYS.map((d, i) => ({ ...d, label: m.days[i] })), { ...today, label: m.today }];

  return (
    <div role="img" aria-label={m.chartLabel} className="relative h-44 sm:h-52">
      {/* Grid + axis */}
      <div className="absolute inset-0 bottom-6 flex flex-col-reverse justify-between">
        {GRID_STEPS.map((v) => (
          <div key={v} className="relative border-t border-dashed border-border first:border-solid">
            <span className="absolute -top-2 inset-e-0 bg-card ps-1.5 text-[10px] leading-none text-muted-foreground tabular-nums">
              {v === 0 ? f.number.format(0) : f.compact.format(v)}
            </span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="absolute inset-0 inset-e-9 flex items-stretch justify-between gap-2 sm:gap-3">
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          const total = d.online + d.pos;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center">
              <div className="relative flex w-full max-w-9 flex-1 flex-col justify-end gap-px pb-px">
                {/* Hover value */}
                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-semibold text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {f.number.format(total)} {m.currency}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-[4px] bg-primary transition-[height] duration-700 ease-out",
                    !isToday && "opacity-90 group-hover:opacity-100",
                  )}
                  style={{ height: `${(d.online / CHART_MAX) * 100}%` }}
                />
                <div
                  className="w-full bg-primary/30 transition-[height] duration-700 ease-out"
                  style={{ height: `${(d.pos / CHART_MAX) * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "mt-2 h-4 truncate text-[10px] leading-4",
                  isToday ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase                                                            */
/* ------------------------------------------------------------------ */

/** Brief ring when this card's channel just made a sale. */
function Flash({ show, tick }: { show: boolean; tick: number }) {
  if (!show) return null;
  return (
    <span
      key={tick}
      aria-hidden
      className="pointer-events-none absolute -inset-px rounded-[inherit] ring-2 ring-primary/50 motion-safe:animate-hero-flash"
    />
  );
}

function SourceCard({
  icon: Icon,
  iconClass,
  title,
  meta,
  pill,
  pillClass,
  detail,
  amount,
  currency,
  flash,
  tick,
}: {
  icon: typeof Globe;
  iconClass: string;
  title: React.ReactNode;
  meta: string;
  pill: string;
  pillClass: string;
  detail: string;
  amount: string;
  currency: string;
  flash: boolean;
  tick: number;
}) {
  return (
    <div className="relative min-w-0 rounded-xl border border-border bg-card p-3 shadow-lg shadow-black/4 sm:p-3.5 dark:shadow-black/30">
      <Flash show={flash} tick={tick} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", iconClass)}>
            <Icon className="size-3.5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-foreground">{title}</p>
            <p className="truncate text-[10px] text-muted-foreground">{meta}</p>
          </div>
        </div>
        <span className={cn("hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:inline", pillClass)}>{pill}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 border-t border-dashed border-border pt-2.5">
        <span className="truncate text-[11px] text-muted-foreground">{detail}</span>
        <span className="shrink-0 text-sm font-bold text-foreground tabular-nums">
          {amount} <span className="text-[10px] font-medium text-muted-foreground">{currency}</span>
        </span>
      </div>
    </div>
  );
}

/** Two sources flowing into one dashboard; the active one lights up. */
function Connector({ active, label }: { active: Channel | null; label: string }) {
  const line = (on: boolean) =>
    cn("transition-[stroke,stroke-opacity] duration-500", on ? "stroke-primary" : "stroke-border");
  const { lang } = useLang();
  // The first card (POS) sits on the right in Arabic, on the left in English.
  const posX = lang === "ar" ? 75 : 25;
  const onlineX = 100 - posX;
  const branch = (x: number, on: boolean) => (
    <path
      d={`M${x} 0 C${x} 18, 50 14, 50 28`}
      strokeWidth={1.5}
      strokeDasharray="4 4"
      vectorEffect="non-scaling-stroke"
      className={line(on)}
    />
  );

  return (
    <div className="relative h-14">
      <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 56" preserveAspectRatio="none" fill="none">
        {branch(posX, active === "pos")}
        {branch(onlineX, active === "online")}
        <path d="M50 28 L50 56" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className={line(active !== null)} />
      </svg>
      <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
        </span>
        {label}
      </span>
    </div>
  );
}

function Legend({ tone, label, value, currency }: { tone: string; label: string; value: string; currency: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2.5 rounded-sm", tone)} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground tabular-nums">
        {value} <span className="font-normal text-muted-foreground">{currency}</span>
      </span>
    </div>
  );
}

function Showcase() {
  const { t } = useLang();
  const m = t.heroMain.mockup;
  const f = useFormatters();
  const rootRef = useRef<HTMLDivElement>(null);
  const tick = useDemoTick(rootRef);
  const { today, stock, latest } = demoState(m.events, tick);

  const onlineTotal = PAST_DAYS.reduce((s, d) => s + d.online, 0) + today.online;
  const posTotal = PAST_DAYS.reduce((s, d) => s + d.pos, 0) + today.pos;
  const latestIsPos = latest?.channel === "pos";

  return (
    <div ref={rootRef} aria-hidden className="relative mx-auto w-full max-w-xl select-none lg:max-w-none">
      {/* Faint grid, only behind the product shot */}
      <div className="pointer-events-none absolute -inset-6 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[36px_36px] opacity-50 mask-[radial-gradient(ellipse_at_center,black_35%,transparent_72%)]" />

      {/* Where sales come from */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <SourceCard
          icon={ScanBarcode}
          iconClass="bg-foreground text-background"
          title={m.receipt.title}
          meta={m.receipt.branch}
          pill={m.receipt.paid}
          pillClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          detail={m.receipt.summary}
          amount={f.number.format(m.receipt.items.reduce((sum, i) => sum + i.price, 0))}
          currency={m.currency}
          flash={latestIsPos}
          tick={tick}
        />
        <SourceCard
          icon={Globe}
          iconClass="bg-primary text-primary-foreground"
          title={
            <>
              {m.order.title}{" "}
              <span className="font-mono text-[10px] font-normal text-muted-foreground" dir="ltr">
                {m.order.id}
              </span>
            </>
          }
          meta={m.order.customer}
          pill={m.order.status}
          pillClass="bg-primary/10 text-primary"
          detail={m.order.method}
          amount={f.number.format(m.order.amount)}
          currency={m.currency}
          flash={!!latest && !latestIsPos}
          tick={tick}
        />
      </div>

      <Connector active={latest ? latest.channel : null} label={m.sync} />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
          <div>
            <p className="text-xs text-muted-foreground">
              {m.title} · {m.range}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                {f.number.format(onlineTotal + posTotal)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{m.currency}</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {m.trend}
            <span className="font-normal text-emerald-700/80 dark:text-emerald-400/80">{m.trendHint}</span>
          </span>
          <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-1.5">
            <Legend tone="bg-primary" label={m.online} value={f.number.format(onlineTotal)} currency={m.currency} />
            <Legend tone="bg-primary/30" label={m.pos} value={f.number.format(posTotal)} currency={m.currency} />
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <SalesChart today={today} m={m} />
        </div>

        {/* Footer: one stock count, drawn down by both channels */}
        <div className="grid grid-cols-1 divide-y divide-border border-t border-border bg-muted/30 sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
          <div className="flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground">
              <Package className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">{m.stockLabel}</p>
              <p className="truncate text-xs font-semibold text-foreground">{m.product}</p>
            </div>
            <div className="shrink-0 text-end">
              <p key={stock} className="text-sm font-bold text-foreground tabular-nums motion-safe:animate-in motion-safe:fade-in">
                {m.pieces.replace("{count}", f.number.format(stock))}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {latest ? (latestIsPos ? m.fromPos : m.fromOnline) : m.justNow}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                latestIsPos ? "bg-foreground text-background" : "bg-primary text-primary-foreground",
              )}
            >
              {latestIsPos ? <ScanBarcode className="size-4" /> : <Globe className="size-4" />}
            </span>
            <div key={tick} className="min-w-0 flex-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {latestIsPos ? m.latestPos : m.latestOnline}
                <span className="ms-1.5 font-normal text-muted-foreground">· {latest?.place ?? m.order.customer}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">{m.justNow}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              +{f.number.format(latest?.amount ?? m.order.amount)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="pb-12 pt-4 sm:pb-16 sm:pt-8 lg:flex lg:min-h-[calc(100svh-7rem)] lg:items-center lg:pb-20 lg:pt-10"
    >
      <div className="mx-auto grid w-full max-w-screen-2xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:px-10 xl:gap-16">
        {/* Copy renders immediately — it's the LCP, so no entrance animation. */}
        <HeroCopy />
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <Showcase />
        </div>
      </div>
    </section>
  );
}
