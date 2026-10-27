"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { PublicStory } from "@/lib/sharks/public";
import { TRACKS } from "@/lib/sharks/catalog";
import { parseVideoUrl } from "@/lib/sharks/video";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import Reveal from "../apple/Reveal";
import { useSharksCopy } from "./copy";
import { SharksMark, TrackGlyph } from "./Glyphs";

export type StoryCardData = Pick<PublicStory, "slug" | "businessName" | "industry" | "summary" | "coverImageUrl" | "logoUrl" | "track" | "video">;

/** Best still for a story: its cover, else the video's poster or thumbnail. */
export function storyImage(s: Pick<PublicStory, "coverImageUrl" | "video">) {
  if (s.coverImageUrl) return s.coverImageUrl;
  if (s.video?.poster) return s.video.poster;
  const v = parseVideoUrl(s.video?.url);
  return v?.kind === "youtube" ? v.thumbnail : null;
}

export default function MeetTheSharks({ stories, open }: { stories: StoryCardData[]; open: boolean }) {
  const c = useSharksCopy();
  const [featured, ...rest] = stories;

  return (
    <section id="selected" className="al-dark al-section scroll-mt-12" aria-labelledby="sharks-meet-title">
      <Reveal className="al-container text-center">
        <p className="al-eyebrow">{c.meet.eyebrow}</p>
        <h2 id="sharks-meet-title" className="al-section-title mt-2 text-balance">
          {c.meet.title}
        </h2>
        <p className="al-subhead mx-auto mt-4 max-w-[560px] text-pretty">{c.meet.subtitle}</p>
      </Reveal>

      {featured ? (
        <>
          <Featured story={featured} />
          {rest.length > 0 && <StoryRail stories={rest} />}
        </>
      ) : (
        <EmptyState open={open} />
      )}
    </section>
  );
}

function TrackLine({ track, className }: { track: StoryCardData["track"]; className?: string }) {
  const { lang } = useLang();
  if (!track) return null;
  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px] text-(--al-muted)", className)}>
      <TrackGlyph kind={track} className="size-4 text-[#5c8aff]" />
      {TRACKS[track].name[lang]}
    </span>
  );
}

function Cover({ story, priority, sizes }: { story: StoryCardData; priority?: boolean; sizes: string }) {
  const src = storyImage(story);
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    );
  }
  // No photography yet: a typographic cover, never a stock image.
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_80%_at_50%_0%,#0b2a8f,#000_70%)]">
      {story.logoUrl ? (
        <Image src={story.logoUrl} alt="" width={120} height={120} className="size-24 rounded-[22px] object-contain" />
      ) : (
        <span className="text-[88px] font-bold leading-none text-white/90">{story.businessName.trim().slice(0, 1)}</span>
      )}
    </div>
  );
}

function VideoBadge() {
  const c = useSharksCopy();
  return (
    <span className="al-glass absolute top-4 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-[#1d1d1f] inset-s-4 dark:text-(--al-text)">
      <Play className="size-3 fill-current" strokeWidth={0} />
      {c.meet.watch}
    </span>
  );
}

function Featured({ story }: { story: StoryCardData }) {
  const c = useSharksCopy();
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <Reveal className="al-container-wide mt-16 md:mt-20">
      <Link
        href={`/sharks/${story.slug}`}
        className="group grid items-center gap-10 rounded-[32px] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#5c8aff] md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]"
      >
        <div className="order-2 text-center md:order-1 md:text-start">
          <p className="text-[13px] font-semibold tracking-wide text-(--al-muted)">{story.industry}</p>
          <h3 className="mt-3 text-[clamp(40px,6vw,72px)] font-bold leading-[1.15] text-balance">{story.businessName}</h3>
          <p className="al-subhead mx-auto mt-5 max-w-[520px] text-pretty md:mx-0">{story.summary}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-start">
            <TrackLine track={story.track} />
            <span className="al-link">
              {c.meet.read}
              <Chevron className="size-4" strokeWidth={2} />
            </span>
          </div>
        </div>
        <div className="relative order-1 mx-auto aspect-9/16 w-[min(72vw,340px)] overflow-hidden rounded-[32px] bg-[#1d1d1f] md:order-2 md:w-full">
          <Cover story={story} priority sizes="(min-width: 768px) 400px, 72vw" />
          {story.video && <VideoBadge />}
        </div>
      </Link>
    </Reveal>
  );
}

function StoryRail({ stories }: { stories: StoryCardData[] }) {
  const c = useSharksCopy();
  const { lang } = useLang();
  const rtl = lang === "ar";
  const rail = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? 300) + 20;
    // In RTL "next" moves visually to the left.
    el.scrollBy({ left: dir * step * (rtl ? -1 : 1), behavior: "smooth" });
  };

  return (
    <div className="mt-24">
      <div className="al-container flex items-end justify-between gap-4">
        <h3 className="text-[21px] font-semibold md:text-[24px]">{c.meet.more}</h3>
        <div className="hidden gap-2 sm:flex">
          <RailButton label={c.meet.prev} onClick={() => scroll(-1)}>
            {rtl ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </RailButton>
          <RailButton label={c.meet.next} onClick={() => scroll(1)}>
            {rtl ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
          </RailButton>
        </div>
      </div>
      <div ref={rail} className="al-rail mt-6" role="list">
        {stories.map((s) => (
          <StoryCard key={s.slug} story={s} />
        ))}
      </div>
    </div>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full bg-white/10 text-(--al-text) transition-[background-color,transform] duration-200 hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#5c8aff] active:scale-95"
    >
      {children}
    </button>
  );
}

export function StoryCard({ story }: { story: StoryCardData }) {
  return (
    <Link
      role="listitem"
      href={`/sharks/${story.slug}`}
      className="group relative block aspect-9/16 w-[min(74vw,300px)] overflow-hidden rounded-[28px] bg-[#1d1d1f] text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5c8aff]"
    >
      <Cover story={story} sizes="300px" />
      {story.video && <VideoBadge />}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/90 via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-[#f5f5f7]">
        <p className="text-[12px] font-semibold text-white/65">{story.industry}</p>
        <p className="mt-1 text-[22px] font-semibold leading-tight">{story.businessName}</p>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-white/75">{story.summary}</p>
        <TrackLine track={story.track} className="mt-3 text-white/65" />
      </div>
    </Link>
  );
}

/** Before the first story: three empty frames waiting to be filled — no invented businesses. */
function EmptyState({ open }: { open: boolean }) {
  const c = useSharksCopy();
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <Reveal className="al-container mt-16 text-center md:mt-20">
      <div aria-hidden className="mx-auto flex max-w-[640px] items-center justify-center gap-4 sm:gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "grid aspect-9/16 place-items-center rounded-[26px] border border-white/10 bg-white/[0.02]",
              i === 1 ? "w-[44%] sm:w-[34%]" : "w-[26%] opacity-60 sm:w-[24%]",
            )}
          >
            <span className={cn("relative", i === 1 ? "sk-ping text-[#5c8aff]" : "text-white/25")}>
              <SharksMark className={i === 1 ? "text-[34px]" : "text-[22px]"} />
            </span>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-[520px] text-[24px] font-semibold leading-snug text-balance md:text-[28px]">{c.meet.emptyTitle}</p>
      <p className="al-subhead mx-auto mt-3 max-w-[520px] text-pretty">{c.meet.emptyBody}</p>
      {open && (
        <Link href="/sharks/apply" className="al-link mt-6">
          {c.meet.emptyCta}
          <Chevron className="size-4" strokeWidth={2} />
        </Link>
      )}
    </Reveal>
  );
}
