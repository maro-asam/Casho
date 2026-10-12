"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import { DN_PORTAL, num } from "../ui";

/** Desktop: main image with hover zoom and a thumbnail row beneath; click
 *  opens a fullscreen lightbox. Phones: swipe strip with a counter. */
export default function Gallery({ images, name, tags }: { images: string[]; name: string; tags?: React.ReactNode }) {
  // Only used by the (initially closed) lightbox, so reading the DOM up front is safe.
  const [dir] = useState<"rtl" | "ltr">(() =>
    typeof document !== "undefined" && document.querySelector(".theme-dune")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl",
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
      <div className="relative -mx-(--dn-gutter) lg:hidden">
        <div ref={railRef} onScroll={onScroll} className="dn-rail" aria-roledescription="carousel" aria-label={`صور ${name}`}>
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => {
                setActive(i);
                setLight(true);
              }}
              aria-label={`تكبير الصورة ${i + 1}`}
              className="relative aspect-square w-full shrink-0 basis-full bg-(--dn-plate)"
            >
              <Image src={src} alt={alt(i)} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {tags && <div className="pointer-events-none absolute start-0 top-0 flex flex-col items-start">{tags}</div>}
        {multiple && (
          <span className="dn-num pointer-events-none absolute bottom-3 end-(--dn-gutter) bg-(--dn-drawer)/90 px-2.5 py-1 text-sm" aria-hidden>
            {num(active + 1)} / {num(images.length)}
          </span>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div
          className="dn-media group aspect-square cursor-zoom-in"
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
            sizes="(max-width: 1280px) 55vw, 44rem"
            className="animate-[dn-fade_500ms_ease-out] object-cover transition-transform duration-300 ease-out"
            style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          {tags && <div className="pointer-events-none absolute start-0 top-0 flex flex-col items-start">{tags}</div>}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLight(true);
            }}
            aria-label="عرض الصور بملء الشاشة"
            className="dn-fab absolute bottom-4 end-4 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Expand />
          </button>
        </div>
        {multiple && (
          <div className="mt-(--dn-gap) grid grid-cols-5 gap-(--dn-gap) xl:grid-cols-6">
            {images.slice(0, 12).map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`عرض الصورة ${i + 1}`}
                aria-current={i === active}
                className={cn("dn-media aspect-square transition-opacity duration-300", i === active ? "outline outline-1 outline-offset-2 outline-(--dn-ink)" : "opacity-55 hover:opacity-100")}
              >
                <Image src={src} alt="" fill sizes="7rem" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog.Root open={light} onOpenChange={setLight}>
        <Dialog.Portal>
          <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(DN_PORTAL, "dn-scrim fixed inset-0 z-50 flex flex-col bg-(--dn-drawer) outline-none")}>
            <Dialog.Title className="sr-only">صور {name}</Dialog.Title>
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <span className="dn-num text-lg text-(--dn-quiet)">
                {num(active + 1)} / {num(images.length)}
              </span>
              <Dialog.Close className="dn-icon -me-2.5" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image key={active} src={images[active]} alt={alt(active)} fill sizes="100vw" className="animate-[dn-fade_400ms_ease-out] object-contain" />
              {multiple && (
                <>
                  <button type="button" onClick={() => go(active - 1)} aria-label="الصورة السابقة" className="dn-fab absolute start-4 top-1/2 size-12 -translate-y-1/2">
                    <ArrowRight className="ltr:rotate-180" />
                  </button>
                  <button type="button" onClick={() => go(active + 1)} aria-label="الصورة التالية" className="dn-fab absolute end-4 top-1/2 size-12 -translate-y-1/2">
                    <ArrowLeft className="ltr:rotate-180" />
                  </button>
                </>
              )}
            </div>
            {multiple && (
              <div className="dn-rail shrink-0 justify-center gap-2 p-4">
                {images.map((src, i) => (
                  <button key={src + i} type="button" onClick={() => setActive(i)} aria-label={`الصورة ${i + 1}`} aria-current={i === active} className={cn("relative size-14 shrink-0 overflow-hidden", i === active ? "outline outline-1 outline-offset-2 outline-(--dn-ink)" : "opacity-50")}>
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
