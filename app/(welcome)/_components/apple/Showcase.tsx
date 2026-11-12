"use client";

import { useState } from "react";
import { ArrowUpLeft, ArrowUpRight, Lock } from "lucide-react";
import { SHOWCASE_CATEGORIES, type ShowcaseCategory } from "@/lib/showcase/catalog";
import type { ShowcaseCard } from "@/lib/showcase/public";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

const PAGE = 6;

/** "Casho examples": live stores built on Casho, managed at /admin/showcase. */
export default function Showcase({ sites }: { sites: ShowcaseCard[] }) {
  const c = useLandingCopy().showcase;
  const { lang } = useLang();
  const [category, setCategory] = useState<ShowcaseCategory | null>(null);
  const [limit, setLimit] = useState(PAGE);

  // Filter chips only for fields that have examples, in the order they first appear.
  const categories = [...new Set(sites.map((s) => s.category))];
  const filtered = category ? sites.filter((s) => s.category === category) : sites;
  const shown = filtered.slice(0, limit);

  const pick = (next: ShowcaseCategory | null) => {
    setCategory(next);
    setLimit(PAGE);
  };

  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;

  return (
    <section id="showcase" className="al-section scroll-mt-16" aria-labelledby="showcase-title">
      <SectionHead id="showcase-title" eyebrow={c.eyebrow} title={c.title1} accent={c.title2} subtitle={c.subtitle} />

      {categories.length > 1 && (
        // One scrolling row on phones (centred while it fits), wrapped on wider screens.
        <div className="al-body overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div role="group" aria-label={c.filterLabel} className="mx-auto flex w-max gap-2 px-[22px] md:w-auto md:max-w-[1200px] md:flex-wrap md:justify-center">
            <Chip active={category === null} onClick={() => pick(null)}>
              {c.all}
            </Chip>
            {categories.map((key) => (
              <Chip key={key} active={category === key} onClick={() => pick(key)}>
                {SHOWCASE_CATEGORIES[key][lang]}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Flex, not grid, so a short last row (or a single example) sits centred. */}
      <ul className={cn("al-container-wide flex flex-wrap justify-center gap-x-6 gap-y-12", categories.length > 1 ? "mt-10" : "al-body")}>
        {shown.map((site, i) => (
          <Reveal key={site.id} as="li" delay={(i % 3) * 80} className="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)]">
            <a href={site.url} target="_blank" rel="noopener" className="sc-card group block rounded-(--al-r-md) focus-visible:outline-none">
              <div className="sc-frame">
                <div className="sc-bar" dir="ltr" aria-hidden>
                  <span className="sc-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="sc-address">
                    <Lock className="size-2.5 shrink-0" strokeWidth={2.4} />
                    <span className="truncate">{site.host}</span>
                  </span>
                </div>
                <div className="sc-shot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={site.imageUrl} alt="" loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4 px-1">
                <div className="min-w-0">
                  <h3 className="al-item-title truncate">{site.name}</h3>
                  <p className="al-item-note">{SHOWCASE_CATEGORIES[site.category][lang]}</p>
                </div>
                <span className="sc-visit">
                  {c.visit}
                  <Arrow className="size-4" strokeWidth={2} />
                  <span className="sr-only">{c.newTab}</span>
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </ul>

      {filtered.length > limit && (
        <div className="mt-14 text-center">
          <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="al-btn al-btn-gray">
            {c.more}
          </button>
        </div>
      )}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="al-chip">
      {children}
    </button>
  );
}
