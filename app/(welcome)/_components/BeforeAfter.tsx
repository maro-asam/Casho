"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  EyeOff,
  Link2,
  Lock,
  MessageCircle,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
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

const BEFORE_ICONS = [AlertCircle, Clock3, EyeOff];
const AFTER_ICONS = [CheckCircle2, Zap, Link2];

/* ------------------------------------------------------------------ */
/* Background — same family as Hero/Stats, tinted toward the "after"   */
/* side to hint at the transformation.                                 */
/* ------------------------------------------------------------------ */

function TransformBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%)",
        }}
      />
      <div className="absolute -top-16 start-0 h-[320px] w-[420px] rounded-full bg-zinc-500/10 blur-[110px] dark:bg-zinc-400/10" />
      <div className="absolute -top-16 end-0 h-[320px] w-[420px] rounded-full bg-primary/15 blur-[110px]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ledger row — pairs a "before" pain point with its "after" outcome.  */
/* ------------------------------------------------------------------ */

function LedgerRow({
  before,
  after,
  index,
}: {
  before: string;
  after: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3.5 py-3 backdrop-blur-sm sm:gap-4 sm:px-5"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <X className="size-3.5" strokeWidth={2.5} />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground line-through decoration-red-500/40 sm:text-sm">
        {before}
      </span>
      <ArrowLeftRight className="size-3.5 shrink-0 text-muted-foreground/40 sm:size-4" />
      <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground sm:text-sm">
        {after}
      </span>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-3.5" strokeWidth={2.5} />
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function BeforeAfterSection() {
  const { t } = useLang();
  const ba = t.beforeAfter;

  const chatSides = useMemo(
    () => ba.before.chat.map((_, i) => (i % 2 === 0 ? "customer" : "merchant")),
    [ba.before.chat],
  );

  return (
    <section className="relative isolate overflow-hidden rounded-xl py-16 sm:py-20 lg:py-24">
      {/* <TransformBackdrop /  > */}

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
            <ArrowLeftRight className="size-3.5 text-primary" />
            {ba.badge}
          </motion.span>

          <motion.h2
            variants={rise}
            custom={0.1}
            style={{
              fontFamily: "var(--font-cairo), var(--font-sans), sans-serif",
            }}
            className="text-balance text-3xl font-black leading-[1.3] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
          >
            {ba.title}{" "}
            <span className="relative inline-block bg-linear-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent rtl:bg-linear-to-l">
              {ba.titleAccent}
            </span>
          </motion.h2>

          <motion.p
            variants={rise}
            custom={0.2}
            className="text-pretty text-[15px] leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            {ba.subtitle}
          </motion.p>
        </motion.div>

        {/* Split window */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="relative mt-12 sm:mt-16"
        >
          <div className="absolute -inset-4 -z-10 hidden rounded-[2rem] bg-primary/10 blur-3xl sm:block" />

          <div className="relative grid overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 ring-1 ring-black/5 lg:grid-cols-2 dark:ring-white/5">
            {/* Center transform badge */}
            <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center lg:flex">
              <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background shadow-lg">
                <ArrowLeftRight className="size-5 text-primary" />
              </div>
            </div>

            {/* Before panel */}
            <div className="relative flex flex-col border-b border-border lg:border-b-0 lg:border-e">
              <div className="flex items-center gap-2.5 border-b border-border bg-red-500/[0.04] px-4 py-2.5 sm:px-5">
                <span className="flex size-6 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <MessageCircle className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {ba.before.label}
                </span>
                <span className="ms-auto rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                  {ba.before.tag}
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                {/* Chat mockup */}
                <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3">
                  {ba.before.chat.map((line, i) => (
                    <div
                      key={i}
                      className={
                        chatSides[i] === "customer"
                          ? "flex justify-start"
                          : "flex justify-end"
                      }
                    >
                      <div
                        className={
                          chatSides[i] === "customer"
                            ? "max-w-[82%] rounded-2xl rounded-ss-sm bg-muted px-3 py-2 text-xs text-foreground sm:text-[13px]"
                            : "max-w-[82%] rounded-2xl rounded-ee-sm border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs text-red-700 sm:text-[13px] dark:text-red-300"
                        }
                      >
                        {line}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 ps-1 pt-0.5 text-[10px] text-muted-foreground">
                    <Clock3 className="size-3" />
                    {ba.before.delayHint}
                  </div>
                </div>

                {/* Pain points */}
                <div className="space-y-2.5">
                  {ba.before.points.map((item, index) => {
                    const Icon = BEFORE_ICONS[index % BEFORE_ICONS.length];
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-2.5"
                      >
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground sm:text-sm">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground sm:text-xs">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* After panel */}
            <div className="relative flex flex-col">
              <div className="flex items-center gap-2.5 border-b border-border bg-primary/[0.04] px-4 py-2.5 sm:px-5">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lock className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-foreground">
                  {ba.after.label}
                </span>
                <span className="ms-auto rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {ba.after.tag}
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                {/* Order preview mockup */}
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div
                    className="mb-2.5 flex items-center justify-between gap-3"
                    dir="ltr"
                  >
                    <p className="text-[11px] font-medium text-muted-foreground">
                      mmc.casho.store
                    </p>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                      </span>
                      {ba.after.live}
                    </span>
                  </div>

                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-foreground">
                      {ba.after.order.title}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck className="size-3" />
                      {ba.after.order.paidTag}
                    </span>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {ba.after.order.product}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {ba.after.order.qty}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {ba.after.order.price}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        {ba.after.order.customerLabel}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-foreground">
                        {ba.after.order.customerName}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        {ba.after.order.paymentLabel}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-foreground">
                        {ba.after.order.paymentMethod}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wins */}
                <div className="space-y-2.5">
                  {ba.after.points.map((item, index) => {
                    const Icon = AFTER_ICONS[index % AFTER_ICONS.length];
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-2.5"
                      >
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground sm:text-sm">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground sm:text-xs">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ledger */}
        <div className="mx-auto mt-8 max-w-3xl space-y-2.5 sm:mt-10">
          {ba.before.points.map((point, index) => (
            <LedgerRow
              key={point.title}
              before={point.title}
              after={ba.after.points[index]?.title ?? ""}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
