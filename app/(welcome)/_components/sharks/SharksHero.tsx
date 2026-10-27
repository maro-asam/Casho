"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useSharksCopy } from "./copy";
import { SharksMark } from "./Glyphs";
import SharksLens from "./SharksLens";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Dark launch hero: one claim beside one object — a lens over the field of
 * Casho businesses, one of them selected. The section is taller than the
 * screen and its stage stays pinned while the reader scrolls through it: the
 * claim steps back and the camera moves in on the lens.
 * Short screens and Reduce Motion get a plain, unpinned hero.
 */
export default function SharksHero({ open }: { open: boolean }) {
  const c = useSharksCopy();
  const reduce = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);

  // 0 when the stage pins, 1 when it lets go. Zero when there's nothing to scrub.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const span = rect.height - stage.offsetHeight;
      progress.set(span > 1 ? Math.min(1, Math.max(0, -rect.top / span)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [progress]);

  const textOpacity = useTransform(progress, [0, 0.4], [1, 0]);
  const textY = useTransform(progress, [0, 0.5], [0, -56]);
  // Hidden once faded, so invisible links can't take focus or clicks.
  const textVisibility = useTransform(progress, (v) => (v > 0.42 ? "hidden" : "visible"));
  // The close-up's caption arrives as the lens lands.
  const closerOpacity = useTransform(progress, [0.55, 0.85], [0, 1]);
  const closerY = useTransform(progress, [0.55, 0.85], [24, 0]);

  // Same initial/animate on server and client (so hydration matches); Reduce
  // Motion only makes the entrance instant.
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 28, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: reduce ? { duration: 0 } : { duration: 1.1, delay, ease: EASE },
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="sharks-hero-title"
      className="al-dark relative h-[180svh] motion-reduce:h-auto [@media(max-height:559px)]:h-auto"
    >
      <div ref={stageRef} className="sticky top-0 isolate h-svh min-h-[560px] overflow-hidden">
        <SharksLens progress={progress} anchorRef={lensRef} className="absolute inset-0 -z-10" />

        <div className="al-container-wide grid h-full content-start gap-8 pt-[clamp(108px,16svh,150px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:content-center lg:items-center lg:gap-12 lg:pt-12">
          <motion.div style={{ opacity: textOpacity, y: textY, visibility: textVisibility }} className="text-center lg:text-start">
            <motion.p {...enter(0.1)} className="sk-eyebrow inline-flex items-center gap-2 text-[#5c8aff]">
              <SharksMark className="text-[18px]" />
              <span className="text-(--al-text)">{c.mark}</span>
            </motion.p>
            <h1 id="sharks-hero-title" className="sk-hero-title mt-4 text-balance">
              <motion.span {...enter(0.25)} className="block">
                {c.hero.title1}
              </motion.span>
              <motion.span {...enter(0.4)} className="al-gradient-text block pb-2">
                {c.hero.title2}
              </motion.span>
            </h1>
            <motion.p {...enter(0.6)} className="al-subhead mx-auto mt-5 max-w-[500px] text-pretty lg:mx-0">
              {c.hero.subtitle}
            </motion.p>
            <motion.div {...enter(0.75)} className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 lg:justify-start">
              {open ? (
                <Link href="/sharks/apply" className="al-btn al-btn-filled">
                  {c.hero.apply}
                </Link>
              ) : (
                <span className="text-[15px] text-(--al-muted)">{c.hero.closed}</span>
              )}
              <Link href="#selected" className="al-link">
                {c.hero.meet}
                <ChevronDown className="size-4" strokeWidth={2} />
              </Link>
            </motion.div>
          </motion.div>

          <div ref={lensRef} aria-hidden className="mx-auto aspect-square w-[min(80vw,360px)] lg:w-[min(100%,64svh,540px)]" />
        </div>

        <motion.p
          style={{ opacity: closerOpacity, y: closerY }}
          className="al-container pointer-events-none absolute inset-x-0 top-[min(calc(var(--sk-lens-end,80%)_+_28px),calc(100%_-_120px))] text-center motion-reduce:hidden [@media(max-height:559px)]:hidden"
        >
          <span className="block text-[clamp(21px,2.4vw,32px)] font-semibold leading-snug text-balance">{c.hero.closer1}</span>
          <span className="al-subhead mt-1 block text-balance">{c.hero.closer2}</span>
        </motion.p>
      </div>
    </section>
  );
}
