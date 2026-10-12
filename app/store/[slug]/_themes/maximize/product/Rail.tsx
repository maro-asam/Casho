"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Horizontal scroller with prev/next arrows and a thin progress line
 *  (Maximize's carousel controls). Swipe works natively; arrows page by the
 *  visible width and follow the reading direction. */
export default function Rail({
  children,
  label,
  className,
  listClassName,
  controls = "overlay",
}: {
  children: ReactNode;
  label: string;
  className?: string;
  listClassName?: string;
  /** `overlay`: round arrows on the sides (desktop). `below`: arrows and a
   *  progress line under the rail (all sizes). */
  controls?: "overlay" | "below";
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ start: true, end: true, progress: 0, ratio: 1 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setState({ start: pos <= 2, end: pos >= max - 2, progress: max > 0 ? pos / max : 0, ratio: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const page = (step: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: el.clientWidth * 0.9 * step * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const scrollable = !(state.start && state.end);
  const bar = Math.min(1, Math.max(0.12, state.ratio));
  const arrow = "mx-fab size-10 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className={cn("relative", className)}>
      <ul ref={ref} onScroll={measure} aria-label={label} className={cn("mx-rail mx-prail gap-(--mx-gap)", listClassName)}>
        {children}
      </ul>
      {scrollable && controls === "overlay" && (
        <>
          <button type="button" onClick={() => page(-1)} disabled={state.start} aria-label="السابق" className={cn(arrow, "absolute -start-4 top-[30%] z-[3] hidden lg:grid")}>
            <ChevronRight className="ltr:rotate-180" />
          </button>
          <button type="button" onClick={() => page(1)} disabled={state.end} aria-label="التالي" className={cn(arrow, "absolute -end-4 top-[30%] z-[3] hidden lg:grid")}>
            <ChevronLeft className="ltr:rotate-180" />
          </button>
        </>
      )}
      {scrollable && (
        <div className={cn("mt-5 flex items-center justify-center gap-4", controls === "overlay" && "lg:hidden")}>
          <button type="button" onClick={() => page(-1)} disabled={state.start} aria-label="السابق" className="mx-icon size-9 disabled:opacity-30 [&_svg]:size-5">
            <ChevronRight className="ltr:rotate-180" />
          </button>
          <span aria-hidden className="relative h-0.5 w-32 overflow-hidden rounded-full bg-(--mx-line)">
            <span
              className="absolute inset-y-0 start-0 rounded-full bg-(--mx-ink) transition-transform duration-200"
              style={{ width: `${bar * 100}%`, transform: `translateX(calc(${state.progress * (1 / bar - 1) * 100}% * var(--mx-dir) * -1))` }}
            />
          </span>
          <button type="button" onClick={() => page(1)} disabled={state.end} aria-label="التالي" className="mx-icon size-9 disabled:opacity-30 [&_svg]:size-5">
            <ChevronLeft className="ltr:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
