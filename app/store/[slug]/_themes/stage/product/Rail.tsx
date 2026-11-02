"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionHeader } from "../ui";

/** apple.com store shelf: the headline sits in the content column, the cards
 *  start under it and run off the end of the screen, and two round paddles
 *  under the shelf page by the visible width (following the reading
 *  direction). */
export default function Rail({
  children,
  label,
  title,
  tagline,
  href,
  linkLabel = "عرض الكل",
  actions,
  className,
  listClassName,
}: {
  children: ReactNode;
  label: string;
  title?: string;
  tagline?: string;
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
    el.scrollBy({ left: el.clientWidth * 0.8 * step * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const scrollable = !(state.start && state.end);

  return (
    <div className={cn("relative", className)}>
      {title && (
        <div className="sg-wrap">
          <SectionHeader title={title} tagline={tagline} href={href} linkLabel={linkLabel} actions={actions} />
        </div>
      )}
      <ul ref={ref} onScroll={measure} aria-label={label} className={cn("sg-shelf", listClassName)}>
        {children}
      </ul>
      {scrollable && (
        <div className="sg-wrap flex justify-end gap-3 pt-4 max-sm:hidden">
          <button type="button" onClick={() => page(-1)} disabled={state.start} aria-label="السابق" className="sg-paddle">
            <ChevronRight className="ltr:rotate-180" />
          </button>
          <button type="button" onClick={() => page(1)} disabled={state.end} aria-label="التالي" className="sg-paddle">
            <ChevronLeft className="ltr:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
