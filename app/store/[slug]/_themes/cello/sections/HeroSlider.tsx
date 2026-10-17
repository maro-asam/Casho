"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";

const INTERVAL = 6000;
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Cello's full-width slideshow: one banner per slide with the copy on the
 *  start side, and a centered control bar (previous, dots, next, pause) at
 *  the bottom. Autoplays only when motion is allowed, pauses on hover/focus
 *  and while the tab is hidden. Swipe on touch. */
export default function HeroSlider({ banners, storeSlug, storeName }: { banners: BannerData[]; storeSlug: string; storeName: string }) {
  const [index, setIndex] = useState(0);
  const reduced = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
  const [paused, setPaused] = useState(false);
  const playing = !paused && !reduced;
  const [hold, setHold] = useState(false);
  const touch = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing || hold || count < 2) return;
    const id = setTimeout(() => {
      if (document.visibilityState === "visible") go(index + 1);
    }, INTERVAL);
    return () => clearTimeout(id);
  }, [playing, hold, index, count, go]);

  const step = (d: 1 | -1) => go(index + d);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="العروض الرئيسية"
      className="relative overflow-hidden bg-(--ce-navy) text-white"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) < 40) return;
        const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
        step((dx < 0) !== rtl ? 1 : -1);
      }}
    >
      <div className="relative h-[26rem] sm:h-[28rem] lg:h-[clamp(28rem,36.5vw,40rem)]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} من ${count}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className={cn("absolute inset-0 transition-opacity duration-700 ease-out", i === index ? "z-[1] opacity-100" : "opacity-0")}
          >
            <BannerImage banner={b} priority={i === 0} sizes="100vw" className={cn("object-cover transition-transform duration-[7000ms] ease-out", i === index && "motion-safe:scale-[1.03]")} />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_left,rgb(0_16_48/0.7),rgb(0_16_48/0.1)_65%)] ltr:bg-[linear-gradient(to_right,rgb(0_16_48/0.7),rgb(0_16_48/0.1)_65%)]" />
            <div className="ce-wrap relative flex h-full flex-col items-start justify-center pb-14">
              <p className="text-sm text-white/85">{storeName}</p>
              <h2 className="ce-hero mt-3 max-w-[18ch] text-balance text-white">{b.title}</h2>
              {b.subtitle && <p className="mt-3 line-clamp-2 max-w-[48ch] text-base text-white/85">{b.subtitle}</p>}
              {b.link && (
                <BannerLink banner={b} storeSlug={storeSlug} className="ce-btn ce-btn--white mt-7 bg-white/90 backdrop-blur-sm">
                  {b.cta}
                  <ChevronLeft className="ltr:rotate-180" />
                </BannerLink>
              )}
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-5 z-[2] flex items-center justify-center gap-3">
          <button type="button" onClick={() => step(-1)} aria-label="الشريحة السابقة" className="ce-icon size-9 text-white [&_svg]:size-4">
            <ChevronRight className="ltr:rotate-180" />
          </button>
          <div className="flex items-center gap-1">
            {banners.map((b, i) => (
              <button key={b.id} type="button" onClick={() => go(i)} aria-label={`الشريحة ${i + 1}`} aria-current={i === index} className="grid h-9 place-items-center px-1">
                <span className={cn("block h-2.5 rounded-full border border-white transition-all duration-300", i === index ? "w-7 bg-white" : "w-2.5")} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => step(1)} aria-label="الشريحة التالية" className="ce-icon size-9 text-white [&_svg]:size-4">
            <ChevronLeft className="ltr:rotate-180" />
          </button>
          <button type="button" onClick={() => setPaused(playing)} aria-label={playing ? "إيقاف التشغيل التلقائي" : "تشغيل تلقائي"} className="ce-icon size-9 text-white [&_svg]:size-4">
            {playing ? <Pause /> : <Play />}
          </button>
        </div>
      )}
    </section>
  );
}
