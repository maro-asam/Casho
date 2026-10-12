import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Quote } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { HeroBannerSettings, OfferStripContent, RichTextSettings, SocialProofContent, TestimonialsContent, WhyChooseUsContent } from "@/types/store-theme.types";
import Rail from "../product/Rail";
import { Rating, SectionHeader, Wrap, delay } from "../ui";

// Merchant-configured sections in Cello's language. Each renders only the
// merchant's own content — no placeholder claims.

/** The store's promises as Cello's navy service strip (icon, title and a
 *  short line in four columns) — it sits right above the footer. */
export function TrustRow({ content }: { content?: WhyChooseUsContent }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 4) ?? [];
  if (cards.length === 0) return null;
  return (
    <section aria-label={content?.headline || "مميزات المتجر"} className="mt-[calc(var(--ce-section)/2)] bg-(--ce-navy) text-white">
      <ul className={cn("ce-wrap grid gap-x-6 gap-y-5 py-7 sm:grid-cols-2", cards.length >= 4 ? "lg:grid-cols-4" : cards.length === 3 ? "lg:grid-cols-3" : "")}>
        {cards.map((c, i) => (
          <li key={i} className="flex items-start gap-4">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center text-[1.75rem] leading-none">
              {c.icon || "✓"}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold sm:text-lg">{c.title}</span>
              {c.description && <span className="mt-0.5 line-clamp-2 block text-sm text-white/80">{c.description}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Full-width image banner with the copy on the start side and a white
 *  button ("Lose yourself in premium sound — Hear the difference →"). */
export function MediaBanner({ content, storeSlug }: { content?: HeroBannerSettings; storeSlug: string }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const align = content.textAlign === "center" ? "items-center text-center" : "items-start text-start";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  return (
    <section className="relative my-[calc(var(--ce-section)/2)] flex min-h-[26rem] overflow-hidden bg-(--ce-navy) text-white sm:min-h-[34rem]">
      {content.backgroundImage && <Image src={content.backgroundImage} alt="" fill sizes="100vw" className="object-cover" />}
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_left,rgb(0_10_31/0.85),rgb(0_10_31/0)_70%)] ltr:bg-[linear-gradient(to_right,rgb(0_10_31/0.85),rgb(0_10_31/0)_70%)]"
        style={{ opacity: content.backgroundImage ? Math.max(0.4, (content.overlayOpacity ?? 70) / 100) : 0 }}
      />
      <div className={cn("ce-wrap relative flex flex-col justify-center py-12", align)}>
        {content.subheadline && <p className="text-sm text-white/90">{content.subheadline}</p>}
        {content.headline && <h2 className="ce-hero mt-3 max-w-[16ch] text-balance text-white">{content.headline}</h2>}
        <Link href={href} className="ce-btn ce-btn--white mt-7">
          {content.buttonText || "تسوّق الآن"}
          <ArrowLeft className="ltr:rotate-180" />
        </Link>
      </div>
    </section>
  );
}

/** The offer strip as Cello's bright headline band: big white lines
 *  separated by thin rules, scrolling slowly (paused on hover). */
export function OfferBand({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const run = Array.from({ length: Math.max(2, Math.ceil(6 / items.length)) }, () => items).flat();
  return (
    <div className="ce-marquee ce-band-blue my-[calc(var(--ce-section)/4)] overflow-hidden py-3 sm:py-3.5" role="region" aria-label="عروض">
      <p className="sr-only">{items.join(" — ")}</p>
      <div className="ce-marquee-track" aria-hidden style={{ ["--ce-marquee-dur" as string]: `${run.length * 7}s` }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {run.map((t, i) => (
              <li key={i} className="flex items-center gap-11 pe-11 text-lg font-semibold whitespace-nowrap sm:text-[1.375rem]">
                {t}
                <span className="h-7 w-px bg-white/70" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Stats counter: big numbers on white cards. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()) ?? [];
  if (stats.length === 0) return null;
  return (
    <Wrap className="ce-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className={cn("grid grid-cols-2 gap-(--ce-gap)", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {stats.map((s, i) => (
          <li key={i} className="ce-reveal flex flex-col items-center rounded-(--ce-r) bg-(--ce-card) px-4 py-8 text-center" style={delay(i)}>
            {s.icon && (
              <span aria-hidden className="mb-2 text-2xl">
                {s.icon}
              </span>
            )}
            <span className="ce-display text-[clamp(2rem,4vw,2.75rem)] leading-none !text-(--ce-btn)">{s.value}</span>
            <span className="mt-2 text-sm">{s.label}</span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** "What real customers say": bordered cards with a navy quote mark, the
 *  name, star rating, quote and avatar. A carousel with header arrows. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 8) ?? [];
  if (items.length === 0) return null;
  const title = content?.headline || "آراء عملائنا";
  return (
    <section className="ce-section bg-(--ce-card)">
      <Wrap>
        <Rail label={title} title={title} listClassName="[&>li]:!w-[86%] sm:[&>li]:!w-[calc((100%-var(--ce-gap))/2)] lg:[&>li]:!w-[calc((100%-var(--ce-gap)*2)/3)] xl:[&>li]:!w-[calc((100%-var(--ce-gap)*3)/4)]">
          {items.map((t, i) => (
            <li key={i} className="min-w-0">
              <figure className="flex h-full flex-col rounded-(--ce-r) border border-(--ce-line) bg-(--ce-bg) p-6 sm:p-8">
                <Quote aria-hidden className="size-8 -scale-x-100 fill-(--ce-navy) text-(--ce-navy) ltr:scale-x-100" />
                {t.rating ? <Rating value={t.rating} size="md" className="mt-5" /> : null}
                <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-7 text-(--ce-text)">{t.text}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-(--ce-tint) text-lg font-semibold text-(--ce-btn)">
                    {t.avatar ? <Image src={t.avatar} alt="" fill sizes="56px" className="object-cover" /> : [...t.name][0]}
                  </span>
                  <span className="text-base font-medium text-(--ce-ink)">{t.name}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </Rail>
      </Wrap>
    </section>
  );
}

export function RichText({ content }: { content?: RichTextSettings }) {
  if (!content?.heading?.trim() && !content?.paragraph?.trim()) return null;
  const width = content.width === "narrow" ? "max-w-2xl" : content.width === "wide" ? "max-w-5xl" : content.width === "full" ? "max-w-none" : "max-w-3xl";
  const align = content.textAlign === "left" ? "me-auto text-left" : content.textAlign === "right" ? "ms-auto text-right" : "mx-auto text-center";
  return (
    <Wrap className="ce-section">
      <div className={cn(width, align, "rounded-(--ce-r-lg)")} style={content.backgroundColor ? { background: content.backgroundColor, padding: "2.5rem 2rem" } : undefined}>
        {content.heading && <h2 className="ce-h2 text-balance">{content.heading}</h2>}
        {content.paragraph && <p className="ce-prose mt-4 max-w-none">{content.paragraph}</p>}
      </div>
    </Wrap>
  );
}
