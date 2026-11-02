"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Chevron } from "../ui";

const AUTO_MS = 6000;

/** Banners as App Store "Today" cards: real swiping with the next card peeking
 *  in, dots to follow along and a pause button. It advances on its own only
 *  while nobody is touching it, and never with motion off. */
export default function HeroSlider({ banners, storeSlug, variant }: { banners: BannerData[]; storeSlug: string; variant: "full" | "split" | "compact" }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const many = banners.length > 1;

  const goTo = useCallback((i: number) => {
    const el = track.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (!el || !slide) return;
    const box = el.getBoundingClientRect();
    const at = slide.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === "rtl";
    const left = rtl ? at.right - box.right : at.left - box.left;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left, behavior: still ? "auto" : "smooth" });
  }, []);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    let best = 0;
    let dist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setIndex(best);
  };

  useEffect(() => {
    const el = track.current;
    if (!many || paused || hover || !el) return;
    if (el.closest("[data-motion='none']") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) goTo((index + 1) % banners.length);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [many, paused, hover, index, banners.length, goTo]);

  return (
    <section aria-roledescription="carousel" aria-label="عروض المتجر" className="mk-hero" data-variant={variant} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setHover(true)} onBlurCapture={() => setHover(false)}>
      <ul ref={track} onScroll={onScroll} className="mk-hero-track">
        {banners.map((b, i) => (
          <li key={b.id} className="mk-hero-slide" aria-roledescription="slide" aria-label={`${i + 1} من ${banners.length}`}>
            <BannerLink banner={b} storeSlug={storeSlug} className="mk-hero-card group">
              <span className="mk-hero-img">
                <BannerImage banner={b} sizes={variant === "compact" ? "(max-width: 1024px) 85vw, 40vw" : "100vw"} priority={i === 0} className="object-cover" />
              </span>
              <span className="mk-hero-copy">
                {i === 0 ? <h1 className="mk-hero-title">{b.title}</h1> : <h2 className="mk-hero-title">{b.title}</h2>}
                {b.subtitle && <span className="mk-hero-sub">{b.subtitle}</span>}
                {b.link && (
                  <span className="mk-hero-cta">
                    {b.cta}
                    <Chevron />
                  </span>
                )}
              </span>
            </BannerLink>
          </li>
        ))}
      </ul>

      {many && (
        <div className="mk-hero-dots">
          <div className="flex items-center gap-2">
            {banners.map((b, i) => (
              <button key={b.id} type="button" onClick={() => goTo(i)} aria-label={`الشريحة ${i + 1}`} aria-current={i === index} className={cn("mk-dot", i === index && "mk-dot--on")} />
            ))}
          </div>
          <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "تشغيل" : "إيقاف مؤقت"} className="mk-icon !size-8 [&_svg]:!size-3.5">
            {paused ? <Play /> : <Pause />}
          </button>
        </div>
      )}
    </section>
  );
}
