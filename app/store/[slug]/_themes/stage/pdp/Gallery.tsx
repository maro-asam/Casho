"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import { SG_PORTAL, num } from "../ui";

/** Frames follow the Studio's image ratio, so product photos fill them. */
const RATIO = { aspectRatio: "var(--store-img-ratio, 1 / 1)" };

/** Desktop: the main image on a large rounded gray panel with hover zoom,
 *  over a row of thumbnails; click opens a fullscreen lightbox. Phones: a
 *  swipe strip with dots. */
export default function Gallery({ images, name, badges }: { images: string[]; name: string; badges?: React.ReactNode }) {
  // Only read in handlers and the (initially closed) lightbox, so reading the DOM up front is safe.
  const [dir] = useState<"rtl" | "ltr">(() =>
    typeof document !== "undefined" && document.querySelector(".theme-stage")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl",
  );
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [light, setLight] = useState(false);
  const multiple = images.length > 1;
  const alt = (i: number) => (i === 0 ? name : `${name} — صورة ${i + 1}`);
  const go = useCallback((i: number) => setActive((i + images.length) % images.length), [images.length]);

  const onScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    setActive((p) => (p === i ? p : Math.min(images.length - 1, i)));
  }, [images.length]);

  const scrollTo = (i: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i * (dir === "rtl" ? -1 : 1), behavior: "smooth" });
  };

  useEffect(() => {
    if (!light) return;
    const onKey = (e: KeyboardEvent) => {
      const rtl = dir === "rtl";
      if (e.key === "ArrowLeft") go(active + (rtl ? 1 : -1));
      if (e.key === "ArrowRight") go(active + (rtl ? -1 : 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [light, active, dir, go]);

  return (
    <>
      {/* Phones */}
      <div className="relative lg:hidden">
        <div ref={railRef} onScroll={onScroll} className="sg-rail overflow-hidden rounded-(--sg-r-xl)" aria-roledescription="carousel" aria-label={`صور ${name}`}>
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => {
                setActive(i);
                setLight(true);
              }}
              aria-label={`تكبير الصورة ${i + 1}`}
              className="relative w-full shrink-0 basis-full bg-(--sg-plate)"
              style={RATIO}
            >
              <Image src={src} alt={alt(i)} fill priority={i === 0} sizes="100vw" className="sg-product-img" />
            </button>
          ))}
        </div>
        {badges && <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">{badges}</div>}
        {multiple && (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => scrollTo(i)} aria-label={`الصورة ${i + 1}`} aria-current={i === active} className="grid h-6 place-items-center px-0.5">
                <span className={cn("block h-1.5 rounded-full transition-all", i === active ? "w-5 bg-(--sg-ink)" : "w-1.5 bg-(--sg-label-3)")} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div
          className="group relative cursor-zoom-in overflow-hidden rounded-(--sg-r-xl) bg-(--sg-plate)"
          style={RATIO}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLight(true)}
        >
          <Image
            key={active}
            src={images[active]}
            alt={alt(active)}
            fill
            priority
            sizes="(max-width: 1280px) 50vw, 40rem"
            className="sg-product-img sg-pop transition-transform duration-200 ease-out"
            style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          {badges && <div className="pointer-events-none absolute end-4 top-4 flex flex-col items-end gap-1.5">{badges}</div>}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLight(true);
            }}
            aria-label="عرض الصور بملء الشاشة"
            className="sg-fab absolute start-4 top-4 size-10"
          >
            <Expand />
          </button>
        </div>
        {multiple && (
          <div className="sg-rail mt-4 gap-3">
            {images.slice(0, 10).map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`عرض الصورة ${i + 1}`}
                aria-current={i === active}
                style={RATIO}
                className={cn(
                  "relative w-[calc((100%-3rem)/5)] shrink-0 overflow-hidden rounded-(--sg-r) border-2 bg-(--sg-plate) transition-colors",
                  i === active ? "border-(--sg-tint)" : "border-transparent hover:border-(--sg-sep)",
                )}
              >
                <Image src={src} alt="" fill sizes="10rem" className="sg-product-img" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog.Root open={light} onOpenChange={setLight}>
        <Dialog.Portal>
          <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(SG_PORTAL, "fixed inset-0 z-50 flex flex-col bg-(--sg-sheet) outline-none")}>
            <Dialog.Title className="sr-only">صور {name}</Dialog.Title>
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <span className="sg-num text-sm font-semibold">
                {num(active + 1)} / {num(images.length)}
              </span>
              <Dialog.Close className="sg-icon -me-2" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image key={active} src={images[active]} alt={alt(active)} fill sizes="100vw" className="sg-pop object-contain" />
              {multiple && (
                <>
                  <button type="button" onClick={() => go(active - 1)} aria-label="الصورة السابقة" className="sg-fab absolute start-4 top-1/2 size-12 -translate-y-1/2">
                    <ChevronRight className="ltr:rotate-180" />
                  </button>
                  <button type="button" onClick={() => go(active + 1)} aria-label="الصورة التالية" className="sg-fab absolute end-4 top-1/2 size-12 -translate-y-1/2">
                    <ChevronLeft className="ltr:rotate-180" />
                  </button>
                </>
              )}
            </div>
            {multiple && (
              <div className="sg-rail shrink-0 justify-center gap-2 p-4">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`الصورة ${i + 1}`}
                    aria-current={i === active}
                    className={cn("relative size-14 shrink-0 overflow-hidden rounded-(--sg-r-sm) border-2 bg-(--sg-plate)", i === active ? "border-(--sg-btn)" : "border-transparent opacity-60")}
                  >
                    <Image src={src} alt="" fill sizes="56px" className="object-contain" />
                  </button>
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
