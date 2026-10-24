"use client";

import Link from "next/link";
import { lazy, Suspense, useRef, useState, useSyncExternalStore } from "react";
import { Boxes, ChevronLeft, ChevronRight, ScanBarcode, ShoppingBag } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import { BrowserFrame, PhoneFrame, PhoneStatusBar, PosReceipt, StorefrontPhone } from "./Devices";

// The real dashboard components (+ recharts) load after the headline paints.
const DashboardScreen = lazy(() => import("./DashboardPreview"));

// Linear map with clamping. Function-form transforms keep framer-motion on the
// JS scroll path (its native ScrollTimeline path mis-tracks pinned sections).
function lerp(v: number, [i0, i1]: [number, number], [o0, o1]: [number, number]) {
  const t = Math.min(1, Math.max(0, (v - i0) / (i1 - i0)));
  return o0 + (o1 - o0) * t;
}

const EASE = [0.16, 1, 0.3, 1] as const;

// The first two chips are also orders landing in the dashboard (online, then the POS receipt).
const CHIPS = [
  { icon: ShoppingBag, tone: "bg-[#1447e6]", at: 0.46, className: "-top-[7%] inset-s-[8%]", phone: "top-[12%] inset-s-[-30%]" },
  { icon: ScanBarcode, tone: "bg-[#1a8a3e]", at: 0.56, className: "bottom-[10%] inset-s-[18%]", phone: "top-[44%] inset-e-[-32%]" },
  { icon: Boxes, tone: "bg-[#e0483a]", at: 0.66, className: "-top-[7%] inset-e-[26%]", phone: "bottom-[12%] inset-s-[-26%]" },
];

// Real phone width for the dashboard below the `sm` breakpoint.
const PHONE = { width: 390, height: 844 };
const MAX_DESKTOP_WIDTH = 1440;

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

/** Viewport width (0 while server rendering), read the way media queries see it. */
function useViewportWidth() {
  return useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 0);
}

/**
 * Pinned, scroll-driven product reveal (Apple launch-page style):
 * the headline lifts away while the real dashboard tilts flat, the phone and
 * POS receipt slide in from the sides, live orders pop over it and land in the
 * dashboard, then the page scrolls inside the window.
 *
 * The dashboard is laid out at the visitor's own viewport width, so its
 * breakpoints match what a merchant sees on that screen; below `sm` it moves
 * into a phone.
 */
export default function AppleHero() {
  const copy = useLandingCopy();
  const c = copy.hero;
  const { lang } = useLang();
  const rtl = lang === "ar";
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const reduce = !!useReducedMotion();

  const vw = useViewportWidth();
  const phone = vw > 0 && vw < 640;
  const desktopWidth = Math.min(vw, MAX_DESKTOP_WIDTH);
  const desktopHeight = Math.round(desktopWidth * (vw >= 1024 ? 0.625 : 0.75));

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Under Reduce Motion everything sits at its final state (text stays visible).
  const at = (v: number) => (reduce ? 1 : v);
  const textY = useTransform(p, (v) => (reduce ? 0 : lerp(v, [0, 0.32], [0, -160])));
  const textOpacity = useTransform(p, (v) => (reduce ? 1 : lerp(v, [0.03, 0.26], [1, 0])));
  const textScale = useTransform(p, (v) => (reduce ? 1 : lerp(v, [0, 0.32], [1, 0.92])));
  const productY = useTransform(p, (v) => `${lerp(at(v), [0, 0.42], [58, 0])}svh`);
  const rotateX = useTransform(p, (v) => lerp(at(v), [0, 0.42], [32, 0]));
  const scale = useTransform(p, (v) => lerp(at(v), [0, 0.42], [0.78, 1]));
  const sideOpacity = useTransform(p, (v) => lerp(at(v), [0.24, 0.42], [0, 1]));
  const phoneX = useTransform(p, (v) => lerp(at(v), [0.24, 0.5], [rtl ? -220 : 220, 0]));
  const receiptX = useTransform(p, (v) => lerp(at(v), [0.24, 0.5], [rtl ? 220 : -220, 0]));
  const receiptRotate = useTransform(p, (v) => lerp(at(v), [0.24, 0.5], [rtl ? 14 : -14, rtl ? 5 : -5]));
  const glow = useTransform(p, (v) => lerp(at(v), [0, 0.42], [0.45, 1]));
  // Reduce Motion keeps the page at its top; everything else sits at the end.
  const screenScroll = useTransform(p, (v) => (reduce ? 0 : lerp(v, [0.5, 0.86], [0, 1])));
  const captionOpacity = useTransform(p, (v) => lerp(at(v), [0.86, 0.94], [0, 1]));
  const captionY = useTransform(p, (v) => lerp(at(v), [0.86, 0.94], [16, 0]));

  // Orders that have arrived so far — each one lands with its chip.
  const liveAt = (v: number) => CHIPS.slice(0, 2).filter((chip) => v >= chip.at).length;
  const [live, setLive] = useState(() => (reduce ? 2 : 0));
  useMotionValueEvent(p, "change", (v) => setLive(liveAt(at(v))));

  const screen = (
    <Suspense fallback={null}>
      <DashboardScreen lang={lang} storeName={copy.mock.storeName} scroll={screenScroll} live={reduce ? 2 : live} />
    </Suspense>
  );

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 36, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 1.1, delay, ease: EASE },
        };

  return (
    <section ref={ref} className="relative bg-(--al-bg)" style={{ height: reduce ? undefined : "340vh" }}>
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
          {vw > 0 && (
            <motion.div
              {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.4, delay: 0.5, ease: EASE } })}
              style={{ y: productY, rotateX, scale, transformOrigin: "50% 0%" }}
              className={cn("relative shrink-0", phone ? "w-[60vw] max-w-[290px]" : "w-full max-w-[980px]")}
            >
              {phone ? (
                <PhoneFrame width={PHONE.width} height={PHONE.height} screenClassName="bg-transparent">
                  <div className="apple-ui relative flex h-full flex-col bg-background text-foreground">
                    <PhoneStatusBar />
                    <div className="relative min-h-0 flex-1">{screen}</div>
                  </div>
                </PhoneFrame>
              ) : (
                <BrowserFrame
                  width={desktopWidth}
                  height={desktopHeight}
                  className="shadow-[0_40px_100px_-30px_rgba(20,71,230,0.35),0_20px_40px_-20px_rgba(0,0,0,0.18)] dark:shadow-[0_40px_120px_-20px_rgba(51,102,255,0.5)]"
                >
                  {screen}
                </BrowserFrame>
              )}

              {!phone && (
                <motion.div
                  style={{ x: receiptX, rotate: receiptRotate, opacity: sideOpacity }}
                  className="absolute top-[44%] hidden w-[18%] max-w-[190px] inset-s-[-8%] md:block"
                >
                  <PosReceipt />
                </motion.div>
              )}

              {/* On phones the storefront peeks out from behind the dashboard phone. */}
              <motion.div
                style={{ x: phoneX, opacity: sideOpacity }}
                className={cn(
                  "absolute",
                  phone ? "-z-10 top-[16%] w-[74%] inset-e-[-52%]" : "-bottom-[12%] w-[25%] max-w-[230px] inset-e-[-5%]",
                )}
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
                  className={phone ? chip.phone : chip.className}
                />
              ))}
            </motion.div>
          )}
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
