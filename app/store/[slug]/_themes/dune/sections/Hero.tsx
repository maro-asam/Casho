"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData, HomeViewProps } from "../../types";
import { btn, delay, num } from "../ui";

const SLIDE_MS = 7000;

/** Full-bleed slideshow from the merchant's banners. Sits under the
 *  transparent header when it opens the page; each slide settles slowly
 *  from a slight zoom while its copy rises in, and drifts on scroll. */
export default function Hero({
  banners,
  store,
  dir,
  hasCategories,
  underHeader,
}: {
  banners: BannerData[];
  store: HomeViewProps["store"];
  dir: "rtl" | "ltr";
  hasCategories: boolean;
  underHeader: boolean;
}) {
  const multiple = banners.length > 1;
  const [ref, embla] = useEmblaCarousel({ loop: multiple, direction: dir, duration: 38, active: multiple });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  const onSelect = useCallback(() => embla && setSelected(embla.selectedScrollSnap()), [embla]);
  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  // Start the first slide's settle animation after paint.
  useEffect(() => {
    const f = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(f);
  }, []);

  // Autoplay (never under reduced motion; pauses on hover/focus or by the button).
  useEffect(() => {
    if (!embla || !multiple || paused || hovered || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => embla.scrollNext(), SLIDE_MS);
    return () => clearTimeout(t);
  }, [embla, multiple, paused, hovered, selected]);

  const url = (p: string) => buildStoreUrl(store.slug, p);

  return (
    <section
      aria-roledescription={multiple ? "carousel" : undefined}
      aria-label="العروض"
      data-under-header={underHeader || undefined}
      className="relative overflow-hidden bg-[#2a2a28] text-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div ref={ref} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {banners.map((b, i) => {
            const active = mounted && i === selected;
            return (
              <div
                key={b.id}
                role={multiple ? "group" : undefined}
                aria-roledescription={multiple ? "slide" : undefined}
                aria-label={multiple ? `${num(i + 1)} من ${num(banners.length)}` : undefined}
                aria-hidden={multiple && i !== selected ? true : undefined}
                className={cn("dn-slide relative h-[100svh] min-h-[34rem] max-h-[68rem] min-w-0 shrink-0 grow-0 basis-full overflow-hidden", active && "is-active")}
              >
                <div data-parallax className="absolute inset-x-0 -inset-y-[12%]">
                  <Image src={b.image} alt="" fill priority={i === 0} sizes="100vw" className="dn-hero-img object-cover" />
                </div>
                <span aria-hidden className="absolute inset-0 bg-[rgb(42_42_40/0.22)]" />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(20_20_18/0.62),transparent_55%)]" />

                <div className="dn-wrap relative flex h-full flex-col items-center justify-end pb-24 text-center sm:pb-28 lg:pb-32">
                  <div className="dn-hero-copy flex max-w-4xl flex-col items-center [text-shadow:0_1px_24px_rgb(0_0_0/0.18)]">
                    <p className="dn-label" style={delay(0)}>
                      {store.name}
                    </p>
                    <h2 className="dn-hero mt-4 text-balance" style={delay(1)}>
                      {b.title}
                    </h2>
                    <div className="mt-8 flex flex-wrap justify-center gap-3" style={delay(2)}>
                      <Link href={url("/products")} tabIndex={i === selected ? 0 : -1} className={btn({ variant: "light", size: "lg" })}>
                        تسوّق الآن
                      </Link>
                      {hasCategories && (
                        <Link href={url("/categories")} tabIndex={i === selected ? 0 : -1} className={btn({ variant: "glass", size: "lg", className: "max-sm:hidden" })}>
                          التصنيفات
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {multiple && (
        <div className="dn-wrap pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-between gap-6 sm:bottom-8">
          <div className="pointer-events-auto flex items-center gap-3" aria-hidden>
            <span className="dn-num text-lg">{num(selected + 1).padStart(2, "٠")}</span>
            <span className="flex gap-1.5">
              {banners.map((b, i) => (
                <span key={b.id} className="relative h-px w-5 overflow-hidden bg-white/35 sm:w-12">
                  <span
                    className={cn("absolute inset-0 origin-(--o) bg-white", i === selected && !paused && !hovered ? "scale-x-100 transition-transform ease-linear" : "scale-x-0")}
                    style={{ "--o": dir === "rtl" ? "right" : "left", transitionDuration: i === selected ? `${SLIDE_MS}ms` : "0ms" } as React.CSSProperties}
                  />
                </span>
              ))}
            </span>
            <span className="dn-num text-lg opacity-60">{num(banners.length).padStart(2, "٠")}</span>
          </div>
          <div className="pointer-events-auto -me-2.5 flex items-center gap-1">
            <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? "تشغيل العرض" : "إيقاف العرض"} className="dn-icon size-10 [&_svg]:size-4">
              {paused ? <Play /> : <Pause />}
            </button>
            <button type="button" onClick={() => embla?.scrollPrev()} aria-label="العرض السابق" className="dn-icon size-10 max-sm:hidden [&_svg]:size-4">
              <ArrowRight className="ltr:rotate-180" />
            </button>
            <button type="button" onClick={() => embla?.scrollNext()} aria-label="العرض التالي" className="dn-icon size-10 max-sm:hidden [&_svg]:size-4">
              <ArrowLeft className="ltr:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
