"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../_i18n/LanguageContext";
import SectionHead from "../apple/SectionHead";
import { useSharksCopy } from "./copy";
import { SharksMark } from "./Glyphs";
import SelectionField from "./SelectionField";

/** Home-page doorway to /sharks: the same field and claim, one link. */
export default function SharksTeaser() {
  const c = useSharksCopy();
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    // A brand moment: black, with the gradient emphasis (see SectionHead).
    <section id="sharks" className="al-dark al-section relative isolate overflow-hidden" aria-labelledby="sharks-teaser-title">
      <div className="sk-field-mask absolute inset-0 -z-10">
        <SelectionField />
      </div>
      <SectionHead
        id="sharks-teaser-title"
        eyebrow={
          <span className="inline-flex items-center gap-2 text-(--al-text)">
            <SharksMark className="text-[18px] text-[#5c8aff]" />
            {c.mark}
          </span>
        }
        title={c.hero.title1}
        accent={c.hero.title2}
        emphasis="gradient"
        subtitle={c.teaser.body}
      >
        <Link href="/sharks" className="al-link mt-8">
          {c.teaser.link}
          <Chevron className="size-4" strokeWidth={2} />
        </Link>
      </SectionHead>
    </section>
  );
}
