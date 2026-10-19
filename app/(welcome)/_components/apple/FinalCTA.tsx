"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import Reveal from "./Reveal";

export default function FinalCTA() {
  const c = useLandingCopy().cta;
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <section className="al-dark al-section">
      <Reveal className="al-container text-center">
        <h2 className="al-hero-title text-balance">
          <span className="block">{c.title1}</span>
          <span className="al-gradient-text block">{c.title2}</span>
        </h2>
        <p className="al-subhead mx-auto mt-6 max-w-[560px] text-pretty">{c.subtitle}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <Link href="/register" className="al-btn al-btn-filled">
            {c.primary}
          </Link>
          <Link href="/contact-us" className="al-link">
            {c.secondary}
            <Chevron className="size-4" strokeWidth={2} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
