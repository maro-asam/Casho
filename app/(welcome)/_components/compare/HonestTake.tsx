"use client";

import { Code2, Globe2, LayoutGrid, type LucideIcon } from "lucide-react";
import Reveal from "../apple/Reveal";
import SectionHead from "../apple/SectionHead";
import { COMPARE_SOURCES, useCompareCopy } from "./copy";

const ICONS: LucideIcon[] = [Globe2, LayoutGrid, Code2];

/**
 * Where Shopify is the better pick — said plainly, so the rest of the page
 * reads as a comparison and not an ad. Ends with the dated sources for every
 * Shopify fact on the page and the trademark line.
 */
export default function HonestTake() {
  const copy = useCompareCopy();
  const c = copy.honest;
  const s = copy.sources;

  return (
    <section id="honest" aria-labelledby="honest-title" className="al-section scroll-mt-16">
      <SectionHead id="honest-title" eyebrow={c.eyebrow} title={c.title} accent={c.accent} />

      <div className="al-container-wide al-body">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {c.items.map((item, i) => {
            const Icon = ICONS[i] ?? Globe2;
            return (
              <Reveal key={item.title} delay={i * 80} className="al-tile flex flex-col gap-10 p-7 md:p-9">
                <Icon className="size-8 text-(--al-text)" strokeWidth={1.6} aria-hidden />
                <div>
                  <h3 className="text-[24px] font-bold leading-snug md:text-[28px]">{item.title}</h3>
                  <p className="mt-3 text-[17px] leading-relaxed text-(--al-muted)">{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mx-auto mt-16 max-w-[760px] text-center md:mt-20">
          <p className="text-[24px] font-bold leading-snug text-balance md:text-[32px]">{c.closer}</p>
        </Reveal>

        <div className="mx-auto mt-16 max-w-[760px] border-t border-(--al-hair) pt-6 text-center text-[12px] leading-relaxed text-(--al-muted) md:mt-20">
          <p>
            {s.lead}{" "}
            {COMPARE_SOURCES.map((source, i) => (
              <span key={source.key}>
                {i > 0 ? " · " : null}
                <a
                  href={source.href}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-(--al-text)"
                >
                  {s.labels[source.key]}
                </a>
              </span>
            ))}
          </p>
          <p className="mt-2">{s.trademark}</p>
        </div>
      </div>
    </section>
  );
}
