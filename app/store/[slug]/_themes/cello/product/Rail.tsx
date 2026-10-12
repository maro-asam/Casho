"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Cello carousel: the section title and italic subtitle on the start side,
 *  an underlined "View all" link and two square arrows (pale previous, navy
 *  next) on the end, then a swipeable row. Arrows page by the visible width
 *  and follow the reading direction. */
export default function Rail({
  children,
  label,
  title,
  sub,
  href,
  linkLabel = "عرض الكل",
  actions,
  className,
  listClassName,
  headingLevel = 2,
}: {
  children: ReactNode;
  label: string;
  title?: string;
  sub?: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  className?: string;
  listClassName?: string;
  headingLevel?: 2 | 3;
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
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const arrows = scrollable && (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => page(-1)} disabled={state.start} aria-label="السابق" className="ce-arrow">
        <ChevronRight className="ltr:rotate-180" />
      </button>
      <button type="button" onClick={() => page(1)} disabled={state.end} aria-label="التالي" className="ce-arrow">
        <ChevronLeft className="ltr:rotate-180" />
      </button>
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      {(title || href || actions || scrollable) && (
        <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8">
          {title && (
            <div className="min-w-0">
              <Heading className="ce-h2 text-balance">{title}</Heading>
              {sub && <p className="ce-sub">{sub}</p>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 max-sm:w-full max-sm:justify-between">
            {actions}
            {href && (
              <Link href={href} className="ce-link text-[0.9375rem] font-medium text-(--ce-ink)">
                {linkLabel}
              </Link>
            )}
            {arrows}
          </div>
        </header>
      )}
      <ul ref={ref} onScroll={measure} aria-label={label} className={cn("ce-rail ce-prail gap-2.5 md:gap-(--ce-gap)", listClassName)}>
        {children}
      </ul>
    </div>
  );
}
