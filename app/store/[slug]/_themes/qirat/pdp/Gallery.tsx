"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@/lib/utils";
import { QR_PORTAL, num } from "../ui";

/** Frames follow the Studio's image ratio, so product photos fill them. */
const RATIO = { aspectRatio: "var(--store-img-ratio, 3 / 4)" };

/** One photo on its plate with a jeweler's loupe: hovering magnifies the spot
 *  under the pointer. */
function Loupe({ src, alt, sizes, priority, onOpen, className }: { src: string; alt: string; sizes: string; priority?: boolean; onOpen: () => void; className?: string }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`تكبير: ${alt}`}
      className={cn("qr-plate qr-loupe group", className)}
      style={RATIO}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setAt({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseLeave={() => setAt(null)}
    >
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover transition-transform duration-200 ease-out" style={at ? { transform: "scale(2)", transformOrigin: `${at.x}% ${at.y}%` } : undefined} />
      <span aria-hidden className="qr-glint" />
    </button>
  );
}

/** Desktop: every photo on its own plate — the first full width, the rest
 *  two to a row — each with a loupe; a click opens the lightbox. Phones: a
 *  swipe strip with a counter and dots. */
export default function Gallery({ images, name }: { images: string[]; name: string }) {
  // Only read in handlers and the (initially closed) lightbox, so reading the DOM up front is safe.
  const [dir] = useState<"rtl" | "ltr">(() => (typeof document !== "undefined" && document.querySelector(".theme-qirat")?.getAttribute("dir") === "ltr" ? "ltr" : "rtl"));
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [light, setLight] = useState<number | null>(null);
  const multiple = images.length > 1;
  const alt = (i: number) => (i === 0 ? name : `${name} — صورة ${i + 1}`);
  const go = useCallback((i: number) => setLight((i + images.length) % images.length), [images.length]);

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
    if (light === null) return;
    const onKey = (e: KeyboardEvent) => {
      const rtl = dir === "rtl";
      if (e.key === "ArrowLeft") go(light + (rtl ? 1 : -1));
      if (e.key === "ArrowRight") go(light + (rtl ? -1 : 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [light, dir, go]);

  return (
    <>
      {/* Phones */}
      <div className="relative lg:hidden">
        <div ref={railRef} onScroll={onScroll} className="qr-rail qr-bleed" aria-roledescription="carousel" aria-label={`صور ${name}`}>
          {images.map((src, i) => (
            <button key={src + i} type="button" onClick={() => setLight(i)} aria-label={`تكبير الصورة ${i + 1}`} className="qr-plate relative w-full shrink-0 basis-full overflow-hidden" style={RATIO}>
              <Image src={src} alt={alt(i)} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {multiple && (
          <>
            <span className="qr-gallery-count qr-num">
              {num(active + 1)} / {num(images.length)}
            </span>
            <div className="mt-3 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button key={i} type="button" onClick={() => scrollTo(i)} aria-label={`الصورة ${i + 1}`} aria-current={i === active} className="qr-pip" />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desktop */}
      <div className="qr-stack max-lg:hidden" data-n={Math.min(images.length, 7)}>
        {images.slice(0, 7).map((src, i) => (
          <Loupe key={src + i} src={src} alt={alt(i)} priority={i === 0} sizes={i === 0 ? "(max-width: 1280px) 55vw, 44rem" : "(max-width: 1280px) 28vw, 22rem"} onOpen={() => setLight(i)} />
        ))}
        <span aria-hidden className="qr-stack-hint">
          <ZoomIn className="size-3.5" />
          مرّر على الصورة للتكبير
        </span>
      </div>

      {/* Lightbox */}
      <Dialog.Root open={light !== null} onOpenChange={(o) => !o && setLight(null)}>
        <Dialog.Portal>
          <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(QR_PORTAL, "fixed inset-0 z-50 flex flex-col bg-(--qr-sheet) outline-none")}>
            <Dialog.Title className="sr-only">صور {name}</Dialog.Title>
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <span className="qr-num text-sm">
                {num((light ?? 0) + 1)} / {num(images.length)}
              </span>
              <Dialog.Close className="qr-icon -me-2" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <div className="relative min-h-0 flex-1">
              {light !== null && <Image key={light} src={images[light]} alt={alt(light)} fill sizes="100vw" className="qr-pop object-contain" />}
              {multiple && light !== null && (
                <>
                  <button type="button" onClick={() => go(light - 1)} aria-label="الصورة السابقة" className="qr-fab absolute start-4 top-1/2 size-12 -translate-y-1/2">
                    <ChevronRight className="ltr:rotate-180" />
                  </button>
                  <button type="button" onClick={() => go(light + 1)} aria-label="الصورة التالية" className="qr-fab absolute end-4 top-1/2 size-12 -translate-y-1/2">
                    <ChevronLeft className="ltr:rotate-180" />
                  </button>
                </>
              )}
            </div>
            {multiple && (
              <div className="qr-rail shrink-0 justify-center gap-2 p-4">
                {images.map((src, i) => (
                  <button key={src + i} type="button" onClick={() => setLight(i)} aria-label={`الصورة ${i + 1}`} aria-current={i === light} className="qr-thumb w-14 shrink-0">
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
