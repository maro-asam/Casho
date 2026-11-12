import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

/**
 * Every section on the landing opens the same way: an eyebrow, a two-tone
 * headline (the claim in ink, the second beat in gray), one short subhead.
 * The blue gradient is kept for the page's brand moments only (hero, Sharks,
 * final CTA) — pass `emphasis="gradient"` there.
 */
export default function SectionHead({
  id,
  eyebrow,
  title,
  accent,
  subtitle,
  emphasis = "muted",
  className,
  children,
}: {
  /** Put on the <h2>; point the section's aria-labelledby at it. */
  id?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  subtitle?: ReactNode;
  emphasis?: "muted" | "gradient";
  className?: string;
  /** Controls that belong to the header (e.g. the billing switch). */
  children?: ReactNode;
}) {
  return (
    <Reveal className={cn("al-container text-center", className)}>
      {eyebrow ? <p className="al-eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className={cn("al-section-title mx-auto max-w-[880px] text-balance", eyebrow ? "mt-3" : null)}>
        <span className="block">{title}</span>
        {accent ? (
          <span className={cn("block", emphasis === "gradient" ? "al-gradient-text pb-[0.06em]" : "text-(--al-muted)")}>
            {accent}
          </span>
        ) : null}
      </h2>
      {subtitle ? <p className="al-subhead mx-auto mt-5 max-w-[600px] text-pretty">{subtitle}</p> : null}
      {children}
    </Reveal>
  );
}
