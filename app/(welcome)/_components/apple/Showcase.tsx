"use client";

import { useState } from "react";
import { ArrowUpLeft, ArrowUpRight, Lock } from "lucide-react";
import { SHOWCASE_CATEGORIES, type ShowcaseCategory } from "@/lib/showcase/catalog";
import type { ShowcaseCard } from "@/lib/showcase/public";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import Reveal from "./Reveal";

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
    <section id="showcase" className="al-section al-section-surface scroll-mt-16" aria-labelledby="showcase-title">
      <Reveal className="al-container text-center">
        <p className="al-eyebrow">{c.eyebrow}</p>
        <h2 id="showcase-title" className="al-section-title mt-3 text-balance">
          <span className="block">{c.title1}</span>
          <span className="al-gradient-text block">{c.title2}</span>
        </h2>
        <p className="al-subhead mx-auto mt-5 max-w-[560px] text-pretty">{c.subtitle}</p>
      </Reveal>

      {categories.length > 1 && (
        <div role="group" aria-label={c.filterLabel} className="al-container-wide mt-10 flex flex-wrap justify-center gap-2">
          <Chip active={category === null} onClick={() => pick(null)}>
            {c.all}
          </Chip>
          {categories.map((key) => (
            <Chip key={key} active={category === key} onClick={() => pick(key)}>
              {SHOWCASE_CATEGORIES[key][lang]}
            </Chip>
          ))}
        </div>
      )}

      <ul className={cn("al-container-wide grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3", categories.length > 1 ? "mt-10" : "mt-14 md:mt-16")}>
        {shown.map((site, i) => (
          <Reveal key={site.id} as="li" delay={(i % 3) * 80}>
            <a href={site.url} target="_blank" rel="noopener" className="sc-card group block rounded-[22px] focus-visible:outline-none">
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
                  <h3 className="truncate text-[19px] leading-7 font-bold">{site.name}</h3>
                  <p className="text-[15px] text-(--al-muted)">{SHOWCASE_CATEGORIES[site.category][lang]}</p>
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
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-9 rounded-full px-4 text-[15px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--al-tint)",
        active ? "bg-(--al-text) font-medium text-(--al-bg)" : "bg-(--al-card) text-(--al-text) hover:bg-(--al-hair)",
      )}
    >
      {children}
    </button>
  );
}
