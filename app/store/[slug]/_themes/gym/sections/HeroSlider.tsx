"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Arrow, num2, stagger } from "../ui";

const INTERVAL = 6000;
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Banner slideshow with a red slash that wipes across on every change.
 *  `full` spans the page, `contained` sits inside the page width and `split`
 *  keeps the copy on the page with the photo behind a slanted edge. The
 *  ticks count the sets. Autoplays only when motion is allowed, pauses on
 *  hover/focus and while the tab is hidden; swipe on touch. */
export default function HeroSlider({
  banners,
  storeSlug,
  variant,
  height,
}: {
  banners: BannerData[];
  storeSlug: string;
  variant: "full" | "contained" | "split";
  /** Height classes for the slide area. */
  height: string;
}) {
  const [index, setIndex] = useState(0);
  const [wipes, setWipes] = useState(0);
  const reduced = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
  const [paused, setPaused] = useState(false);
  const playing = !paused && !reduced;
  const [hold, setHold] = useState(false);
  const touch = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
      setWipes((w) => w + 1);
    },
    [count],
  );

  useEffect(() => {
    if (!playing || hold || count < 2) return;
    const id = setTimeout(() => {
      if (document.visibilityState === "visible") go(index + 1);
    }, INTERVAL);
    return () => clearTimeout(id);
  }, [playing, hold, index, count, go]);

  const step = (d: 1 | -1) => go(index + d);
  const split = variant === "split";
  const ticking = playing && !hold;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="العروض الرئيسية"
      className={cn("gy-slides", variant === "contained" && "rounded-(--gy-r)", split && "!bg-(--gy-bg) !text-(--gy-ink)")}
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
        {banners.map((b, i) => {
          const copy = (
            <div className={cn("gy-slide-copy flex flex-col items-start", split ? "justify-center" : "h-full justify-end pb-16 sm:justify-center sm:pb-14", split ? "" : variant === "full" ? "gy-wrap" : "px-6 sm:px-12")}>
              {b.title && (
                <h2 className={cn("gy-hero max-w-[16ch] text-balance", !split && "!text-white")} style={stagger(0)}>
                  {b.title}
                </h2>
              )}
              {b.subtitle && (
                <p className={cn("mt-3 line-clamp-2 max-w-[46ch] text-base sm:text-lg", split ? "text-(--gy-quiet)" : "text-white/90")} style={stagger(1)}>
                  {b.subtitle}
                </p>
              )}
              {b.link && (
                <BannerLink banner={b} storeSlug={storeSlug} className="gy-btn gy-btn--solid gy-btn--lg mt-7" >
                  <span style={stagger(2)} className="contents">
                    {b.cta}
                    <Arrow />
                  </span>
                </BannerLink>
              )}
            </div>
          );
          return (
            <div key={b.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} من ${count}`} aria-hidden={i !== index} inert={i !== index} data-active={i === index} className="gy-slide">
              {split ? (
                <div className="flex h-full flex-col lg:flex-row-reverse lg:items-center">
                  <div className="gy-split-img">
                    <BannerImage banner={b} priority={i === 0} sizes="(max-width: 1024px) 100vw, 62vw" className="object-cover" />
                  </div>
                  <div className="gy-wrap relative z-[1] flex flex-1 flex-col justify-center py-6 lg:absolute lg:inset-0 lg:py-0">
                    <div className="lg:max-w-[38%]">{copy}</div>
                  </div>
                </div>
              ) : (
                <>
                  <BannerImage banner={b} priority={i === 0} sizes={variant === "full" ? "100vw" : "(max-width: 1440px) 100vw, 90rem"} className={cn("object-cover transition-transform duration-[7000ms] ease-out", i === index && "motion-safe:scale-[1.04]")} />
                  {(b.title || b.subtitle || b.link) && <span aria-hidden className="absolute inset-0 ltr:-scale-x-100" style={{ background: "var(--store-hero-overlay)" }} />}
                  <div className="relative h-full">{copy}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {wipes > 0 && <span key={wipes} aria-hidden className="gy-wipe" />}

      {count > 1 && (
        <div className={cn("gy-slides-bar", split ? "gy-wrap inset-x-0 max-lg:static max-lg:pb-4" : variant === "full" ? "gy-wrap inset-x-0" : "start-6 sm:start-12")}>
          <span aria-hidden className={cn("gy-num text-sm font-black", split ? "text-(--gy-ink)" : "text-white")}>
            {num2(index + 1)} / {num2(count)}
          </span>
          <div className="flex items-center gap-1.5">
            {banners.map((b, i) => (
              <button key={b.id} type="button" onClick={() => go(i)} aria-label={`الشريحة ${i + 1}`} aria-current={i === index} className="grid h-8 place-items-center">
                <span key={i === index ? wipes : undefined} className="gy-tick" data-active={i === index} data-playing={ticking} style={{ ["--gy-tick" as string]: `${INTERVAL}ms` }} />
              </button>
            ))}
          </div>
          <div className={cn("ms-auto flex items-center gap-0.5", split ? "text-(--gy-ink)" : "text-white", variant === "contained" && "ms-3")}>
            <button type="button" onClick={() => step(-1)} aria-label="الشريحة السابقة" className="gy-icon size-9 [&_svg]:size-5">
              <ChevronRight className="ltr:rotate-180" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="الشريحة التالية" className="gy-icon size-9 [&_svg]:size-5">
              <ChevronLeft className="ltr:rotate-180" />
            </button>
            <button type="button" onClick={() => setPaused(playing)} aria-label={playing ? "إيقاف التشغيل التلقائي" : "تشغيل تلقائي"} className="gy-icon size-9 [&_svg]:size-4">
              {playing ? <Pause /> : <Play />}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
