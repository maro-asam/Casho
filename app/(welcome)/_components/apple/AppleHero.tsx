"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import HeroLine from "./HeroLine";

/**
 * "On one line." The claim on the start side; on the other, the Casho mark
 * drawn by two lanes — the shop's and the online store's — that meet, run
 * together through stock, orders and customers, and close at today's sales
 * (HeroLine.tsx). No images: the headline is the largest paint, and every
 * entrance is a CSS animation that starts before hydration.
 */
export default function AppleHero() {
  const c = useLandingCopy().hero;
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const delay = (s: number) => ({ "--hl-d": `${s}s` }) as CSSProperties;

  return (
    <section aria-labelledby="hero-title" className="hl relative isolate overflow-hidden bg-(--al-bg)">
      <div className="al-container-wide grid grid-cols-1 items-center pt-[88px] pb-6 sm:pt-[clamp(104px,15svh,132px)] sm:pb-10 lg:min-h-[min(100svh,980px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-8 lg:pt-24 lg:pb-14">
        <div className="relative z-10 min-w-0">
          <p className="hl-in inline-flex items-center gap-2 text-[13px] text-(--al-muted)" style={delay(0)}>
            <span className="font-semibold text-(--al-new)">{c.badgeNew}</span>
            <span aria-hidden className="h-3 w-px bg-(--al-hair)" />
            {c.badge}
          </p>

          <h1 id="hero-title" className="hl-title mt-4 text-(--al-text) sm:mt-5 lg:mt-6">
            {c.title.map((line, i) => (
              <span
                key={line}
                className={cn("hl-rise block font-bold", i === c.title.length - 1 && "al-gradient-text pb-[0.06em]")}
                style={{ animationDelay: `${0.06 + i * 0.08}s` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="hl-in mt-4 max-w-[460px] text-[15.5px] leading-[1.75] text-(--al-muted) text-pretty sm:mt-5 sm:text-[17px] lg:mt-7"
            style={delay(0.3)}
          >
            {c.subtitle}
          </p>

          <div className="hl-in mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 sm:mt-7 lg:mt-9" style={delay(0.4)}>
            <Link href="/register" className="al-btn al-btn-filled h-12 px-7 text-[16px] font-semibold">
              {c.cta}
            </Link>
            <Link href="#pricing" className="al-link text-[16px]">
              {c.secondary}
              <Chevron className="size-4" strokeWidth={2} />
            </Link>
          </div>
          <p className="hl-in mt-3 text-[12.5px] text-(--al-faint) sm:mt-4" style={delay(0.48)}>
            {c.note}
          </p>
        </div>

        {/* Phones: the drawing bleeds to the screen edges. */}
        <HeroLine className="-mx-[22px] mt-5 w-[calc(100%+44px)] sm:mx-auto sm:mt-8 sm:w-full sm:max-w-[620px] lg:mt-0 lg:max-w-[760px]" />
      </div>
    </section>
  );
}
