import Image from "next/image";
import Link from "next/link";
import { Quote } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type {
  AboutBrandContent,
  CollectionsContent,
  HeroBannerSettings,
  OfferStripContent,
  RichTextSettings,
  SocialProofContent,
  TestimonialsContent,
  WhyChooseUsContent,
} from "@/types/store-theme.types";
import { Arrow, Rating, SectionHeader, Wrap, btn } from "../ui";

// Merchant-configured merchandising sections, drawn in Mada's language.
// Each renders only real merchant content — no placeholder claims.

/** Scrolling strip of short offers ("شحن مجاني فوق …"). */
export function Marquee({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const run = Array.from({ length: Math.max(2, Math.ceil(8 / items.length)) }, () => items).flat();
  return (
    <div className="md-marquee my-[calc(var(--md-section)/3)] overflow-hidden bg-(--md-signal) text-(--md-signal-ink)" role="region" aria-label="عروض">
      <p className="sr-only">{items.join(" — ")}</p>
      <div className="md-marquee-track" aria-hidden>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {run.map((t, i) => (
              <li key={i} className="md-face flex h-12 items-center gap-8 pe-8 text-[0.9375rem] font-semibold">
                {t}
                <span className="size-1.5 rounded-full bg-current opacity-60" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Big numbers band (orders shipped, happy customers…). */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()) ?? [];
  if (stats.length === 0) return null;
  return (
    <Wrap className="md-section md-reveal">
      {content?.headline && <h2 className="md-h2 mb-8 text-center">{content.headline}</h2>}
      <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {stats.map((s, i) => (
          <li key={i} className="md-panel flex flex-col items-center px-4 py-7 text-center">
            {s.icon && <span aria-hidden className="text-2xl">{s.icon}</span>}
            <span className="md-face mt-2 text-3xl font-bold sm:text-4xl">{s.value}</span>
            <span className="mt-1 text-sm text-(--md-quiet)">{s.label}</span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Store promises (only the merchant's own — nothing assumed). */
export function Benefits({ content }: { content?: WhyChooseUsContent }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()) ?? [];
  if (cards.length === 0) return null;
  return (
    <Wrap className="md-section md-reveal">
      <div className="rounded-[1.75rem] bg-(--md-brand) px-5 py-10 text-(--md-brand-ink) sm:px-10 lg:px-14 lg:py-14">
        {content?.headline && <h2 className="md-h2 mb-8 max-w-xl">{content.headline}</h2>}
        <ul className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8", cards.length >= 4 && "lg:grid-cols-4", cards.length === 3 && "lg:grid-cols-3")}>
          {cards.map((c, i) => (
            <li key={i} className="flex gap-4 sm:flex-col">
              <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-(--md-signal) text-xl text-(--md-signal-ink)">
                {c.icon || "✓"}
              </span>
              <span>
                <span className="md-face block text-lg font-semibold">{c.title}</span>
                {c.description && <span className="mt-1 block text-sm leading-7 opacity-75">{c.description}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Wrap>
  );
}

/** Customer words the merchant collected. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()) ?? [];
  if (items.length === 0) return null;
  return (
    <Wrap className="md-section md-reveal">
      <SectionHeader eyebrow="آراء" title={content?.headline || "العملاء بيقولوا إيه"} />
      <ul className="md-rail md-bleed gap-3 sm:gap-5 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {items.slice(0, 6).map((t, i) => (
          <li key={i} className="w-[84%] shrink-0 sm:w-[46%] lg:w-auto">
            <figure className="md-panel flex h-full flex-col p-6">
              <Quote aria-hidden className="size-7 text-(--md-brand)" />
              {t.rating ? <Rating value={t.rating} className="mt-4" /> : null}
              <blockquote className="mt-3 flex-1 text-[0.9375rem] leading-8">{t.text}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-(--md-line) pt-4">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--md-signal) font-bold text-(--md-signal-ink)">
                  {t.avatar ? <Image src={t.avatar} alt="" fill sizes="40px" className="object-cover" /> : [...t.name][0]}
                </span>
                <span className="text-sm font-semibold">{t.name}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Image + story split (about the brand). */
export function ImageWithText({ content, storeName, storeSlug }: { content?: AboutBrandContent; storeName: string; storeSlug: string }) {
  if (!content?.text?.trim() && !content?.headline?.trim()) return null;
  const href = content.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Wrap className="md-section md-reveal">
      <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[1.75rem] bg-(--md-surface) lg:grid-cols-2 lg:gap-0">
        {content.image && (
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[28rem]">
            <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        )}
        <div className={cn("p-6 sm:p-10 lg:p-14", !content.image && "lg:col-span-2 lg:max-w-3xl")}>
          <span className="md-eyebrow">حكايتنا</span>
          <h2 className="md-h2 mt-4">{content.headline || `عن ${storeName}`}</h2>
          {content.text && <p className="md-prose mt-4 text-[0.9375rem]">{content.text}</p>}
          <Link href={href} className={btn({ className: "mt-7" })}>
            {content.ctaText || "اعرف أكتر"}
            <Arrow />
          </Link>
        </div>
      </div>
    </Wrap>
  );
}

/** Promo grid of merchant collections (image + name + link). */
export function PromoGrid({ content, storeSlug }: { content?: CollectionsContent; storeSlug: string }) {
  const items = content?.items?.filter((c) => c.name?.trim()) ?? [];
  if (items.length === 0) return null;
  const href = (link?: string) => {
    const v = link?.trim();
    if (!v) return buildStoreUrl(storeSlug, "/products");
    if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
    return buildStoreUrl(storeSlug, `/categories/${v}`);
  };
  return (
    <Wrap className="md-section md-reveal">
      <SectionHeader eyebrow="مجموعات" title={content?.headline || "مجموعات مختارة"} />
      <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4", items.length >= 3 && "lg:grid-cols-3", items.length >= 4 && "lg:grid-cols-4")}>
        {items.slice(0, 8).map((c, i) => (
          <li key={i} className={cn(i === 0 && items.length % 2 === 1 && "col-span-2 lg:col-span-1")}>
            <Link href={href(c.link)} className="md-media group block aspect-[4/5]">
              {c.image ? (
                <Image src={c.image} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <span className="absolute inset-0 bg-(--md-brand)" />
              )}
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.7),transparent_55%)]" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4 text-white">
                <span className="md-face truncate text-base font-bold sm:text-lg">{c.name}</span>
                <Arrow />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Merchant image banner from the visual builder. */
export function ImageBanner({ content, storeSlug }: { content?: HeroBannerSettings; storeSlug: string }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const align = content.textAlign === "center" ? "items-center text-center" : content.textAlign === "left" ? "items-end text-left" : "items-start text-start";
  return (
    <Wrap className="md-section">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-(--md-brand)">
        {content.backgroundImage && <Image src={content.backgroundImage} alt="" fill sizes="100vw" className="object-cover" />}
        <span aria-hidden className="absolute inset-0 bg-[#0c110f]" style={{ opacity: (content.overlayOpacity ?? 40) / 100 }} />
        <div className={cn("relative flex min-h-[22rem] flex-col justify-center gap-4 p-7 text-white sm:min-h-[28rem] sm:p-14", align)}>
          {content.headline && <h2 className="md-hero-title max-w-3xl text-[clamp(2rem,5vw,4rem)]">{content.headline}</h2>}
          {content.subheadline && <p className="max-w-xl text-base leading-8 opacity-85">{content.subheadline}</p>}
          {content.buttonText && (
            <Link href={content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products")} className={btn({ variant: "light", size: "lg", className: "mt-2" })}>
              {content.buttonText}
              <Arrow />
            </Link>
          )}
        </div>
      </div>
    </Wrap>
  );
}

export function RichText({ content }: { content?: RichTextSettings }) {
  if (!content?.heading?.trim() && !content?.paragraph?.trim()) return null;
  const width = content.width === "narrow" ? "max-w-2xl" : content.width === "wide" ? "max-w-5xl" : content.width === "full" ? "max-w-none" : "max-w-3xl";
  const align = content.textAlign === "center" ? "mx-auto text-center" : content.textAlign === "left" ? "me-auto text-left" : "";
  return (
    <Wrap className="md-section">
      <div className={cn(width, align)} style={content.backgroundColor ? { background: content.backgroundColor, padding: "2.5rem", borderRadius: "1.75rem" } : undefined}>
        {content.heading && <h2 className="md-h2">{content.heading}</h2>}
        {content.paragraph && <p className="md-prose mt-4 max-w-none">{content.paragraph}</p>}
      </div>
    </Wrap>
  );
}
