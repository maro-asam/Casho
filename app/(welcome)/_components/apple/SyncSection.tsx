"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";
import SectionHead from "./SectionHead";

const START_STOCK = 48;
// Scroll progress (through the pinned stretch) at which each sale lands.
const THRESHOLDS = [0.12, 0.36, 0.6, 0.84];
const EASE = [0.16, 1, 0.3, 1] as const;

type Channel = "pos" | "online";
type SyncEvent = { channel: string; title: string; meta: string };

/**
 * "One number across two worlds." A panel split into the shop (dark) and the
 * online store (light), with one stock number sitting on the seam between
 * them — drawn twice and clipped, so each half shows it in its own ink. While
 * the panel is pinned, scrolling rings up sales on both sides and the same
 * number counts down.
 */
export default function SyncSection() {
  const c = useLandingCopy().sync;
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(THRESHOLDS.filter((t) => v >= t).length);
  });

  const shown = reduce ? c.events.length : step;
  const stock = START_STOCK - shown;
  const happened = c.events.slice(0, shown);
  const last = (happened.at(-1)?.channel ?? null) as Channel | null;

  return (
    <section id="why" aria-labelledby="sync-title" className="al-section al-section-surface scroll-mt-16">
      <SectionHead id="sync-title" eyebrow={c.eyebrow} title={c.title} accent={c.accent} subtitle={c.subtitle} />

      <div ref={trackRef} className={cn("al-body", reduce ? null : "h-[240svh]")}>
        <div className={cn("ss-pin", reduce ? null : "is-pinned")}>
          <div className="al-container-wide">
            <div className="ss">
              <Half
                channel="pos"
                name={c.pos}
                place={c.posPlace}
                waiting={c.waitingPos}
                piece={c.piece}
                events={happened.filter((e) => e.channel === "pos")}
                live={last === "pos"}
              />
              <Half
                channel="online"
                name={c.online}
                place={c.onlinePlace}
                waiting={c.waitingOnline}
                piece={c.piece}
                events={happened.filter((e) => e.channel === "online")}
                live={last === "online"}
              />

              {/* The shared number: one copy per half, each clipped to its side. */}
              <div className="ss-count" aria-hidden>
                <Figure on="dark" stock={stock} available={c.available} product={c.product} />
                <Figure on="light" stock={stock} available={c.available} product={c.product} />
              </div>
              <p className="sr-only" aria-live="polite">
                {stock} {c.available} · {c.product}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Half({
  channel,
  name,
  place,
  waiting,
  piece,
  events,
  live,
}: {
  channel: Channel;
  name: string;
  place: string;
  waiting: string;
  piece: string;
  events: SyncEvent[];
  live: boolean;
}) {
  return (
    <div className="ss-half" data-channel={channel}>
      <div>
        <p className="ss-name">
          <span className={cn("ss-dot", live && "is-live")} aria-hidden />
          {name}
        </p>
        <p className="ss-place">
          <bdi>{place}</bdi>
        </p>
      </div>

      <ul className="ss-feed">
        <AnimatePresence initial={false}>
          {[...events].reverse().map((e, i) => (
            <motion.li
              key={e.meta}
              layout="position"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: i === 0 ? 1 : 0.5, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="ss-event"
            >
              <span className="ss-event-title">{e.title}</span>
              <span className="ss-event-meta">
                {e.meta} · {piece}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
        {events.length === 0 ? <li className="ss-event ss-event-meta">{waiting}</li> : null}
      </ul>
    </div>
  );
}

function Figure({ on, stock, available, product }: { on: "dark" | "light"; stock: number; available: string; product: string }) {
  return (
    <div className="ss-layer" data-on={on}>
      <div className="ss-figure">
        <span className="ss-num" dir="ltr">
          <AnimatePresence initial={false}>
            <motion.span
              key={stock}
              initial={{ y: "70%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-70%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
            >
              {stock}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="ss-caption">
          <span className="ss-caption-main">{available}</span>
          <span className="ss-caption-sub">{product}</span>
        </span>
      </div>
    </div>
  );
}
