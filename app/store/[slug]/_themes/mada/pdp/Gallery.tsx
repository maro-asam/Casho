"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import { MD_PORTAL, num } from "../ui";

/** Desktop: vertical thumbnails + main image with hover pan-zoom; click opens
 *  a fullscreen lightbox. Phones: swipe strip with dots; tap opens the lightbox. */
export default function Gallery({ images, name, badges }: { images: string[]; name: string; badges?: React.ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  // Only used by the (initially closed) lightbox, so reading the DOM up front is safe.
  const [dir] = useState<"rtl" | "ltr">(() =>
    typeof document !== "undefined" && document.querySelector(".theme-mada")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl",
  );
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [light, setLight] = useState(false);
  const multiple = images.length > 1;
  const alt = (i: number) => (i === 0 ? name : `${name} — صورة ${i + 1}`);

  const onScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    setActive((p) => (p === i ? p : Math.min(images.length - 1, i)));
  }, [images.length]);

  const go = (i: number) => setActive((i + images.length) % images.length);

  useEffect(() => {
    if (!light) return;
    const onKey = (e: KeyboardEvent) => {
      const rtl = dir === "rtl";
      if (e.key === "ArrowLeft") go(active + (rtl ? 1 : -1));
      if (e.key === "ArrowRight") go(active + (rtl ? -1 : 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      {/* Phones */}
      <div className="relative -mx-(--md-gutter) lg:hidden">
        <div ref={railRef} onScroll={onScroll} className="md-rail" aria-roledescription="carousel" aria-label={`صور ${name}`}>
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => {
                setActive(i);
                setLight(true);
              }}
              aria-label={`تكبير الصورة ${i + 1}`}
              className="relative w-full shrink-0 basis-full bg-(--md-studio)"
              style={{ aspectRatio: "var(--store-img-ratio, 4 / 5)" }}
            >
              <Image src={src} alt={alt(i)} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {badges && <div className="pointer-events-none absolute start-(--md-gutter) top-3 flex gap-1.5">{badges}</div>}
        {multiple && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === active ? "w-5 bg-white" : "w-1.5 bg-white/60")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className={cn("hidden gap-4 lg:grid", multiple ? "grid-cols-[5rem_minmax(0,1fr)]" : "grid-cols-1")}>
        {multiple && (
          <div className="flex max-h-[44rem] flex-col gap-2.5 overflow-y-auto pe-1 [scrollbar-width:thin]">
            {images.slice(0, 10).map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`عرض الصورة ${i + 1}`}
                aria-current={i === active}
                className={cn("md-media aspect-[4/5] w-full shrink-0 rounded-xl ring-offset-2 ring-offset-(--md-bg) transition", i === active ? "ring-2 ring-(--md-ink)" : "opacity-65 hover:opacity-100")}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div
          className="md-media group cursor-zoom-in"
          style={{ aspectRatio: "var(--store-img-ratio, 4 / 5)" }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLight(true)}
        >
          <Image
            src={images[active]}
            alt={alt(active)}
            fill
            priority
            sizes="(max-width: 1280px) 50vw, 40rem"
            className="object-cover transition-transform duration-200 ease-out"
            style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          {badges && <div className="pointer-events-none absolute start-4 top-4 flex gap-1.5">{badges}</div>}
          <span className="md-fab pointer-events-none absolute bottom-4 end-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
            <Expand />
          </span>
          {multiple && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(active - 1); }} aria-label="الصورة السابقة" className="md-fab absolute start-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
                <ArrowRight className="ltr:rotate-180" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); go(active + 1); }} aria-label="الصورة التالية" className="md-fab absolute end-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
                <ArrowLeft className="ltr:rotate-180" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog.Root open={light} onOpenChange={setLight}>
        <Dialog.Portal>
          <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(MD_PORTAL, "md-scrim fixed inset-0 z-50 flex flex-col bg-[#0c110f] text-white outline-none")}>
            <Dialog.Title className="sr-only">صور {name}</Dialog.Title>
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <span className="md-price text-sm opacity-80">
                {num(active + 1)} / {num(images.length)}
              </span>
              <Dialog.Close className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="إغلاق">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image src={images[active]} alt={alt(active)} fill sizes="100vw" className="object-contain" />
              {multiple && (
                <>
                  <button type="button" onClick={() => go(active - 1)} aria-label="الصورة السابقة" className="absolute start-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                    <ArrowRight className="size-5 ltr:rotate-180" />
                  </button>
                  <button type="button" onClick={() => go(active + 1)} aria-label="الصورة التالية" className="absolute end-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                    <ArrowLeft className="size-5 ltr:rotate-180" />
                  </button>
                </>
              )}
            </div>
            {multiple && (
              <div className="md-rail shrink-0 justify-center gap-2 p-4">
                {images.map((src, i) => (
                  <button key={src + i} type="button" onClick={() => setActive(i)} aria-label={`الصورة ${i + 1}`} aria-current={i === active} className={cn("relative size-14 shrink-0 overflow-hidden rounded-lg", i === active ? "ring-2 ring-white" : "opacity-50")}>
                    <Image src={src} alt="" fill sizes="56px" className="object-cover" />
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
