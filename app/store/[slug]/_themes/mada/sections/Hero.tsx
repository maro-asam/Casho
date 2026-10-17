"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData, HomeViewProps } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Arrow, btn, num } from "../ui";

/** Full-bleed slideshow built from the merchant's banners. */
export default function Hero({
  banners,
  store,
  dir,
  hasCategories,
}: {
  banners: BannerData[];
  store: HomeViewProps["store"];
  dir: "rtl" | "ltr";
  hasCategories: boolean;
}) {
  const multiple = banners.length > 1;
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [ref, embla] = useEmblaCarousel(
    { loop: multiple, direction: dir, duration: 32, active: multiple },
    multiple && !reduced ? [Autoplay({ delay: 6500, stopOnInteraction: true, stopOnMouseEnter: true })] : [],
  );
  const [selected, setSelected] = useState(0);
  const onSelect = useCallback(() => embla && setSelected(embla.selectedScrollSnap()), [embla]);
  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  const url = (p: string) => buildStoreUrl(store.slug, p);

  return (
    <section aria-roledescription="carousel" aria-label="العروض" className="md-wrap pt-3 sm:pt-4">
      <div className="relative overflow-hidden rounded-[1.75rem]">
        <div ref={ref} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {banners.map((b, i) => (
              <div key={b.id} role="group" aria-roledescription="slide" aria-label={`${num(i + 1)} من ${num(banners.length)}`} className="relative min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-[min(78dvh,46rem)]">
                  <BannerImage banner={b} priority={i === 0} sizes="(max-width: 1472px) 100vw, 1472px" className="object-cover" />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.78),rgb(12_17_15/0.1)_55%,transparent)]" />
                  {/* Extra scrim on the text side so baked-in banner text never fights the title */}
                  <span aria-hidden className="absolute inset-0 hidden bg-[linear-gradient(to_left,rgb(12_17_15/0.6),transparent_60%)] lg:block ltr:bg-[linear-gradient(to_right,rgb(12_17_15/0.6),transparent_60%)]" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 pb-16 text-white sm:p-10 sm:pb-20 lg:p-14 lg:pb-16">
                  <span className="md-eyebrow">جديد في {store.name}</span>
                  <h2 className={cn("md-hero-title mt-4 max-w-3xl text-balance", i !== selected && "opacity-0")} style={{ transition: "opacity 600ms" }}>
                    {b.title}
                  </h2>
                  {b.subtitle && <p className="mt-3 line-clamp-2 max-w-2xl text-base text-white/85 sm:text-lg">{b.subtitle}</p>}
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {b.link && (
                      <BannerLink banner={b} storeSlug={store.slug} tabIndex={i === selected ? 0 : -1} className={btn({ variant: "light", size: "lg" })}>
                        {b.cta}
                        <Arrow />
                      </BannerLink>
                    )}
                    {hasCategories && (
                      <Link href={url("/categories")} tabIndex={i === selected ? 0 : -1} className={btn({ size: "lg", className: "border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 max-sm:hidden" })}>
                        التصنيفات
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {multiple && (
          <div className="absolute inset-x-5 bottom-5 flex items-center gap-4 sm:inset-x-10 lg:inset-x-14">
            <div className="flex flex-1 gap-1.5" aria-hidden>
              {banners.map((b, i) => (
                <span key={b.id} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                  <span className={cn("absolute inset-0 origin-[var(--o)] rounded-full bg-white transition-transform duration-500", i === selected ? "scale-x-100" : "scale-x-0")} style={{ "--o": dir === "rtl" ? "right" : "left" } as React.CSSProperties} />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => embla?.scrollPrev()} aria-label="العرض السابق" className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25">
                <ArrowRight className="size-4 ltr:rotate-180" />
              </button>
              <button type="button" onClick={() => embla?.scrollNext()} aria-label="العرض التالي" className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25">
                <ArrowLeft className="size-4 ltr:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
