"use client";

import { useLang } from "../_i18n/LanguageContext";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Star, ArrowLeft, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import HeroJourney from "./HeroJourney/HeroJourney";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.11, duration: 0.75, ease: EASE },
  }),
};

export default function Hero() {
  const { t } = useLang();
  const hr = t.hero;

  return (
    <section className="relative w-full overflow-visible">
      <div className="flex flex-col items-center gap-10 pt-10 pb-0">

        {/* ── Copy block ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-6 w-full mx-auto">

          {/* Badge */}
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/7 px-4 py-2 text-sm font-semibold text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              {hr.badge}
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-[2.6rem] leading-snug sm:text-[3.2rem] lg:text-[3.8rem] xl:text-[4.4rem] font-extrabold tracking-tight">
              <span className="block text-foreground">{hr.headline1}</span>
              <span className="block bg-linear-to-l from-primary to-sky-500 bg-clip-text text-transparent font-bold">
                {hr.headline2}
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-base lg:text-lg text-muted-foreground leading-[1.8] max-w-2xl"
          >
            {hr.subtitle}{" "}
            <span className="font-bold">كاشو</span>{" "}
            {hr.subtitleSuffix}
          </motion.p>

          {/* Feature pills */}
          <motion.ul
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-2.5"
          >
            {[hr.pills[0], hr.pills[1], hr.pills[2]].map((label) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground/80"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>

          {/* CTAs */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap justify-center items-center gap-3 pt-1"
          >
            <Button size="lg" className="h-[52px] px-8 text-[15px]" asChild>
              <Link href="/register">
                <span className="font-bold">{hr.ctaPrimary}</span>
                <ArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-[52px] px-8 text-[15px]"
              asChild
            >
              <Link href="#features">
                <span className="font-bold">{hr.ctaSecondary}</span>
                <Globe className="size-4 opacity-70" />
              </Link>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center justify-center gap-4 pt-1"
          >
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {["bg-rose-400", "bg-primary", "bg-emerald-400", "bg-blue-400", "bg-violet-400"].map(
                (color, i) => (
                  <div
                    key={i}
                    className={cn("size-8 rounded-full ring-2 ring-background", color)}
                  />
                ),
              )}
            </div>
            <div className="flex flex-col gap-0.5 text-start">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-primary text-primary" />
                ))}
                <span className="ms-1 text-xs font-bold text-foreground">٥.٠</span>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">+٥٬٠٠٠</span>{" "}
                {hr.socialProof}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Hero Journey Visual ─────────────────────────────────── */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
        >
          <HeroJourney />
        </motion.div>

      </div>
    </section>
  );
}
