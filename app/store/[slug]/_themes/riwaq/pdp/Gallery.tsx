"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { idx } from "../ui";

/** Phones: a full-bleed swipe strip with a counter and segmented progress.
 *  Desktop: the images laid out as an editorial stack — lead image full,
 *  the next two side by side, the rest full again. */
export default function Gallery({ images, productName, badge }: { images: string[]; productName: string; badge?: React.ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const multiple = images.length > 1;

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const i = Math.round(Math.abs(rail.scrollLeft) / rail.clientWidth);
    setActive((prev) => (prev === i ? prev : Math.min(images.length - 1, i)));
  }, [images.length]);

  const alt = (i: number) => (i === 0 ? productName : `${productName} — صورة ${i + 1}`);

  return (
    <>
      {/* Phones & tablets */}
      <div className="relative -mx-(--rq-gutter) lg:hidden">
        <div
          ref={railRef}
          onScroll={onScroll}
          className="rq-rail rq-plate"
          aria-roledescription="carousel"
          aria-label={`صور ${productName}`}
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              role="group"
              aria-roledescription="slide"
              aria-label={`صورة ${i + 1} من ${images.length}`}
              className="relative w-full shrink-0 basis-full"
              style={{ aspectRatio: "var(--store-img-ratio, 4 / 5)" }}
            >
              <Image src={src} alt={alt(i)} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
        {badge && <div className="pointer-events-none absolute start-(--rq-gutter) top-3">{badge}</div>}
        {multiple && (
          <>
            <span className="rq-num pointer-events-none absolute end-(--rq-gutter) top-3 bg-(--rq-paper) px-2 py-1 text-xs">
              {idx(active + 1)} / {idx(images.length)}
            </span>
            <div className="absolute inset-x-(--rq-gutter) bottom-3 flex gap-1" aria-hidden>
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-(--rq-dur)",
                    i === active ? "bg-(--rq-paper)" : "bg-(--rq-paper)/40",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden grid-cols-2 gap-3 lg:grid">
        {images.map((src, i) => {
          const half = images.length >= 3 && (i === 1 || i === 2);
          return (
            <div
              key={src + i}
              className={cn("rq-plate relative overflow-hidden", half ? "col-span-1" : "col-span-2")}
              style={{ aspectRatio: half ? "3 / 4" : "var(--store-img-ratio, 4 / 5)" }}
            >
              <Image
                src={src}
                alt={alt(i)}
                fill
                priority={i === 0}
                sizes={half ? "28vw" : "55vw"}
                className="object-cover"
              />
              {i === 0 && badge && <div className="pointer-events-none absolute start-0 top-0">{badge}</div>}
              {multiple && (
                <span className="rq-num pointer-events-none absolute bottom-3 end-3 bg-(--rq-paper) px-2 py-1 text-xs">
                  {idx(i + 1)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
