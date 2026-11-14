"use client";

import Link from "next/link";
import Reveal from "../apple/Reveal";
import SectionHead from "../apple/SectionHead";
import { useCompareCopy } from "./copy";

/** The Shopify import in three steps — each one is how the real importer behaves. */
export default function MoveFromShopify() {
  const c = useCompareCopy().move;

  return (
    <section id="move" aria-labelledby="move-title" className="al-section al-section-surface scroll-mt-16">
      <SectionHead id="move-title" eyebrow={c.eyebrow} title={c.title} accent={c.accent} subtitle={c.subtitle} />

      <div className="al-container-wide al-body">
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {c.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 80} className="al-tile flex flex-col gap-10 p-7 md:p-9">
              <span className="text-[56px] font-bold leading-none tabular-nums text-(--al-faint)" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="text-[24px] font-bold leading-snug md:text-[28px]">{step.title}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-(--al-muted)">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={120} className="mt-12 flex flex-col items-center gap-5 text-center">
          <Link href="/register" className="al-btn al-btn-filled">
            {c.cta}
          </Link>
          <p className="max-w-[560px] text-[15px] leading-relaxed text-(--al-muted)">{c.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
