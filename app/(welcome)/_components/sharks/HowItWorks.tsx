"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import Reveal from "../apple/Reveal";
import { useSharksCopy } from "./copy";

/**
 * Five steps on one line. As the section scrolls through, a brand line fills
 * and each node lights when the line reaches it — the journey advancing.
 * Horizontal from md, vertical on phones.
 */
export default function HowItWorks() {
  const c = useSharksCopy();
  const { lang } = useLang();
  const rtl = lang === "ar";
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  const fill = useTransform(scrollYProgress, (v) => (reduce ? 1 : v));
  const steps = c.how.steps;

  return (
    <section className="al-dark al-section" aria-labelledby="sharks-how-title">
      <Reveal className="al-container text-center">
        <p className="al-eyebrow">{c.how.eyebrow}</p>
        <h2 id="sharks-how-title" className="al-section-title mt-2 text-balance">
          {c.how.title}
        </h2>
      </Reveal>

      <div className="al-container-wide mt-16 md:mt-24">
        <ol ref={ref} className="relative grid gap-10 ps-10 md:grid-cols-5 md:gap-6 md:ps-0">
          {/* Track + fill: vertical on phones (inline-start edge), horizontal from md.
              Fill-driven styles carry suppressHydrationWarning: the server can't know
              about Reduce Motion, and framer-motion writes the real value on mount. */}
          <span aria-hidden className="absolute inset-y-1 w-px bg-white/12 inset-s-[7px] md:inset-x-[10%] md:inset-y-auto md:top-[7px] md:h-px md:w-auto" />
          <motion.span
            aria-hidden
            style={{ scaleY: fill }}
            suppressHydrationWarning
            className="absolute inset-y-1 w-px origin-top bg-[#5c8aff] inset-s-[7px] md:hidden"
          />
          <motion.span
            aria-hidden
            style={{ scaleX: fill, transformOrigin: rtl ? "100% 50%" : "0% 50%" }}
            suppressHydrationWarning
            className="absolute top-[7px] hidden h-px bg-[#5c8aff] md:inset-x-[10%] md:block"
          />
          {steps.map((step, i) => (
            <Step key={step.title} index={i} count={steps.length} progress={fill} title={step.title} body={step.body} selected={i === 2} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({
  index,
  count,
  progress,
  title,
  body,
  selected,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
  title: string;
  body: string;
  selected: boolean;
}) {
  // The line spans node centers: node i sits at i / (count - 1) of it.
  const at = index / (count - 1);
  const on = useTransform(progress, (v) => (v >= at - 0.001 ? 1 : 0));
  const dotBg = useTransform(on, (v) => (v ? "#5c8aff" : "#000"));
  const dotBorder = useTransform(on, (v) => (v ? "#5c8aff" : "rgba(255,255,255,0.3)"));
  const textOpacity = useTransform(on, (v) => (v ? 1 : 0.45));

  return (
    <li className="relative md:text-center">
      <motion.span
        aria-hidden
        style={{ backgroundColor: dotBg, borderColor: dotBorder }}
        suppressHydrationWarning
        className={cn(
          "absolute top-1 block size-[15px] rounded-full border transition-colors duration-300 -inset-s-10 md:relative md:inset-s-auto md:top-auto md:mx-auto md:mb-8",
          selected && "ring-4 ring-[#5c8aff]/25",
        )}
      />
      <motion.div style={{ opacity: textOpacity }} className="transition-opacity duration-300" suppressHydrationWarning>
        <p className="text-[13px] font-semibold tabular-nums text-(--al-faint)">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mt-1 text-[21px] font-semibold md:text-[24px]">{title}</h3>
        <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-relaxed text-(--al-muted) md:max-w-[220px]">{body}</p>
      </motion.div>
    </li>
  );
}
