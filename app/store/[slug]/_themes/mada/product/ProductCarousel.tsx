"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Horizontal rail with snap scrolling, swipe on touch and arrow buttons on
 *  desktop. Children are the slides (each sets its own width). */
export function Carousel({ children, label, className, controlsClassName }: { children: ReactNode; label: string; className?: string; controlsClassName?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos <= 2, end: pos >= max - 2 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: el.clientWidth * 0.85 * dir * (rtl ? -1 : 1), behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)} role="region" aria-roledescription="carousel" aria-label={label}>
      <ul ref={ref} onScroll={update} className="md-rail md-bleed gap-3 sm:gap-5">
        {children}
      </ul>
      {!(edges.start && edges.end) && (
        <div className={cn("pointer-events-none absolute inset-x-0 top-[38%] hidden justify-between lg:flex", controlsClassName)}>
          <button
            type="button"
            onClick={() => page(-1)}
            aria-label="السابق"
            className={cn("md-fab pointer-events-auto -ms-5 size-12 transition-opacity", edges.start && "pointer-events-none opacity-0")}
          >
            <ArrowRight className="ltr:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            aria-label="التالي"
            className={cn("md-fab pointer-events-auto -me-5 size-12 transition-opacity", edges.end && "pointer-events-none opacity-0")}
          >
            <ArrowLeft className="ltr:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Standard slide widths for product rails. */
export const SLIDE = "w-[46%] shrink-0 sm:w-[31%] lg:w-[calc((100%-3.75rem)/4)]";
