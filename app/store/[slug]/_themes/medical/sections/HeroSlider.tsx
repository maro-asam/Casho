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

/** Banner slideshow. `full` spans the page; `contained` is a rounded card
 *  inside the page width (split / compact hero). The copy sits on the start
 *  side over the merchant's hero overlay. Autoplays only when motion is
 *  allowed, pauses on hover/focus and while the tab is hidden; swipe on touch. */
export default function HeroSlider({
  banners,
  storeSlug,
  variant,
  height,
}: {
  banners: BannerData[];
  storeSlug: string;
  variant: "full" | "contained";
  /** Height classes for the slide area. */
  height: string;
}) {
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
      className={cn("relative h-full overflow-hidden bg-(--rx-deep) text-white", variant === "contained" && "rounded-(--rx-r-lg)")}
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
      <div className={cn("relative", height)}>
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
            <BannerImage banner={b} priority={i === 0} sizes={variant === "full" ? "100vw" : "(max-width: 1024px) 100vw, 66vw"} className={cn("object-cover transition-transform duration-[7000ms] ease-out", i === index && "motion-safe:scale-[1.03]")} />
            {(b.title || b.subtitle || b.link) && <span aria-hidden className="absolute inset-0" style={{ background: "var(--store-hero-overlay)" }} />}
            <div className={cn("relative flex h-full flex-col items-start justify-center pb-12", variant === "full" ? "rx-wrap" : "px-6 sm:px-10")}>
              {b.title && <h2 className="rx-hero max-w-[17ch] text-balance !text-white">{b.title}</h2>}
              {b.subtitle && <p className="mt-3 line-clamp-2 max-w-[46ch] text-[0.9375rem] text-white/90 sm:text-base">{b.subtitle}</p>}
              {b.link && (
                <BannerLink banner={b} storeSlug={storeSlug} className="rx-btn rx-btn--white rx-btn--lg mt-6">
                  {b.cta}
                  <ChevronLeft className="ltr:rotate-180" />
                </BannerLink>
              )}
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className={cn("absolute bottom-4 z-[2] flex items-center gap-1 rounded-full bg-black/25 px-1.5 backdrop-blur-sm", variant === "full" ? "inset-x-0 mx-auto w-fit" : "start-6 sm:start-10")}>
          <button type="button" onClick={() => step(-1)} aria-label="الشريحة السابقة" className="rx-icon size-8 text-white [&_svg]:size-4">
            <ChevronRight className="ltr:rotate-180" />
          </button>
          {banners.map((b, i) => (
            <button key={b.id} type="button" onClick={() => go(i)} aria-label={`الشريحة ${i + 1}`} aria-current={i === index} className="grid h-8 place-items-center px-0.5">
              <span className={cn("block h-2 rounded-full transition-all duration-300", i === index ? "w-6 bg-white" : "w-2 bg-white/55")} />
            </button>
          ))}
          <button type="button" onClick={() => step(1)} aria-label="الشريحة التالية" className="rx-icon size-8 text-white [&_svg]:size-4">
            <ChevronLeft className="ltr:rotate-180" />
          </button>
          <button type="button" onClick={() => setPaused(playing)} aria-label={playing ? "إيقاف التشغيل التلقائي" : "تشغيل تلقائي"} className="rx-icon size-8 text-white [&_svg]:size-3.5">
            {playing ? <Pause /> : <Play />}
          </button>
        </div>
      )}
    </section>
  );
}
