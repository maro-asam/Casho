"use client";

import { useRef, useState } from "react";
import { Globe, ScanBarcode } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";

const START_STOCK = 48;
// Scroll progress at which each sale lands.
const THRESHOLDS = [0.3, 0.52, 0.74];

/**
 * Pinned, scroll-scrubbed section: as the visitor scrolls, a POS sale and an
 * online order each take one piece off the same stock counter.
 */
// Linear map with clamping. Function-form transforms keep framer-motion on the
// JS scroll path (its native ScrollTimeline path mis-tracks pinned sections).
function lerp(v: number, [i0, i1]: [number, number], [o0, o1]: [number, number]) {
  const t = Math.min(1, Math.max(0, (v - i0) / (i1 - i0)));
  return o0 + (o1 - o0) * t;
}

export default function SyncSection() {
  const c = useLandingCopy().sync;
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const headOpacity = useTransform(scrollYProgress, (v) => lerp(v, [0, 0.12], [reduce ? 1 : 0.35, 1]));
  const stageY = useTransform(scrollYProgress, (v) => lerp(v, [0, 0.2], [reduce ? 0 : 60, 0]));

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(THRESHOLDS.filter((t) => v >= t).length);
  });

  const shown = reduce ? THRESHOLDS.length : step;
  const stock = START_STOCK - shown;
  const lastChannel = shown > 0 ? c.events[shown - 1].channel : null;

  return (
    <section
      id="why"
      ref={ref}
      className={cn("al-section relative scroll-mt-0 py-0!", reduce ? "" : "h-[300vh]")}
    >
      <div className={cn("flex flex-col justify-center overflow-hidden py-16 md:py-24", reduce ? "" : "sticky top-0 min-h-svh")}>
        <motion.div style={{ opacity: headOpacity }} className="al-container text-center">
          <p className="al-eyebrow">{c.eyebrow}</p>
          <h2 className="al-section-title mx-auto mt-3 max-w-[860px] text-balance">
            <span className="block">{c.title1}</span>
            <span className="block">{c.title2}</span>
            <span className="al-gradient-text block">{c.title3}</span>
          </h2>
          <p className="al-subhead mx-auto mt-5 max-w-[600px] text-pretty">{c.subtitle}</p>
        </motion.div>

        <motion.div
          style={{ y: stageY }}
          className="al-container-wide mt-8 grid grid-cols-2 items-center gap-3 md:mt-16 md:grid-cols-[1fr_auto_1fr] md:gap-8"
        >
          <ChannelCard
            icon={ScanBarcode}
            title={c.pos}
            place={c.posPlace}
            badge={c.sale}
            waiting={c.waiting}
            events={c.events.filter((e, i) => e.channel === "pos" && i < shown)}
            active={lastChannel === "pos"}
            className="order-2 md:order-none"
          />

          <div className="order-1 col-span-2 flex flex-col items-center py-2 md:order-none md:col-span-1 md:px-6">
            <div className="relative grid size-36 place-items-center rounded-full bg-(--al-surface) ring-1 ring-(--al-hair) sm:size-56">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={stock}
                  initial={{ y: 28, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -28, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 30 }}
                  className="text-5xl font-bold tabular-nums sm:text-7xl"
                >
                  {stock}
                </motion.span>
              </AnimatePresence>
              <span className="absolute bottom-6 text-[12px] sm:text-[13px] text-(--al-muted) sm:bottom-12">{c.available}</span>
            </div>
            <p className="mt-4 text-[15px] font-semibold">{c.product}</p>
          </div>

          <ChannelCard
            icon={Globe}
            title={c.online}
            place={c.onlinePlace}
            badge={c.order}
            waiting={c.waiting}
            events={c.events.filter((e, i) => e.channel === "online" && i < shown)}
            active={lastChannel === "online"}
            className="order-3 md:order-none"
          />
        </motion.div>
      </div>
    </section>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  place,
  badge,
  waiting,
  events,
  active,
  className,
}: {
  icon: typeof Globe;
  title: string;
  place: string;
  badge: string;
  waiting: string;
  events: { label: string; amount: string }[];
  active: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "al-card min-h-[150px] rounded-[22px] p-4 ring-1 sm:min-h-[188px] sm:rounded-[28px] transition-[box-shadow] duration-500 sm:p-6",
        active ? "ring-(--al-tint)/60 shadow-[0_0_60px_-10px_rgba(20,71,230,0.35)]" : "ring-(--al-hair)",
        className,
      )}
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <span className="grid size-10 place-items-center rounded-xl bg-(--al-surface)">
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[17px] font-semibold">{title}</p>
          <p className="text-[13px] text-(--al-muted)" dir="auto">
            {place}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {events.map((e, i) => (
            <motion.li
              key={`${e.label}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-between gap-2 rounded-xl bg-(--al-surface) px-3 py-2.5 text-[12px] sm:text-[13px]"
            >
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-[#1a8a3e]/12 px-2 py-0.5 text-[11px] font-semibold text-[#1a8a3e] dark:text-[#30d158]">{badge}</span>
                <span className="hidden text-(--al-muted) sm:inline">{e.label}</span>
              </span>
              <span className="font-semibold tabular-nums">−1</span>
            </motion.li>
          ))}
        </AnimatePresence>
        {events.length === 0 ? <li className="px-1 py-2.5 text-[13px] text-(--al-muted)">{waiting}</li> : null}
      </ul>
    </div>
  );
}
