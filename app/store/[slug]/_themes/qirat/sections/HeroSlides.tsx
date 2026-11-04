"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Kicker, btn, delay, num2 } from "../ui";

const INTERVAL = 6500;
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** The vitrine: banners fill the screen one at a time, crossfading slowly
 *  (and settling in from a slight zoom with motion on "حيوية"); the copy sits
 *  low and centered. Thin gold lines count the slides and fill with time.
 *  Autoplay stops on hover, focus, the pause button or reduced motion. */
export default function HeroSlides({ banners, storeSlug, storeName }: { banners: BannerData[]; storeSlug: string; storeName: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const many = banners.length > 1;
  const running = many && !paused && !held && !reduced;

  const go = useCallback((i: number) => setIndex((i + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [running, index, go]);

  return (
    <section
      className="qr-hero"
      data-under
      aria-roledescription={many ? "carousel" : undefined}
      aria-label="عروض المتجر"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHeld(false)}
    >
      {banners.map((b, i) => {
        const on = i === index;
        return (
          <div key={b.id} className="qr-slide" data-on={on} aria-hidden={!on} inert={!on} aria-roledescription={many ? "slide" : undefined}>
            <div className="qr-slide-media">
              <BannerImage banner={b} sizes="100vw" priority={i === 0} className="qr-slide-img object-cover" />
            </div>
            <span aria-hidden className="qr-shade" />
            <div className="qr-wrap qr-hero-copy">
              <Kicker className="qr-rise">{storeName}</Kicker>
              {i === 0 ? <h1 className="qr-hero-title qr-rise text-balance" style={delay(1)}>{b.title}</h1> : <h2 className="qr-hero-title qr-rise text-balance" style={delay(1)}>{b.title}</h2>}
              {b.subtitle && (
                <p className="qr-hero-sub qr-rise text-balance" style={delay(2)}>
                  {b.subtitle}
                </p>
              )}
              <div className="qr-hero-ctas qr-rise" style={delay(3)}>
                {b.link && (
                  <BannerLink banner={b} storeSlug={storeSlug} className={btn({ variant: "light", size: "lg" })}>
                    {b.cta}
                  </BannerLink>
                )}
                <Link href={buildStoreUrl(storeSlug, "/products")} className={b.link ? "qr-link qr-link--light" : btn({ variant: "light", size: "lg" })}>
                  {b.link ? <span className="qr-underline">تسوّق كل القطع</span> : "تسوّق كل القطع"}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {many && (
        <div className="qr-wrap qr-hero-dots">
          <ol className="flex items-center gap-2">
            {banners.map((b, i) => (
              <li key={b.id}>
                <button type="button" onClick={() => go(i)} aria-label={`العرض ${i + 1}: ${b.title}`} aria-current={i === index} className="qr-dot">
                  <span className="qr-num">{num2(i + 1)}</span>
                  <i key={`${index}-${running}`} data-run={i === index && running} />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "تشغيل العروض" : "إيقاف العروض"} className="qr-icon text-white">
            {paused ? <Play /> : <Pause />}
          </button>
        </div>
      )}
    </section>
  );
}
