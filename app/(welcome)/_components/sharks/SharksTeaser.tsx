"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../_i18n/LanguageContext";
import Reveal from "../apple/Reveal";
import { useSharksCopy } from "./copy";
import { SharksMark } from "./Glyphs";
import SelectionField from "./SelectionField";

/** Home-page doorway to /sharks: the same field and claim, one link. */
export default function SharksTeaser() {
  const c = useSharksCopy();
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <section id="sharks" className="al-dark relative isolate overflow-hidden" aria-labelledby="sharks-teaser-title">
      <div className="sk-field-mask absolute inset-0 -z-10">
        <SelectionField />
      </div>
      <Reveal className="al-container py-32 text-center md:py-44">
        <p className="sk-eyebrow inline-flex items-center gap-2 text-[#5c8aff]">
          <SharksMark className="text-[18px]" />
          <span className="text-(--al-text)">{c.mark}</span>
        </p>
        <h2 id="sharks-teaser-title" className="al-section-title mt-4 text-balance">
          <span className="block">{c.hero.title1}</span>
          <span className="al-gradient-text block">{c.hero.title2}</span>
        </h2>
        <p className="al-subhead mx-auto mt-5 max-w-[520px] text-pretty">{c.teaser.body}</p>
        <Link href="/sharks" className="al-link mt-8">
          {c.teaser.link}
          <Chevron className="size-4" strokeWidth={2} />
        </Link>
      </Reveal>
    </section>
  );
}
