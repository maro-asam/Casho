"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicStory } from "@/lib/sharks/public";
import { TRACKS } from "@/lib/sharks/catalog";
import { useLang } from "../../_i18n/LanguageContext";
import Reveal from "../apple/Reveal";
import { useSharksCopy } from "./copy";
import { SharksMark, TrackGlyph } from "./Glyphs";
import ReelPlayer from "./ReelPlayer";
import SharksCTA from "./SharksCTA";

/** One selected business's story — editorial hero, reading column, honest close. */
export default function StoryView({ story, open }: { story: PublicStory; open: boolean }) {
  const c = useSharksCopy();
  const { lang } = useLang();
  const Back = lang === "ar" ? ChevronRight : ChevronLeft;

  const chapters = [
    { key: "challenge", title: c.story.challenge, body: story.challenge },
    { key: "whySelected", title: c.story.whySelected, body: story.whySelected },
    { key: "supportProvided", title: c.story.supportProvided, body: story.supportProvided },
    { key: "outcomes", title: c.story.outcomes, body: story.outcomes },
  ].filter((ch) => ch.body?.trim());

  return (
    <article>
      {/* Hero */}
      <header className="al-dark relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(20,71,230,0.3),transparent)]" />
        <div className={story.video ? "al-container-wide relative grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)] md:gap-16" : "al-container relative text-center"}>
          <div className={story.video ? "text-center md:text-start" : undefined}>
            <Link href="/sharks" className="al-link text-[15px]">
              <Back className="size-4" strokeWidth={2} />
              <SharksMark className="text-[15px] text-[#5c8aff]" />
              {c.story.back}
            </Link>
            <p className="mt-8 text-[15px] font-semibold text-(--al-muted)">{story.industry}</p>
            <h1 className="al-hero-title mt-2 text-balance">{story.businessName}</h1>
            <p className="al-subhead mt-5 max-w-[620px] text-pretty md:text-[24px]" style={story.video ? undefined : { marginInline: "auto" }}>
              {story.title}
            </p>
            {story.track && (
              <p className="mt-7 inline-flex items-center gap-2.5 text-[15px] text-(--al-muted)">
                <TrackGlyph kind={story.track} className="size-5 text-[#5c8aff]" />
                <span>
                  {c.story.track}: <span className="text-(--al-text)">{TRACKS[story.track].name[lang]}</span>
                </span>
              </p>
            )}
          </div>
          {story.video && (
            <ReelPlayer
              url={story.video.url}
              poster={story.video.poster ?? story.coverImageUrl}
              title={story.businessName}
              playLabel={c.story.play}
              className="mx-auto max-w-[min(380px,calc(78svh*9/16))]"
            />
          )}
        </div>
      </header>

      {/* Cover (when the video isn't already the hero visual) */}
      {story.coverImageUrl && !story.video && (
        <div className="al-dark pb-16 md:pb-24">
          <Reveal className="al-container-wide">
            <div className="relative aspect-4/5 overflow-hidden rounded-[32px] bg-[#1d1d1f] sm:aspect-video md:aspect-21/9">
              <Image src={story.coverImageUrl} alt={story.businessName} fill priority sizes="(min-width: 1200px) 1150px, 100vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      )}

      {/* Reading column */}
      <section className="al-section">
        <div className="al-container">
          <div className="mx-auto max-w-[680px]">
            <Reveal>
              <p className="sk-lead text-pretty">{story.summary}</p>
              {story.intro && (
                <div className="sk-prose mt-8">
                  <Paragraphs text={story.intro} />
                </div>
              )}
            </Reveal>

            {chapters.map((ch) => (
              <Reveal key={ch.key} className="mt-16 border-t border-(--al-hair) pt-10">
                <h2 className="text-[13px] font-semibold text-(--al-muted)">{ch.title}</h2>
                <div className="sk-prose mt-4">
                  <Paragraphs text={ch.body!} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {story.quote && (
        <section className="al-section al-section-surface">
          <Reveal className="al-container">
            <figure className="mx-auto max-w-[860px] text-center">
              <blockquote className="sk-quote text-balance">
                <span aria-hidden className="text-(--al-tint)">“</span>
                {story.quote.text}
                <span aria-hidden className="text-(--al-tint)">”</span>
              </blockquote>
              <figcaption className="mt-8 text-[17px] text-(--al-muted)">
                {story.quote.by} · {story.businessName}
              </figcaption>
            </figure>
          </Reveal>
        </section>
      )}

      <p className="al-container py-10 text-center text-[13px] text-(--al-faint)">{c.story.consent.replace("{name}", story.businessName)}</p>

      <SharksCTA open={open} title={{ line1: c.story.ctaTitle1, line2: c.story.ctaTitle2, body: c.story.ctaBody }} />
    </article>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line text-pretty">
            {p}
          </p>
        ))}
    </>
  );
}
