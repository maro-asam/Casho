"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionHead } from "../ui";

/** A shelf of pieces that slides sideways: the head on the start with two
 *  hairline arrows on the end (following the reading direction), the cards
 *  starting at the content column and running off the screen's end. */
export default function Rail({
  children,
  label,
  title,
  kicker,
  href,
  linkLabel = "عرض الكل",
  actions,
  className,
  listClassName,
}: {
  children: ReactNode;
  label: string;
  title?: string;
  kicker?: string;
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
  const arrows = scrollable && (
    <div className="flex gap-2 max-sm:hidden">
      <button type="button" onClick={() => page(-1)} disabled={state.start} aria-label="السابق" className="qr-paddle">
        <ChevronRight className="ltr:rotate-180" />
      </button>
      <button type="button" onClick={() => page(1)} disabled={state.end} aria-label="التالي" className="qr-paddle">
        <ChevronLeft className="ltr:rotate-180" />
      </button>
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      {title && (
        <div className="qr-wrap">
          <SectionHead
            kicker={kicker}
            title={title}
            href={href}
            linkLabel={linkLabel}
            align="start"
            actions={
              <>
                {actions}
                {arrows}
              </>
            }
          />
        </div>
      )}
      <ul ref={ref} onScroll={measure} aria-label={label} className={cn("qr-shelf", listClassName)}>
        {children}
      </ul>
    </div>
  );
}
