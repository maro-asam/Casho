"use client";

import Link from "next/link";
import { useRef } from "react";
import { Boxes, ChevronLeft, ChevronRight, ScanBarcode, ShoppingBag } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import { DashboardWindow, PosReceipt, StorefrontPhone } from "./Devices";

// Linear map with clamping. Function-form transforms keep framer-motion on the
// JS scroll path (its native ScrollTimeline path mis-tracks pinned sections).
function lerp(v: number, [i0, i1]: [number, number], [o0, o1]: [number, number]) {
  const t = Math.min(1, Math.max(0, (v - i0) / (i1 - i0)));
  return o0 + (o1 - o0) * t;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const CHIPS = [
  { icon: ShoppingBag, tone: "bg-[#1447e6]", at: 0.5, className: "-top-[11%] inset-s-[23%] sm:-top-[7%] sm:inset-s-[8%]" },
  { icon: ScanBarcode, tone: "bg-[#1a8a3e]", at: 0.6, className: "bottom-[6%] inset-s-[23%] sm:bottom-[10%] sm:inset-s-[18%]" },
  { icon: Boxes, tone: "bg-[#e0483a]", at: 0.7, className: "hidden sm:flex -top-[7%] inset-e-[26%]" },
];

/**
 * Pinned, scroll-driven product reveal (Apple launch-page style):
 * the headline lifts away while the dashboard tilts flat, the phone and POS
 * receipt slide in from the sides, and live notifications pop over it.
 */
export default function AppleHero() {
  const c = useLandingCopy().hero;
  const { lang } = useLang();
  const rtl = lang === "ar";
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const reduce = !!useReducedMotion();

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Under Reduce Motion everything sits at its final state (text stays visible).
  const at = (v: number) => (reduce ? 1 : v);
  const textY = useTransform(p, (v) => (reduce ? 0 : lerp(v, [0, 0.38], [0, -160])));
  const textOpacity = useTransform(p, (v) => (reduce ? 1 : lerp(v, [0.04, 0.32], [1, 0])));
  const textScale = useTransform(p, (v) => (reduce ? 1 : lerp(v, [0, 0.38], [1, 0.92])));
  const productY = useTransform(p, (v) => `${lerp(at(v), [0, 0.5], [58, 0])}svh`);
  const rotateX = useTransform(p, (v) => lerp(at(v), [0, 0.5], [32, 0]));
  const scale = useTransform(p, (v) => lerp(at(v), [0, 0.5], [0.78, 1]));
  const sideOpacity = useTransform(p, (v) => lerp(at(v), [0.28, 0.5], [0, 1]));
  const phoneX = useTransform(p, (v) => lerp(at(v), [0.28, 0.58], [rtl ? -220 : 220, 0]));
  const receiptX = useTransform(p, (v) => lerp(at(v), [0.28, 0.58], [rtl ? 220 : -220, 0]));
  const receiptRotate = useTransform(p, (v) => lerp(at(v), [0.28, 0.58], [rtl ? 14 : -14, rtl ? 5 : -5]));
  const glow = useTransform(p, (v) => lerp(at(v), [0, 0.5], [0.45, 1]));
  const captionOpacity = useTransform(p, (v) => lerp(at(v), [0.78, 0.9], [0, 1]));
  const captionY = useTransform(p, (v) => lerp(at(v), [0.78, 0.9], [16, 0]));

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 36, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 1.1, delay, ease: EASE },
        };

  return (
    <section ref={ref} className="relative bg-(--al-bg)" style={{ height: reduce ? undefined : "270vh" }}>
      <div className={cn("overflow-hidden", reduce ? "relative pb-32 pt-32" : "sticky top-0 h-svh")}>
        {/* Light behind the product */}
        <motion.div style={{ opacity: glow }} aria-hidden className="pointer-events-none absolute inset-0">
          <div className="al-aurora absolute left-1/2 top-[62%] h-[80vmin] w-[110vmin] rounded-full bg-[radial-gradient(closest-side,rgba(20,71,230,0.16),transparent)] dark:bg-[radial-gradient(closest-side,rgba(51,102,255,0.45),transparent)]" />
          <div className="al-aurora-2 absolute left-[42%] top-[56%] h-[60vmin] w-[80vmin] rounded-full bg-[radial-gradient(closest-side,rgba(92,138,255,0.14),transparent)] dark:bg-[radial-gradient(closest-side,rgba(20,71,230,0.4),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-(--al-surface) to-transparent opacity-70 dark:opacity-0" />
        </motion.div>

        {/* Headline */}
        <motion.div
          style={{ y: textY, opacity: textOpacity, scale: textScale }}
          className={cn("al-container z-10 text-center", reduce ? "relative" : "absolute inset-x-0 top-0 pt-28 md:pt-32")}
        >
          <motion.p {...enter(0.05)} className="al-eyebrow">
            {c.eyebrow}
          </motion.p>
          <h1 className="al-hero-xl mt-2 text-balance">
            <motion.span {...enter(0.15)} className="block">
              {c.title1}
            </motion.span>
            <motion.span {...enter(0.3)} className="al-gradient-text block pb-2">
              {c.title2}
            </motion.span>
          </h1>
          <motion.p {...enter(0.45)} className="al-subhead mx-auto mt-4 max-w-[600px] text-pretty">
            {c.subtitle}
          </motion.p>
          <motion.div {...enter(0.6)} className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <Link href="/register" className="al-btn al-btn-filled">
              {c.cta}
            </Link>
            <Link href="#pricing" className="al-link">
              {c.secondary}
              <Chevron className="size-4" strokeWidth={2} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Product composition */}
        <div
          className={cn(
            "flex justify-center px-[5vw] [perspective:1800px]",
            reduce ? "relative mt-20" : "absolute inset-0 items-center",
          )}
        >
          <motion.div
            {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.4, delay: 0.5, ease: EASE } })}
            style={{ y: productY, rotateX, scale, transformOrigin: "50% 0%" }}
            // On phones the dashboard is shown wider than the screen and cropped, so it stays legible.
            className="relative w-[175%] max-w-none shrink-0 sm:w-full sm:max-w-[980px]"
          >
            <DashboardWindow className="shadow-[0_40px_100px_-30px_rgba(20,71,230,0.35),0_20px_40px_-20px_rgba(0,0,0,0.18)] dark:shadow-[0_40px_120px_-20px_rgba(51,102,255,0.5)]" />

            <motion.div
              style={{ x: receiptX, rotate: receiptRotate, opacity: sideOpacity }}
              className="absolute top-[44%] hidden w-[18%] max-w-[190px] inset-s-[-8%] md:block"
            >
              <PosReceipt />
            </motion.div>

            <motion.div
              style={{ x: phoneX, opacity: sideOpacity }}
              className="absolute -bottom-[14%] w-[19%] max-w-[230px] inset-e-[23%] sm:-bottom-[12%] sm:w-[25%] sm:inset-e-[-5%]"
            >
              <StorefrontPhone />
            </motion.div>

            {CHIPS.map((chip, i) => (
              <Chip
                key={i}
                progress={p}
                at={reduce ? 0 : chip.at}
                icon={chip.icon}
                tone={chip.tone}
                title={c.chips[i].title}
                sub={c.chips[i].sub}
                className={chip.className}
              />
            ))}
          </motion.div>
        </div>

        <motion.p
          style={{ opacity: captionOpacity, y: captionY }}
          className={cn(
            "inset-x-0 z-10 px-6 text-center text-[17px] font-semibold text-(--al-muted) md:text-[21px]",
            reduce ? "relative mt-28" : "absolute bottom-[6svh]",
          )}
        >
          {c.caption}
        </motion.p>
      </div>
    </section>
  );
}

function Chip({
  progress,
  at,
  icon: Icon,
  tone,
  title,
  sub,
  className,
}: {
  progress: MotionValue<number>;
  at: number;
  icon: typeof ShoppingBag;
  tone: string;
  title: string;
  sub: string;
  className?: string;
}) {
  const opacity = useTransform(progress, (v) => lerp(v, [at, at + 0.06], [0, 1]));
  const y = useTransform(progress, (v) => lerp(v, [at, at + 0.08], [18, 0]));
  const scale = useTransform(progress, (v) => lerp(v, [at, at + 0.08], [0.92, 1]));

  return (
    <motion.div
      aria-hidden
      style={{ opacity, y, scale }}
      className={cn(
        "absolute z-20 flex items-center gap-2.5 rounded-[18px] bg-white/85 py-2 pe-4 ps-2 text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-black/5 backdrop-blur-xl sm:gap-3 sm:py-2.5 sm:ps-2.5",
        className,
      )}
    >
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] text-white sm:size-9", tone)}>
        <Icon className="size-4 sm:size-[18px]" strokeWidth={2} />
      </span>
      <span className="leading-tight">
        <span className="block text-[12px] font-semibold sm:text-[13px]">{title}</span>
        <span className="block text-[11px] text-black/55 sm:text-[12px]" dir="auto">
          {sub}
        </span>
      </span>
    </motion.div>
  );
}
