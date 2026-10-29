"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Chevron } from "../ui";

/** Swipeable row with the section title on the start side and "View all"
 *  plus two round arrows on the end. Arrows page by the visible width and
 *  follow the reading direction. */
export default function Rail({
  children,
  label,
  eyebrow,
  title,
  sub,
  href,
  linkLabel = "عرض الكل",
  actions,
  className,
  listClassName,
}: {
  children: ReactNode;
  label: string;
  eyebrow?: ReactNode;
  title?: string;
  sub?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  className?: string;
  listClassName?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setState({ start: pos <= 2, end: pos >= max - 2 });
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

  return (
    <div className={cn("relative", className)}>
      {(title || href || actions || scrollable) && (
        <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-7">
          {title && (
            <div className="min-w-0">
              {eyebrow && <p className="rx-eyebrow mb-1.5">{eyebrow}</p>}
              <h2 className="rx-h2 text-balance">{title}</h2>
              {sub && <p className="rx-sub">{sub}</p>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 max-sm:w-full max-sm:justify-between">
            {actions}
            {href && (
              <Link href={href} className="rx-link text-sm">
                {linkLabel}
                <Chevron />
              </Link>
            )}
            {scrollable && (
              <div className="flex items-center gap-2 max-sm:hidden">
                <button type="button" onClick={() => page(-1)} disabled={state.start} aria-label="السابق" className="rx-arrow">
                  <ChevronRight className="ltr:rotate-180" />
                </button>
                <button type="button" onClick={() => page(1)} disabled={state.end} aria-label="التالي" className="rx-arrow">
                  <ChevronLeft className="ltr:rotate-180" />
                </button>
              </div>
            )}
          </div>
        </header>
      )}
      <ul ref={ref} onScroll={measure} aria-label={label} className={cn("rx-rail rx-prail rx-bleed gap-2.5 pb-1 md:gap-(--rx-gap)", listClassName)}>
        {children}
      </ul>
    </div>
  );
}
