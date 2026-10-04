"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** One image strip for every screen: swipe (scroll-snap) on touch, thumbnails
 *  + arrows + hover zoom on desktop. Images are only rendered once. */
export default function Gallery({ images, productName, badge }: { images: string[]; productName: string; badge?: React.ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [canZoom, setCanZoom] = useState(false);
  const multiple = images.length > 1;

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const update = () => setCanZoom(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const i = Math.round(Math.abs(rail.scrollLeft) / rail.clientWidth);
    setActive((prev) => (prev === i ? prev : Math.min(images.length - 1, i)));
  }, [images.length]);

  const goTo = (i: number) => {
    const target = (i + images.length) % images.length;
    slideRefs.current[target]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setActive(target);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative -mx-(--c-gutter) lg:mx-0">
        <div
          ref={railRef}
          onScroll={onScroll}
          className="c-rail c-img-bg lg:rounded-(--c-radius-lg)"
          aria-roledescription="carousel"
          aria-label={`صور ${productName}`}
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`صورة ${i + 1} من ${images.length}`}
              className={cn("relative w-full shrink-0 basis-full overflow-hidden", canZoom && "cursor-zoom-in")}
              style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}
              onMouseMove={
                canZoom
                  ? (e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
                    }
                  : undefined
              }
              onMouseLeave={() => setZoom(null)}
            >
              <Image
                src={src}
                alt={i === 0 ? productName : `${productName} — صورة ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-200 ease-out"
                style={
                  zoom && i === active
                    ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        {badge && <div className="pointer-events-none absolute start-(--c-gutter) top-3 lg:start-3">{badge}</div>}

        {multiple && (
          <>
            <span dir="ltr" className="pointer-events-none absolute bottom-3 end-(--c-gutter) rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white tabular-nums backdrop-blur-sm lg:end-3">
              {active + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="الصورة السابقة"
              className="absolute start-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow-md transition-opacity duration-(--c-motion) group-hover:opacity-100 focus-visible:opacity-100 lg:grid"
            >
              <ChevronRight className="size-5 ltr:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="الصورة التالية"
              className="absolute end-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow-md transition-opacity duration-(--c-motion) group-hover:opacity-100 focus-visible:opacity-100 lg:grid"
            >
              <ChevronLeft className="size-5 ltr:rotate-180" />
            </button>
          </>
        )}
      </div>

      {multiple && (
        <>
          {/* Dots — phones */}
          <div className="flex justify-center gap-1.5 lg:hidden" aria-hidden>
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-(--c-motion)",
                  i === active ? "w-5 bg-foreground" : "w-1.5 bg-foreground/20",
                )}
              />
            ))}
          </div>

          {/* Thumbnails — desktop */}
          <div className="hidden grid-cols-6 gap-2.5 lg:grid">
            {images.slice(0, 12).map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`عرض الصورة ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "c-img-bg relative overflow-hidden rounded-(--c-radius-sm) ring-offset-2 ring-offset-background transition-[box-shadow,opacity] duration-(--c-motion)",
                  i === active ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100",
                )}
                style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}
              >
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
