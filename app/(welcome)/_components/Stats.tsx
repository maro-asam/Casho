"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Headset, PackageCheck, Rocket, Wallet, type LucideIcon } from "lucide-react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useLang } from "../_i18n/LanguageContext";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const ICONS: LucideIcon[] = [Headset, PackageCheck, Wallet, Rocket];

const rise = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay, ease: EASE },
  }),
};

/* ------------------------------------------------------------------ */
/* Background — mirrors HeroBackdrop so the two sections read as one   */
/* continuous surface.                                                 */
/* ------------------------------------------------------------------ */

function StatsBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 65% 65% at 50% 40%, #000 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 65% at 50% 40%, #000 30%, transparent 100%)",
        }}
      />
      <div className="absolute -top-24 start-1/2 h-[380px] w-[620px] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px] rtl:translate-x-1/2" />
      <div className="absolute bottom-0 end-0 h-[280px] w-[280px] rounded-full bg-primary/10 blur-[90px]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Count-up value — extracts the leading number ("55K+" -> 55 + "K+")  */
/* and animates it into place once the card scrolls into view.         */
/* ------------------------------------------------------------------ */

function splitStatValue(value: string) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return { number: null as number | null, suffix: value };
  return { number: Number(match[1]), suffix: match[2] };
}

function StatValue({ value }: { value: string }) {
  const { number, suffix } = useMemo(() => splitStatValue(value), [value]);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (number === null || !inView || reduce) return;
    const controls = animate(0, number, {
      duration: 1.5,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, number, reduce]);

  if (number === null) {
    return <span ref={ref}>{value}</span>;
  }

  return (
    <span ref={ref} dir="ltr" className="tabular-nums">
      {reduce ? number : display}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function StatsSection() {
  const { t } = useLang();
  const st = t.stats;

  return (
    <section className="relative isolate overflow-hidden rounded-xl py-16 sm:py-20 lg:py-24">
      {/* <StatsBackdrop /> */}

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
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {st.badge}
          </motion.span>

          <motion.h2
            variants={rise}
            custom={0.1}
            style={{ fontFamily: "var(--font-cairo), var(--font-sans), sans-serif" }}
            className="text-balance text-3xl font-black leading-[1.3] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
          >
            {st.title}{" "}
            <span className="relative inline-block bg-linear-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent rtl:bg-linear-to-l">
              {st.titleAccent}
            </span>
          </motion.h2>

          <motion.p
            variants={rise}
            custom={0.2}
            className="text-pretty text-[15px] leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            {st.subtitle}
          </motion.p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 xl:grid-cols-4">
          {st.items.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <span
                  aria-hidden
                  className="absolute -top-3 end-4 select-none text-6xl font-black leading-none text-foreground/[0.04] sm:text-7xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>

                <div className="mt-5 text-4xl font-extrabold tracking-tight text-foreground">
                  <StatValue value={item.value} />
                </div>

                <div className="mt-2 text-base font-bold text-foreground">
                  {item.title}
                </div>

                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
