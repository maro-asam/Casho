"use client";

import Image from "next/image";
import { useMemo, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  productName: string;
  mainImage: string;
  images: string[];
  className?: string;
  portrait?: boolean;
};

export default function ProductGallery({
  productName,
  mainImage,
  images,
  className,
  portrait,
}: ProductGalleryProps) {
  const gallery = useMemo(() => {
    const merged = [mainImage, ...images];
    return [...new Set(merged.filter(Boolean))];
  }, [mainImage, images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = gallery[activeIndex] ?? mainImage;

  const selectImage = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      setIsHovered(false);
      setActiveIndex(index);
    },
    [activeIndex],
  );

  const goNext = useCallback(
    () => selectImage((activeIndex + 1) % gallery.length),
    [activeIndex, gallery.length, selectImage],
  );

  const goPrev = useCallback(
    () => selectImage((activeIndex - 1 + gallery.length) % gallery.length),
    [activeIndex, gallery.length, selectImage],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      setZoomPos({ x, y });
    },
    [],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (Math.abs(dx) > 40 && dy < 60) {
        if (dx > 0) goPrev();
        else goNext();
      }
    },
    [goNext, goPrev],
  );

  // ── Portrait layout (bold theme split-screen) ─────────────────────────────
  if (portrait) {
    return (
      <div className={cn("flex h-full flex-col gap-1.5", className)}>
        <div
          className="relative min-h-0 flex-1 overflow-hidden bg-muted/10 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={activeImage}
            alt={productName}
            fill
            priority
            className="object-cover transition-opacity duration-300"
          />
          {gallery.length > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="الصورة السابقة"
                className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                onClick={goNext}
                aria-label="الصورة التالية"
                className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="size-4" />
              </button>
            </>
          )}
          {gallery.length > 1 && (
            <div className="absolute bottom-3 end-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {activeIndex + 1}/{gallery.length}
            </div>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="flex shrink-0 gap-1.5 overflow-x-auto px-3 pb-3 scrollbar-hide">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => selectImage(i)}
                className={cn(
                  "relative h-14 w-10 shrink-0 overflow-hidden border-2 transition-all duration-200",
                  activeIndex === i
                    ? "border-black opacity-100"
                    : "border-transparent opacity-40 hover:opacity-70",
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Standard layout ───────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex gap-3">
        {/* Vertical thumbnail strip — desktop only */}
        {gallery.length > 1 && (
          <div className="hidden lg:flex w-[76px] shrink-0 flex-col gap-2">
            {gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => selectImage(i)}
                className={cn(
                  "relative h-[76px] w-[76px] shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200",
                  activeIndex === i
                    ? "border-[color:var(--store-primary)] opacity-100 ring-2 ring-[color:var(--store-primary)]/25"
                    : "border-transparent opacity-50 hover:opacity-80 hover:border-[color:var(--store-border)]",
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div
          ref={containerRef}
          className={cn(
            "group relative flex-1 select-none overflow-hidden rounded-2xl border border-border/30 bg-muted/20",
            isHovered ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
          style={{ aspectRatio: "1 / 1" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setZoomPos({ x: 50, y: 50 });
          }}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={activeImage}
            alt={productName}
            fill
            priority
            className="object-cover transition-transform duration-200"
            style={{
              transform: isHovered ? "scale(1.35)" : "scale(1)",
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
          />

          {/* Nav arrows */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="الصورة السابقة"
                className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-200 hover:bg-white hover:shadow-xl group-hover:opacity-100 dark:bg-black/70 dark:hover:bg-black/90"
              >
                <ChevronRight className="size-4 text-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="الصورة التالية"
                className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-200 hover:bg-white hover:shadow-xl group-hover:opacity-100 dark:bg-black/70 dark:hover:bg-black/90"
              >
                <ChevronLeft className="size-4 text-foreground" />
              </button>
            </>
          )}

          {/* Image count */}
          {gallery.length > 1 && (
            <div className="absolute bottom-3 end-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {activeIndex + 1}/{gallery.length}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal thumbnail strip — mobile only */}
      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => selectImage(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200",
                activeIndex === i
                  ? "border-[color:var(--store-primary)] opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80",
              )}
            >
              <Image
                src={img}
                alt={`${productName} ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
