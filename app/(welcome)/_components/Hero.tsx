"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Check,
  CreditCard,
  Lock,
  Palette,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "../_i18n/LanguageContext";
import type { translations } from "../_i18n/translations";

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

// Starting figures for the demo dashboard; live orders are added on top.
const BASE_SALES = 18450;
const BASE_ORDERS = 37;
// Daily sales in thousands of EGP.
const CHART_POINTS = [9.2, 12.4, 10.8, 15.6, 14.1, 19.3, 24.5];
const THEME_SWATCHES = ["#1447e6", "#f97316", "#db2777", "#0f172a"];

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
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (reduce) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration: 1.2,
      ease: EASE,
      onUpdate: (v) => {
        current.current = v;
        setDisplay(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span className="tabular-nums">{nf.format(display)}</span>;
}

/* ------------------------------------------------------------------ */
/* Background                                                          */
/* ------------------------------------------------------------------ */

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)",
        }}
      />
      <div className="absolute -top-40 start-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] rtl:translate-x-1/2" />
      <div className="absolute bottom-0 end-0 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[100px]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Glow above the copy                                                 */
/* ------------------------------------------------------------------ */

function TextGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 -z-10 hidden h-[280px] w-[min(520px,100%)] -translate-x-1/2 rounded-full bg-primary/15 blur-[90px] sm:block"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Headline                                                            */
/* ------------------------------------------------------------------ */

function Words({ text, startDelay }: { text: string; startDelay: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`}>
          <motion.span
            variants={rise}
            initial="hidden"
            animate="show"
            custom={startDelay + i * 0.06}
            className="inline-block text-extrabold"
          >
            {word}
          </motion.span>{" "}
        </span>
      ))}
    </>
  );
}

function Headline() {
  const { t } = useLang();
  const h = t.heroMain;
  const beforeCount = h.titleBefore.split(" ").length;
  const highlightDelay = 0.15 + beforeCount * 0.06;

  return (
    <h1
      id="hero-title"
      style={{ fontFamily: "var(--font-cairo), var(--font-sans), sans-serif" }}
      className="text-balance text-[2rem] font-black leading-[1.35] tracking-tight text-foreground min-[380px]:text-[2.25rem] sm:text-5xl sm:leading-[1.25] lg:text-[3.25rem] xl:text-6xl 2xl:text-[4.25rem]"
    >
      <Words text={h.titleBefore} startDelay={0.15} />
      <motion.span
        variants={rise}
        initial="hidden"
        animate="show"
        custom={highlightDelay}
        className="relative inline-block sm:whitespace-nowrap "
      >
        <span className="relative !font-extrabold z-10 bg-linear-to-r from-primary via-primary to-primary/55 bg-clip-text text-transparent rtl:bg-linear-to-l">
          {h.titleHighlight}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 300 20"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -bottom-0.5 h-2.5 w-full text-primary/40 sm:-bottom-1 sm:h-4"
        >
          <motion.path
            d="M4 14 C 60 4, 140 4, 296 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: highlightDelay + 0.35, ease: EASE }}
          />
        </svg>
      </motion.span>{" "}
      <br className="hidden md:block" />
      <span className="text-foreground/90 text-extrabold">
        <Words
          text={h.titleAfter}
          startDelay={highlightDelay + 0.12}
        />
      </span>
    </h1>
  );
}

/* ------------------------------------------------------------------ */
/* Product showcase                                                    */
/* ------------------------------------------------------------------ */

type DemoOrder = (typeof translations)["ar"]["heroMain"]["mockup"]["orders"][number];
type FeedItem = { key: number; order: DemoOrder };

function useLiveFeed(orders: readonly DemoOrder[]) {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  // Newest first; each tick "delivers" the next order in the list.
  const feed: FeedItem[] = [0, 1, 2].map((offset) => {
    const key = tick + 2 - offset;
    return { key, order: orders[key % orders.length] };
  });

  // Sum of every order delivered so far (orders[3], orders[4], … wrapping around).
  const cycleTotal = orders.reduce((sum, o) => sum + o.amount, 0);
  let sales = BASE_SALES + Math.floor(tick / orders.length) * cycleTotal;
  for (let i = 0; i < tick % orders.length; i++) {
    sales += orders[(i + 3) % orders.length].amount;
  }

  return { feed, tick, sales, ordersCount: BASE_ORDERS + tick };
}

function SalesChart() {
  const { lang } = useLang();
  const reduce = useReducedMotion();
  const locale = lang === "ar" ? "ar-EG" : "en-US";

  const compact = useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
    [locale],
  );
  // Seven consecutive fixed dates so labels are identical on server and client.
  const days = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    return CHART_POINTS.map((_, i) => fmt.format(new Date(Date.UTC(2026, 0, 3 + i))));
  }, [locale]);

  const W = 320;
  const H = 120;
  const padX = 8;
  const top = 30;
  const bottom = 104;
  const max = Math.max(...CHART_POINTS);
  const step = (W - padX * 2) / (CHART_POINTS.length - 1);
  const pts = CHART_POINTS.map((v, i) => [padX + i * step, bottom - (v / max) * (bottom - top)]);

  const line = pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");
  const area = `${line} L${pts[pts.length - 1][0]},${bottom} L${padX},${bottom} Z`;
  const [lastX, lastY] = pts[pts.length - 1];
  const tip = compact.format(CHART_POINTS[CHART_POINTS.length - 1] * 1000);

  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible text-primary" aria-hidden>
        <defs>
          <linearGradient id="hero-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[top, (top + bottom) / 2, bottom].map((y) => (
          <line
            key={y}
            x1={padX}
            x2={W - padX}
            y1={y}
            y2={y}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray={y === bottom ? undefined : "3 4"}
          />
        ))}

        <motion.path
          d={area}
          fill="url(#hero-area)"
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.9, ease: EASE }}
        />

        {pts.slice(0, -1).map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.5"
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 + (i / (pts.length - 1)) * 1.4 }}
          />
        ))}

        {/* Highlighted latest point with value tooltip */}
        <motion.g
          initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.3, ease: EASE }}
        >
          <line x1={lastX} x2={lastX} y1={lastY} y2={bottom} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="3 3" />
          {!reduce && (
            <motion.circle
              cx={lastX}
              cy={lastY}
              r="5"
              fill="currentColor"
              animate={{ r: [5, 13], opacity: [0.45, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <circle cx={lastX} cy={lastY} r="5" fill="currentColor" className="stroke-card" strokeWidth="2" />
          <rect x={lastX - 58} y={lastY - 30} width="50" height="20" rx="6" fill="currentColor" />
          <text
            x={lastX - 33}
            y={lastY - 16}
            textAnchor="middle"
            className="fill-primary-foreground"
            fontSize="10"
            fontWeight="700"
          >
            {tip}
          </text>
        </motion.g>
      </svg>
      <div className="mt-1.5 flex justify-between px-0.5 text-[9px] font-medium text-muted-foreground">
        {days.map((d, i) => (
          <span key={i} className={cn(i === days.length - 1 && "font-bold text-primary")}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/70 bg-background/70 p-3", className)}>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 text-lg font-extrabold text-foreground">{children}</div>
      {hint && <div className="mt-0.5 text-[10px] font-semibold">{hint}</div>}
    </div>
  );
}

function FloatingCard({
  className,
  delay,
  float = 6,
  children,
}: {
  className?: string;
  delay: number;
  float?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={cn("absolute z-20", className)}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -float, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        className="rounded-2xl border border-border/80 bg-card/90 p-3 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/40"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Showcase() {
  const { t } = useLang();
  const m = t.heroMain.mockup;
  const nf = useNumberFormat();
  const pct = useNumberFormat({ style: "percent" });
  const reduce = useReducedMotion();
  const { feed, tick, sales, ordersCount } = useLiveFeed(m.orders);
  const latest = feed[0].order;

  // Subtle 3D tilt that follows the pointer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 18 });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
      className="relative mx-auto w-full max-w-[560px] select-none [perspective:1400px] lg:max-w-none xl:max-w-[560px]"
    >
      <motion.div style={{ rotateX, rotateY }} className="relative [transform-style:preserve-3d]">
        {/* Glow behind the window */}
        <div aria-hidden className="absolute -inset-6 -z-10 hidden rounded-[2.5rem] bg-primary/15 blur-3xl sm:block" />

        {/* Browser window */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-3 py-2 sm:px-4 sm:py-2.5" dir="ltr">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-red-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="mx-auto flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">
              <Lock className="size-3 text-emerald-500" />
              <span className="font-medium text-foreground">{m.url}</span>
            </div>
            <div className="hidden w-10 sm:block" />
          </div>

          <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-5">
            {/* Store header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
                  <Image src="/white-logo.svg" alt="" width={18} height={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight text-foreground">{m.storeName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{m.greeting}</p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                {m.live}
              </span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <KpiCard
                label={m.salesLabel}
                className="col-span-2 sm:col-span-1"
                hint={
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="size-3" />
                    {m.salesTrend}
                  </span>
                }
              >
                <AnimatedNumber value={sales} />{" "}
                <span className="text-xs font-semibold text-muted-foreground">{m.currency}</span>
              </KpiCard>
              <KpiCard label={m.ordersLabel}>
                <AnimatedNumber value={ordersCount} />
              </KpiCard>
              <KpiCard label={m.conversionLabel}>{pct.format(0.048)}</KpiCard>
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground">{m.chartLabel}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="size-3" />
                  {pct.format(0.18)}
                </span>
              </div>
              <SalesChart />
            </div>

            {/* Live orders */}
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="mb-2 text-[11px] font-medium text-muted-foreground">{m.liveOrders}</p>
              <ul className="relative space-y-1.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {feed.map(({ key, order }, i) => (
                    <motion.li
                      key={key}
                      layout
                      initial={{ opacity: 0, y: -14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg px-2.5 py-2",
                        i === 0 ? "bg-primary/[0.07]" : "bg-transparent",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                          {order.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{order.product}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {order.name} · {order.city}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="text-xs font-bold text-foreground tabular-nums">
                          {nf.format(order.amount)} {m.currency}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] font-semibold",
                            order.paid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {order.paid ? m.paid : m.cod}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </div>

        {/* New order toast */}
        <FloatingCard className="-top-6 -start-4 hidden sm:block lg:-start-5 xl:-start-10" delay={1.1}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tick}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="flex w-48 items-center gap-2.5 lg:w-52"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">{m.newOrder}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  +{nf.format(latest.amount)} {m.currency} · {latest.city}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </FloatingCard>

        {/* Payment confirmation */}
        <FloatingCard className="-bottom-6 -end-3 hidden sm:block xl:-end-8" delay={1.35} float={8}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tick}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2.5"
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  latest.paid
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {latest.paid ? <CreditCard className="size-4" /> : <Banknote className="size-4" />}
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs font-bold text-foreground">
                  {latest.paid ? m.paymentTitle : m.cod}
                  {latest.paid && <BadgeCheck className="size-3.5 text-emerald-500" />}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {latest.method} · {m.justNow}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </FloatingCard>

        {/* Themes */}
        <FloatingCard className="top-[38%] -end-10 hidden 2xl:block" delay={1.6} float={5}>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
              <Palette className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{m.themesTitle}</p>
              <div className="mt-1 flex gap-1">
                {THEME_SWATCHES.map((c) => (
                  <span key={c} className="size-3.5 rounded-full ring-2 ring-card" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </FloatingCard>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  const { t } = useLang();
  const h = t.heroMain;
  const reduce = useReducedMotion();

  // Soft spotlight that tracks the cursor across the whole hero.
  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${mx}px ${my}px, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)`;

  return (
    <section
      aria-labelledby="hero-title"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      className="relative isolate overflow-hidden rounded-xl pb-12 pt-4 sm:pb-16 sm:pt-8 lg:flex lg:min-h-[calc(100svh-7rem)] lg:items-center lg:pb-20 lg:pt-12"
    >
      {/* <HeroBackdrop /> */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: spotlight }} />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 sm:gap-16 sm:px-4 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-6 xl:gap-16 xl:px-10">
        {/* Copy */}
        <div className="relative flex flex-col items-center text-center lg:items-start lg:text-start">
          <TextGlow />
          <motion.div variants={rise} initial="hidden" animate="show" custom={0} className="max-w-full">
            <Link
              href="/register"
              className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background/70 py-1 pe-2.5 ps-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 sm:gap-2 sm:pe-3 sm:text-sm"
            >
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground sm:px-2.5 sm:text-xs">
                <Sparkles className="size-3" />
                {h.newTag}
              </span>
              <span className="min-w-0 truncate">{h.eyebrow}</span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </motion.div>

          <div className="mt-6 sm:mt-7">
            <Headline />
          </div>

          <motion.p
            variants={rise}
            initial="hidden"
            animate="show"
            custom={0.55}
            className="mt-5 max-w-xl text-pretty text-[15px] leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-9"
          >
            {h.subtitle}
          </motion.p>

          <motion.div
            variants={rise}
            initial="hidden"
            animate="show"
            custom={0.7}
            className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="group relative h-12 overflow-hidden rounded-xl px-7 text-base font-bold sm:h-13 shadow-lg shadow-primary/25 hover:bg-primary hover:shadow-xl hover:shadow-primary/35"
            >
              <Link href="/register">
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                {h.ctaPrimary}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-xl px-7 text-base font-semibold backdrop-blur sm:h-13"
            >
              <Link href="#features">{h.ctaSecondary}</Link>
            </Button>
          </motion.div>

          <motion.ul
            variants={rise}
            initial="hidden"
            animate="show"
            custom={0.85}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mt-8 sm:gap-x-6 lg:justify-start"
          >
            {h.trust.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-2.5" strokeWidth={3.5} />
                </span>
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Visual */}
        <Showcase />
      </div>
    </section>
  );
}
