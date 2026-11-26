"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { motionOff } from "../../shared/motion";
import { num } from "../ui";
import { st } from "@/lib/i18n/storefront";

const EVERY = 5500;

/**
 * The merchant's banners shown whole — for designed banners that carry their
 * own words and logo (Studio hero style "fullscreen"). A swipeable,
 * scroll-snapped row with dots; it moves on its own unless motion is off or
 * the shopper is touching, hovering or focused on it. The banner's title is
 * kept for screen readers only.
 */
export default function BannerSlider({ banners, storeSlug }: { banners: BannerData[]; storeSlug: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const many = banners.length > 1;

  const go = useCallback((index: number) => {
    const el = track.current;
    const slide = el?.children[index] as HTMLElement | undefined;
    if (!el || !slide) return;
    // A delta from where the slide sits now works the same in RTL and LTR, and never scrolls the page.
    el.scrollBy({ left: slide.getBoundingClientRect().left - el.getBoundingClientRect().left, behavior: motionOff() ? "auto" : "smooth" });
  }, []);

  // Which slide is showing, from the scroll position.
  useEffect(() => {
    const el = track.current;
    if (!el || !many) return;
    const onScroll = () => {
      const box = el.getBoundingClientRect();
      let best = 0;
      let bestDist = Infinity;
      Array.from(el.children).forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - box.left);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [many]);

  useEffect(() => {
    if (!many || held || motionOff()) return;
    const id = window.setTimeout(() => go((active + 1) % banners.length), EVERY);
    return () => window.clearTimeout(id);
  }, [active, held, many, banners.length, go]);

  return (
    <div
      className="an-slider an-rise"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      onTouchStart={() => setHeld(true)}
      onTouchEnd={() => setHeld(false)}
    >
      <div ref={track} className="an-slides" aria-roledescription={many ? st("عرض بانرات") : undefined} aria-label={st("عروض المتجر")}>
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={cn("an-slide", b.mobileImage && "an-slide--phone")}
            role={many ? "group" : undefined}
            aria-roledescription={many ? st("بانر") : undefined}
            aria-label={many ? st("{0} من {1}", num(i + 1), num(banners.length)) : undefined}
          >
            <BannerLink banner={b} storeSlug={storeSlug} className="absolute inset-0 block" tabIndex={i === active ? 0 : -1}>
              <BannerImage banner={b} sizes="(max-width: 768px) 100vw, 1150px" priority={i === 0} className="object-cover" />
              <span className="sr-only">
                {b.title}
                {b.subtitle ? ` — ${b.subtitle}` : ""}
              </span>
            </BannerLink>
          </div>
        ))}
      </div>
      {many && (
        <div className="an-dots">
          {banners.map((b, i) => (
            <button key={b.id} type="button" onClick={() => go(i)} className="an-dotbtn" data-on={i === active || undefined} aria-label={st("البانر {0}", num(i + 1))} aria-current={i === active || undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
