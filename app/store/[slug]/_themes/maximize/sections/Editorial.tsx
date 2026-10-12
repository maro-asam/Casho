import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { HeroBannerSettings, OfferStripContent, RichTextSettings, SocialProofContent, TestimonialsContent, WhyChooseUsContent } from "@/types/store-theme.types";
import { Chevron, Rating, Wrap, delay } from "../ui";

// Merchant-configured sections in Maximize's language. Each renders only the
// merchant's own content — no placeholder claims.

/** Row of the store's promises with icon tiles ("Delivery Guarantee",
 *  "Secure Payment"… in the reference). A rail on phones. */
export function TrustRow({ content }: { content?: WhyChooseUsContent }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 6) ?? [];
  if (cards.length === 0) return null;
  return (
    <Wrap className="mx-section">
      {content?.headline && <h2 className="mx-h3 mb-5 text-center">{content.headline}</h2>}
      <ul className={cn("mx-rail mx-bleed gap-6 lg:grid lg:overflow-visible", cards.length >= 5 ? "lg:grid-cols-5" : cards.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {cards.map((c, i) => (
          <li key={i} className="mx-reveal flex w-[70%] shrink-0 items-center gap-3 sm:w-[40%] lg:w-auto" style={delay(i)}>
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-(--mx-r) bg-(--mx-tint) text-xl">
              {c.icon || "✓"}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-(--mx-ink)">{c.title}</span>
              {c.description && <span className="line-clamp-2 block text-xs leading-5 text-(--mx-quiet)">{c.description}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Wide image banner with centered copy ("Super Offers — Upgrade Your Gear
 *  & Save — Discover »"). Without a photo it sits on the brand color. */
export function MediaBanner({ content, storeSlug }: { content?: HeroBannerSettings; storeSlug: string }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const align = content.textAlign === "center" || !content.textAlign ? "items-center text-center" : content.textAlign === "left" ? "items-end text-left" : "items-start text-start";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  return (
    <Wrap className="mx-section">
      <Link href={href} className="mx-reveal group relative flex min-h-40 overflow-hidden rounded-(--mx-r-lg) bg-(--mx-btn) text-white sm:min-h-48">
        {content.backgroundImage && <Image src={content.backgroundImage} alt="" fill sizes="100vw" className="mx-zoom-img object-cover" />}
        <span aria-hidden className="absolute inset-0 bg-[color-mix(in_srgb,var(--mx-btn)_80%,#000)]" style={{ opacity: content.backgroundImage ? (content.overlayOpacity ?? 55) / 100 : 0 }} />
        <span className={cn("relative flex w-full flex-col justify-center px-6 py-8 sm:px-10", align)}>
          {content.subheadline && <span className="text-sm font-semibold opacity-90">{content.subheadline}</span>}
          {content.headline && <span className="mx-display mt-1 text-balance text-2xl text-white sm:text-[1.75rem]">{content.headline}</span>}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[color-mix(in_srgb,#fff_80%,var(--mx-btn))] group-hover:underline">
            {content.buttonText || "تسوّق الآن"}
            <Chevron double />
          </span>
        </span>
      </Link>
    </Wrap>
  );
}

/** The offer strip as a soft band of scrolling offers. */
export function OfferBand({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const run = Array.from({ length: Math.max(2, Math.ceil(6 / items.length)) }, () => items).flat();
  return (
    <div className="mx-marquee mx-band my-[calc(var(--mx-section)/4)] overflow-hidden py-4" role="region" aria-label="عروض">
      <p className="sr-only">{items.join(" — ")}</p>
      <div className="mx-marquee-track" aria-hidden style={{ ["--mx-marquee-dur" as string]: `${run.length * 6}s` }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {run.map((t, i) => (
              <li key={i} className="mx-display flex items-center gap-10 pe-10 text-lg whitespace-nowrap sm:text-xl">
                {t}
                <span className="text-(--mx-sale)">⚡</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Stats counter: big numbers in cards. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()) ?? [];
  if (stats.length === 0) return null;
  return (
    <Wrap className="mx-section">
      {content?.headline && <h2 className="mx-h2 mb-6 text-center">{content.headline}</h2>}
      <ul className={cn("grid grid-cols-2 gap-(--mx-gap)", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {stats.map((s, i) => (
          <li key={i} className="mx-reveal flex flex-col items-center rounded-(--mx-r-lg) bg-(--mx-band) px-4 py-8 text-center" style={delay(i)}>
            {s.icon && (
              <span aria-hidden className="mb-2 text-2xl">
                {s.icon}
              </span>
            )}
            <span className="mx-display text-[clamp(2rem,4vw,2.75rem)] leading-none text-(--mx-link)">{s.value}</span>
            <span className="mt-2 text-sm">{s.label}</span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** "What our customers say": quote cards with a name and photo. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 8) ?? [];
  if (items.length === 0) return null;
  return (
    <section className="mx-band mx-section my-[calc(var(--mx-section)/2)]">
      <Wrap>
        <h2 className="mx-h2 mb-6 text-center">{content?.headline || "آراء عملائنا"}</h2>
        <ul className="mx-rail mx-bleed gap-(--mx-gap) lg:grid lg:grid-cols-4 lg:overflow-visible">
          {items.slice(0, 8).map((t, i) => (
            <li key={i} className="mx-reveal w-[82%] shrink-0 sm:w-[46%] lg:w-auto" style={delay(i)}>
              <figure className="flex h-full flex-col rounded-(--mx-r-lg) bg-(--mx-bg) p-6">
                <span aria-hidden className="mx-display text-4xl leading-none text-(--mx-quiet) opacity-50">
                  ”
                </span>
                {t.rating ? <Rating value={t.rating} size="md" className="mt-2" /> : null}
                <blockquote className="mt-3 flex-1 text-[0.9375rem] leading-7">{t.text}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-(--mx-tint) font-bold text-(--mx-link)">
                    {t.avatar ? <Image src={t.avatar} alt="" fill sizes="44px" className="object-cover" /> : [...t.name][0]}
                  </span>
                  <span className="text-sm font-semibold text-(--mx-ink)">{t.name}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}

export function RichText({ content }: { content?: RichTextSettings }) {
  if (!content?.heading?.trim() && !content?.paragraph?.trim()) return null;
  const width = content.width === "narrow" ? "max-w-2xl" : content.width === "wide" ? "max-w-5xl" : content.width === "full" ? "max-w-none" : "max-w-3xl";
  const align = content.textAlign === "left" ? "me-auto text-left" : content.textAlign === "right" ? "ms-auto text-right" : "mx-auto text-center";
  return (
    <Wrap className="mx-section">
      <div className={cn(width, align, "rounded-(--mx-r-lg)")} style={content.backgroundColor ? { background: content.backgroundColor, padding: "2.5rem 2rem" } : undefined}>
        {content.heading && <h2 className="mx-h2 text-balance">{content.heading}</h2>}
        {content.paragraph && <p className="mx-prose mt-4 max-w-none">{content.paragraph}</p>}
      </div>
    </Wrap>
  );
}
