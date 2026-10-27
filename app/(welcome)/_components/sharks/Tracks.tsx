"use client";

import { BENEFITS, INVESTMENT_TRACK, TRACKS, benefitsForTrack } from "@/lib/sharks/catalog";
import type { ProgramSettings } from "@/lib/sharks/workflow";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import Reveal from "../apple/Reveal";
import { useSharksCopy } from "./copy";
import { TrackGlyph } from "./Glyphs";

/**
 * The three tracks as an editorial index — hairline rows, not a pricing grid.
 * Availability comes from the admin's program switches; Investment is always
 * shown as a future pathway with no way in.
 */
export default function Tracks({ program }: { program: ProgramSettings }) {
  const c = useSharksCopy();
  const { lang } = useLang();

  const rows = [
    { kind: "BENEFITS" as const, open: program.benefitsAvailable, body: c.tracks.benefits },
    { kind: "GROWTH" as const, open: program.growthAvailable, body: c.tracks.growth },
  ];

  return (
    <section className="al-section al-section-surface" aria-labelledby="sharks-tracks-title">
      <Reveal className="al-container text-center">
        <p className="al-eyebrow">{c.tracks.eyebrow}</p>
        <h2 id="sharks-tracks-title" className="al-section-title mt-2 text-balance">
          <span className="block">{c.tracks.title1}</span>
          <span className="block text-(--al-muted)">{c.tracks.title2}</span>
        </h2>
      </Reveal>

      <ol className="al-container mt-16 md:mt-20">
        {rows.map((row, i) => (
          <Reveal as="li" key={row.kind} delay={i * 80} className="border-t border-(--al-hair) py-10 md:py-12">
            <TrackRow
              index={i + 1}
              glyph={<TrackGlyph kind={row.kind} className="text-(--al-tint)" />}
              name={TRACKS[row.kind].name[lang]}
              short={TRACKS[row.kind].short[lang]}
              status={
                <span className="inline-flex items-center gap-2 text-[13px] font-medium">
                  <span aria-hidden className={cn("size-2 rounded-full", row.open ? "bg-[#34c759]" : "bg-(--al-faint)")} />
                  {row.open ? c.tracks.open : c.tracks.closed}
                </span>
              }
            >
              <p className="text-[17px] leading-relaxed md:text-[19px]">{row.body}</p>
              <p className="mt-6 text-[13px] font-semibold text-(--al-muted)">{c.tracks.mayInclude}</p>
              <ul className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {benefitsForTrack(row.kind).map((k) => (
                  <li key={k} className="flex gap-2.5 text-[15px] leading-relaxed text-(--al-muted)">
                    <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-(--al-tint)" />
                    {BENEFITS[k][lang]}
                  </li>
                ))}
              </ul>
            </TrackRow>
          </Reveal>
        ))}

        <Reveal as="li" delay={160} className="border-y border-(--al-hair) py-10 md:py-12">
          <TrackRow
            index={3}
            muted
            glyph={<TrackGlyph kind="INVESTMENT" className="text-(--al-muted)" />}
            name={INVESTMENT_TRACK.name[lang]}
            short={INVESTMENT_TRACK.short[lang]}
            status={<span className="inline-flex rounded-full border border-dashed border-(--al-faint) px-3 py-1 text-[12px] font-medium text-(--al-muted)">{c.tracks.future}</span>}
          >
            <p className="text-[17px] leading-relaxed text-(--al-muted) md:text-[19px]">{c.tracks.investment}</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {c.tracks.investmentPoints.map((p) => (
                <li key={p} className="text-[15px] font-medium">
                  {p}
                </li>
              ))}
            </ul>
          </TrackRow>
        </Reveal>
      </ol>

      <p className="al-container mt-10 text-center text-[15px] text-(--al-muted)">{c.tracks.footnote}</p>
    </section>
  );
}

function TrackRow({
  index,
  glyph,
  name,
  short,
  status,
  muted,
  children,
}: {
  index: number;
  glyph: React.ReactNode;
  name: string;
  short: string;
  status: React.ReactNode;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
      <header className="flex items-start gap-5">
        {glyph}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tabular-nums text-(--al-faint)">
            {String(index).padStart(2, "0")}
          </p>
          <h3 className={cn("mt-1 text-[28px] font-bold leading-tight md:text-[34px]", muted && "text-(--al-muted)")}>
            {name}
          </h3>
          <p className="mt-1 text-[15px] text-(--al-muted)">{short}</p>
          <div className="mt-4">{status}</div>
        </div>
      </header>
      <div>{children}</div>
    </article>
  );
}
