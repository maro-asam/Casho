"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { CreditCard, Package, ShoppingBag, Store, Truck } from "lucide-react";
import { useLang } from "../_i18n/LanguageContext";

/** Launch moment — midnight Cairo time. */
const LAUNCH_AT = new Date("2026-10-20T00:00:00+03:00").getTime();

const COPY = {
  ar: {
    badge: "قريبًا",
    brand: "كاشو",
    title: "جاي قريب",
    subtitle: "منصة جديدة تعمل بيها متجرك أونلاين في دقايق. استنونا!",
    launched: "كاشو اتطلق! حدّث الصفحة.",
    launchOn: "الإطلاق",
    units: { days: "يوم", hours: "ساعة", minutes: "دقيقة", seconds: "ثانية" },
  },
  en: {
    badge: "Coming soon",
    brand: "Casho",
    title: "is launching soon",
    subtitle: "A new platform to get your store online in minutes. Stay tuned!",
    launched: "Casho is live! Refresh the page.",
    launchOn: "Launching",
    units: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
  },
} as const;

/** Icons that orbit the logo — everything a merchant gets in one place. */
const ORBIT = [
  { Icon: Store, angle: 0 },
  { Icon: ShoppingBag, angle: 72 },
  { Icon: CreditCard, angle: 144 },
  { Icon: Truck, angle: 216 },
  { Icon: Package, angle: 288 },
];
const ORBIT_SECONDS = 40;

function getRemaining() {
  const diff = Math.max(0, LAUNCH_AT - Date.now());
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.1, duration: 0.6, ease: EASE_OUT } }),
};

export function ComingSoon() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const reduceMotion = useReducedMotion();
  // Rendered only after mount so server and client markup match.
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(getRemaining());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const number = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });
  const launchDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(LAUNCH_AT);
  const units = (["days", "hours", "minutes", "seconds"] as const).map((key) => ({
    key,
    label: copy.units[key],
    value: remaining ? number.format(remaining[key]) : "--",
  }));

  const spin = reduceMotion ? undefined : { rotate: 360 };
  const counterSpin = reduceMotion ? undefined : { rotate: -360 };
  const spinTransition = { duration: ORBIT_SECONDS, ease: "linear", repeat: Infinity } as const;

  return (
    <section className="relative isolate mt-4 flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] px-4 py-16 text-center my-20">
      {/* Backdrop: dotted grid faded at the edges + two soft brand glows */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div aria-hidden className="absolute -top-32 left-1/2 -z-10 size-[34rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div aria-hidden className="absolute -bottom-40 -right-20 -z-10 size-80 rounded-full bg-sky-400/20 blur-[100px]" />

      {/* Logo stage */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        className="relative grid size-64 place-items-center [--r:7.25rem] sm:size-80 sm:[--r:9.25rem]"
      >
        <div aria-hidden className="absolute inset-0 rounded-full border border-primary/15" />
        <motion.div
          aria-hidden
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={{ ...spinTransition, duration: ORBIT_SECONDS * 1.5 }}
          className="absolute inset-10 rounded-full border border-dashed border-primary/30 sm:inset-12"
        />

        {/* Orbiting merchant icons, kept upright by counter-rotating each chip */}
        <motion.div aria-hidden animate={spin} transition={spinTransition} className="absolute inset-0">
          {ORBIT.map(({ Icon, angle }) => (
            <div
              key={angle}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${angle}deg) translateY(calc(var(--r) * -1)) rotate(${-angle}deg)` }}
            >
              <motion.div
                animate={counterSpin}
                transition={spinTransition}
                className="-ms-5 -mt-5 grid size-10 place-items-center rounded-xl border bg-background/80 text-primary shadow-md backdrop-blur"
              >
                <Icon className="size-5" />
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Logo with a breathing halo */}
        <div className="relative">
          <motion.div
            aria-hidden
            animate={reduceMotion ? undefined : { scale: [1, 1.35], opacity: [0.45, 0] }}
            transition={{ duration: 2.4, ease: "easeOut", repeat: Infinity }}
            className="absolute inset-0 rounded-[1.75rem] bg-primary"
          />
          <Image
            src="/logo.svg"
            width={112}
            height={112}
            alt="Casho"
            priority
            className="relative size-24 rounded-[1.75rem] shadow-[0_20px_60px_-10px] shadow-primary/60 ring-4 ring-background sm:size-28"
          />
        </div>
      </motion.div>

      {/* Copy */}
      <motion.span
        variants={rise}
        initial="hidden"
        animate="show"
        custom={0}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        {copy.badge}
      </motion.span>

      <motion.h1
        variants={rise}
        initial="hidden"
        animate="show"
        custom={1}
        className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
      >
        <span className="bg-gradient-to-l from-primary to-sky-500 bg-clip-text font-extrabold text-transparent">
          {copy.brand}
        </span>{" "}
        <span className="font-extrabold">{copy.title}</span>
      </motion.h1>

      <motion.p
        variants={rise}
        initial="hidden"
        animate="show"
        custom={2}
        className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg"
      >
        {copy.subtitle}
      </motion.p>

      {/* Countdown */}
      <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-10">
        {remaining?.done ? (
          <p className="text-lg font-semibold text-primary">{copy.launched}</p>
        ) : (
          <>
            <div className="flex items-start gap-2 sm:gap-3">
              {units.map((unit, i) => (
                <div key={unit.key} className="flex items-start gap-2 sm:gap-3">
                  {i > 0 && (
                    <span aria-hidden className="pt-3 text-2xl font-bold text-primary/40 sm:pt-5 sm:text-3xl">
                      :
                    </span>
                  )}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border bg-card/70 shadow-sm backdrop-blur sm:h-24 sm:w-24">
                      <div aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/10 to-transparent" />
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={unit.value}
                          initial={reduceMotion ? false : { y: "-60%", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={reduceMotion ? undefined : { y: "60%", opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE_OUT }}
                          className="relative text-2xl font-bold tabular-nums sm:text-4xl"
                        >
                          {unit.value}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground sm:text-sm">{unit.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {copy.launchOn} <span className="font-semibold text-foreground">{launchDate}</span>
            </p>
          </>
        )}
      </motion.div>
    </section>
  );
}
