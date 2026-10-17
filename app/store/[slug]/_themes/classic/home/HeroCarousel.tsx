"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { btn } from "../ui";

type Props = {
  banners: BannerData[];
  storeSlug: string;
  heroStyle: HeroStyle;
  dir: "rtl" | "ltr";
  hasCategories: boolean;
};

export default function HeroCarousel({ banners, storeSlug, heroStyle, dir, hasCategories }: Props) {
  const multiple = banners.length > 1;
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [emblaRef, embla] = useEmblaCarousel(
    { loop: multiple, direction: dir, duration: 28, active: multiple },
    multiple && !reducedMotion ? [Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })] : [],
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

  const split = heroStyle === "split";
  const compact = heroStyle === "compact";

  return (
    <section aria-roledescription="carousel" aria-label="العروض" className="relative">
      <div ref={emblaRef} className="overflow-hidden rounded-(--c-radius-lg)">
        <div className="flex touch-pan-y">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} من ${banners.length}`}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <div
                className={cn(
                  "grid overflow-hidden bg-(--c-subtle) lg:relative",
                  split ? "lg:grid-cols-2" : "lg:block",
                )}
              >
                {/* Image — 4:3 on phones so the banner isn't over-cropped */}
                <div
                  className={cn(
                    "relative aspect-[4/3] sm:aspect-[16/9]",
                    split ? "lg:order-last lg:aspect-[5/4]" : compact ? "lg:aspect-[32/9]" : "lg:aspect-[16/6]",
                  )}
                >
                  <BannerImage
                    banner={banner}
                    priority={i === 0}
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className="object-cover"
                  />
                  {!split && (
                    <div
                      aria-hidden
                      className="absolute inset-0 hidden bg-gradient-to-l from-black/65 via-black/25 to-transparent lg:block ltr:bg-gradient-to-r"
                    />
                  )}
                </div>

                {/* Copy — stacked under the image on phones, over it on desktop */}
                <div
                  className={cn(
                    "flex flex-col justify-center px-5 py-5 sm:px-7 sm:py-6",
                    split
                      ? "lg:px-14 lg:py-10"
                      : "lg:absolute lg:inset-y-0 lg:start-0 lg:max-w-xl lg:px-14 lg:text-white",
                  )}
                >
                  <h2
                    className={cn(
                      "line-clamp-3 text-xl font-bold leading-snug tracking-tight sm:text-2xl",
                      compact ? "lg:text-3xl" : "lg:text-[2.75rem] lg:leading-[1.15]",
                    )}
                  >
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className={cn("mt-2 line-clamp-2 text-sm text-muted-foreground sm:text-base", !split && "lg:text-white/85")}>
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2.5 lg:mt-7">
                    {banner.link && (
                      <BannerLink
                        banner={banner}
                        storeSlug={storeSlug}
                        tabIndex={i === selected ? 0 : -1}
                        className={btn({
                          size: "lg",
                          variant: "primary",
                          className: cn("min-w-36", !split && "lg:bg-white lg:text-neutral-900"),
                        })}
                      >
                        {banner.cta}
                      </BannerLink>
                    )}
                    {hasCategories && (
                      <Link
                        href={buildStoreUrl(storeSlug, "/categories")}
                        tabIndex={i === selected ? 0 : -1}
                        className={btn({
                          size: "lg",
                          variant: "outline",
                          className: cn(!split && "lg:border-white/50 lg:bg-transparent lg:text-white lg:hover:border-white"),
                        })}
                      >
                        التصنيفات
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {multiple && (
        <div className="mt-3 flex items-center justify-center gap-1 lg:absolute lg:bottom-5 lg:end-6 lg:mt-0 lg:rounded-full lg:bg-black/35 lg:p-1 lg:backdrop-blur-sm">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            aria-label="العرض السابق"
            className="hidden size-9 place-items-center rounded-full text-white transition-colors hover:bg-white/15 lg:grid"
          >
            <ChevronRight className="size-5 ltr:rotate-180" />
          </button>
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              aria-label={`عرض ${i + 1}`}
              aria-current={i === selected}
              className="grid h-6 place-items-center px-0.5"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-(--c-motion)",
                  i === selected ? "w-6 bg-foreground lg:bg-white" : "w-1.5 bg-foreground/25 lg:bg-white/50",
                )}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            aria-label="العرض التالي"
            className="hidden size-9 place-items-center rounded-full text-white transition-colors hover:bg-white/15 lg:grid"
          >
            <ChevronLeft className="size-5 ltr:rotate-180" />
          </button>
        </div>
      )}
    </section>
  );
}
