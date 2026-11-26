"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { motionOff } from "../../shared/motion";
import { Kicker, btn, delay, num2 } from "../ui";
import { st } from "@/lib/i18n/storefront";

const INTERVAL = 6500;
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** The board: banners fill the screen one at a time under a warm shade, the
 *  copy low on the start; numbered lines count the slides and fill with time.
 *  Autoplay stops on hover, focus, the pause button, reduced motion or the
 *  Studio's "no motion". */
export default function HeroSlides({ banners, storeSlug, storeName }: { banners: BannerData[]; storeSlug: string; storeName: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const still = useSyncExternalStore(
    subscribeReduced,
    () => motionOff(),
    () => false,
  );
  const many = banners.length > 1;
  const running = many && !paused && !held && !still;

  const go = useCallback((i: number) => setIndex((i + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [running, index, go]);

  return (
    <section
      className="bn-hero-board"
      aria-roledescription={many ? "carousel" : undefined}
      aria-label={st("عروض المتجر")}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHeld(false)}
    >
      {banners.map((b, i) => {
        const on = i === index;
        return (
          <div key={b.id} className="bn-slide" data-on={on} aria-hidden={!on} inert={!on} aria-roledescription={many ? "slide" : undefined}>
            <div className="bn-slide-media">
              <BannerImage banner={b} sizes="100vw" priority={i === 0} className="bn-slide-img object-cover" />
            </div>
            <span aria-hidden className="bn-shade" />
            <div className="bn-wrap bn-board-copy">
              <Kicker className="bn-rise">{storeName}</Kicker>
              {i === 0 ? (
                <h1 className="bn-display-xl bn-rise text-balance" style={delay(1)}>
                  {b.title}
                </h1>
              ) : (
                <h2 className="bn-display-xl bn-rise text-balance" style={delay(1)}>
                  {b.title}
                </h2>
              )}
              {b.subtitle && (
                <p className="bn-lead bn-rise text-balance" style={delay(2)}>
                  {b.subtitle}
                </p>
              )}
              <div className="bn-hero-ctas bn-rise" style={delay(3)}>
                {b.link && (
                  <BannerLink banner={b} storeSlug={storeSlug} className={btn({ variant: "crema", size: "lg" })}>
                    {b.cta}
                  </BannerLink>
                )}
                <Link href={buildStoreUrl(storeSlug, "/products")} className={b.link ? "bn-link bn-link--light" : btn({ variant: "light", size: "lg" })}>
                  {b.link ? <span className="bn-underline">{st("تسوّق كل المنتجات")}</span> : st("تسوّق كل المنتجات")}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {many && (
        <div className="bn-wrap bn-board-dots">
          <ol className="flex items-center gap-2">
            {banners.map((b, i) => (
              <li key={b.id}>
                <button type="button" onClick={() => go(i)} aria-label={st("العرض {0}: {1}", i + 1, b.title)} aria-current={i === index} className="bn-dot">
                  <span className="bn-num">{num2(i + 1)}</span>
                  <i key={`${index}-${running}`} data-run={i === index && running} />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? st("تشغيل العروض") : st("إيقاف العروض")} className="bn-icon text-white">
            {paused ? <Play /> : <Pause />}
          </button>
        </div>
      )}
    </section>
  );
}
