"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import GrowthBoard from "./GrowthBoard";
import "./hero-grow.css";

/**
 * "Start small. Grow fast. All on Casho." The claim sits on
 * the start side; behind it, the full width of the hero is a dot-matrix board
 * whose lit dots are orders (GrowthBoard.tsx): one dot under the call to
 * action, rising across the page into today's column on the far side.
 *
 * On phones and tablets the board sits under the text instead of behind it.
 * No images: the headline is the largest paint, and its entrance is CSS that
 * starts before hydration.
 */
export default function HeroGrow() {
  const c = useLandingCopy().grow;
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const delay = (s: number) => ({ "--gh-d": `${s}s` }) as CSSProperties;
  const textRef = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-labelledby="hero-title"
      className="gh relative isolate overflow-hidden bg-(--al-bg) lg:min-h-[max(720px,min(100svh,980px))]"
    >
      <div className="al-container-wide pointer-events-none relative z-10 pt-[88px] sm:pt-[clamp(112px,15svh,136px)] lg:pt-[clamp(112px,15svh,150px)]">
        <div ref={textRef} className="pointer-events-auto max-w-[620px]">
          <p className="gh-in inline-flex items-center gap-2 text-[13px] text-(--al-muted)" style={delay(0)}>
            <span className="font-semibold text-(--al-new)">{c.badgeNew}</span>
            <span aria-hidden className="h-3 w-px bg-(--al-hair)" />
            {c.badge}
          </p>

          <h1 id="hero-title" className="gh-title mt-4 text-(--al-text) sm:mt-5">
            {c.title.map((line, i) => (
              <span
                key={line}
                className={cn("gh-rise block font-bold", i === c.title.length - 1 && "al-gradient-text pb-[0.06em]")}
                style={{ animationDelay: `${0.06 + i * 0.08}s` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="gh-in mt-4 max-w-[520px] text-[15.5px] leading-[1.8] text-(--al-muted) text-balance sm:mt-5 sm:text-[17px] lg:mt-6"
            style={delay(0.3)}
          >
            {c.subtitle}
          </p>

          <div className="gh-in mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 sm:mt-7 lg:mt-8" style={delay(0.4)}>
            <Link href="/register" className="al-btn al-btn-filled h-12 px-7 text-[16px] font-semibold">
              {c.cta}
            </Link>
            <Link href="#pricing" className="al-link text-[16px]">
              {c.secondary}
              <Chevron className="size-4" strokeWidth={2} />
            </Link>
          </div>
          <p className="gh-in mt-3 text-[12.5px] text-(--al-faint) sm:mt-4" style={delay(0.48)}>
            {c.note}
          </p>
        </div>
      </div>

      <GrowthBoard
        avoidRef={textRef}
        className="mt-1 h-[330px] sm:mt-2 sm:h-[460px] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto"
      />
    </section>
  );
}
