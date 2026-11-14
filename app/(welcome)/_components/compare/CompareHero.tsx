"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../_i18n/LanguageContext";
import { useCompareCopy } from "./copy";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * The claim on its own, big: Shopify for the world (ink), Casho for Egypt
 * (brand gradient). Entrances are CSS so they run before hydration; the
 * headline lines only translate (they're the LCP).
 */
export default function CompareHero() {
  const c = useCompareCopy().hero;
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <section aria-labelledby="compare-hero-title" className="al-section cmp-hero">
      <div className="al-container-wide text-center">
        <p className="al-eyebrow cmp-fade">{c.eyebrow}</p>
        <h1 id="compare-hero-title" className="al-hero-title mx-auto mt-4 text-balance">
          <span className="cmp-rise cmp-line block">{c.title}</span>
          <span className="cmp-rise cmp-line al-gradient-text block pb-[0.06em]" style={delay(90)}>
            {c.accent}
          </span>
        </h1>
        <p className="al-subhead cmp-fade mx-auto mt-6 max-w-[600px] text-pretty" style={delay(180)}>
          {c.subtitle}
        </p>
        <div className="cmp-fade mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4" style={delay(260)}>
          <Link href="/register" className="al-btn al-btn-filled">
            {c.cta}
          </Link>
          <a href="#move" className="al-link">
            {c.move}
            <Chevron className="size-4" strokeWidth={2} />
          </a>
        </div>
        <ul
          className="cmp-fade mt-12 flex flex-wrap justify-center gap-x-7 gap-y-3 text-[15px] text-(--al-muted)"
          style={delay(340)}
        >
          {c.facts.map((fact) => (
            <li key={fact} className="inline-flex items-center gap-2">
              <Check className="size-4 shrink-0 text-(--al-tint)" strokeWidth={2.4} aria-hidden />
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
