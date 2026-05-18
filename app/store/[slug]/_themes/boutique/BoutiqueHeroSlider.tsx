"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";

import type { StoreThemeProps } from "../types";

type BoutiqueHeroSliderProps = {
  store: StoreThemeProps["store"];
};

type HeroSlide = {
  id: string;
  title: string | null;
  image: string;
};

export default function BoutiqueHeroSlider({ store }: BoutiqueHeroSliderProps) {
  const bannerSlides: HeroSlide[] = store.banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    image: banner.image,
  }));

  const slides: HeroSlide[] =
    bannerSlides.length > 0
      ? bannerSlides
      : store.settings?.coverImage
        ? [
            {
              id: "cover-image",
              title: store.name,
              image: store.settings.coverImage,
            },
          ]
        : [];

  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = slides[activeIndex];
  const hasMultipleSlides = slides.length > 1;

  useEffect(() => {
    if (activeIndex <= slides.length - 1) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (!hasMultipleSlides) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) =>
        current === slides.length - 1 ? 0 : current + 1,
      );
    }, 6000);

    return () => window.clearInterval(interval);
  }, [hasMultipleSlides, slides.length]);

  const goToPrevious = () => {
    if (!hasMultipleSlides) return;

    setActiveIndex((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    if (!hasMultipleSlides) return;

    setActiveIndex((current) =>
      current === slides.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden">
      {slides.length > 0 ? (
        <div className="absolute inset-0">
          {activeSlide && (
            <Image
              key={activeSlide.id}
              src={activeSlide.image}
              alt={activeSlide.title || store.name}
              fill
              priority
              quality={75}
              sizes="100vw"
              className="object-cover object-center"
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 bg-neutral-950" />
      )}

      <div className="absolute inset-0 z-10 bg-black/30" />
      <div className="absolute inset-0 z-10 bg-linear-to-b from-black/55 via-black/10 to-black/70" />

      <div className="relative z-20 flex min-h-screen w-full items-end px-5 pb-16 pt-44 sm:px-8 md:px-12 md:pb-20 lg:px-16">
        <div
          key={activeSlide?.id || "empty-slide"}
          className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 text-white"
        >
          <p className="mb-4 text-xs font-black uppercase tracking-[0.38em] text-white/80 md:text-sm">
            {store.name}
          </p>

          <h1 className="text-5xl font-black uppercase leading-snug tracking-tight md:text-6xl ">
            {activeSlide?.title || "New Collection"}
          </h1>

          <p className="mt-10 max-w-2xl text-base font-medium leading-8 text-white/85 md:text-xl">
            {store.settings?.description ||
              "منتجات مختارة بعناية، تجربة قوية، وتسوق سريع من أول نظرة."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white px-8 font-black text-black hover:bg-white/90"
            >
              <Link href={buildStoreUrl(store.slug, "/products")}>
                تسوق الآن
                <ArrowLeft className="ms-2 size-4" />
              </Link>
            </Button>

            {store.categories.length > 0 && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent px-8 font-black text-white hover:bg-white hover:text-black"
              >
                <Link href={buildStoreUrl(store.slug, "/categories")}>
                  التصنيفات
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {hasMultipleSlides && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-5 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-black md:left-8"
            aria-label="الصورة السابقة"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="absolute right-5 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-black md:right-8"
            aria-label="الصورة التالية"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/45 hover:bg-white/80",
                )}
                aria-label={`عرض البانر رقم ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
