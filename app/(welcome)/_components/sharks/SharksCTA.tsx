"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../_i18n/LanguageContext";
import Reveal from "../apple/Reveal";
import { useSharksCopy } from "./copy";
import SelectionField from "./SelectionField";

/** Closing invitation. The field returns with a single dot selected — the reader's. */
export default function SharksCTA({ open, title }: { open: boolean; title?: { line1: string; line2: string; body: string } }) {
  const c = useSharksCopy();
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const t = title ?? { line1: c.cta.title1, line2: c.cta.title2, body: c.cta.subtitle };

  return (
    <section className="al-dark relative isolate overflow-hidden" aria-labelledby="sharks-cta-title">
      <div className="sk-field-mask-top absolute inset-0 -z-10">
        <SelectionField variant="single" />
      </div>
      <Reveal className="al-container pb-28 pt-56 text-center md:pb-40 md:pt-64">
        <h2 id="sharks-cta-title" className="al-hero-title text-balance">
          <span className="block">{t.line1}</span>
          <span className="al-gradient-text block">{t.line2}</span>
        </h2>
        <p className="al-subhead mx-auto mt-6 max-w-[560px] text-pretty">{t.body}</p>
        <div className="mt-10 flex flex-col items-center gap-5">
          {open ? (
            <Link href="/sharks/apply" className="al-btn al-btn-filled">
              {c.cta.apply}
            </Link>
          ) : (
            <p className="max-w-[460px] text-[17px] text-(--al-text)">{c.cta.closed}</p>
          )}
          <Link href="/register" className="al-link">
            {c.cta.notYet}
            <Chevron className="size-4" strokeWidth={2} />
          </Link>
        </div>
        <p className="mx-auto mt-10 max-w-[480px] text-[13px] leading-relaxed text-(--al-faint)">{c.cta.eligibility}</p>
      </Reveal>
    </section>
  );
}
