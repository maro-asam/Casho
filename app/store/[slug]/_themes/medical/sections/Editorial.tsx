import Image from "next/image";
import Link from "next/link";
import { ClipboardPlus, MessageCircle, Quote } from "lucide-react";

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
import Rail from "../product/Rail";
import { RX_MESSAGE, waWith } from "../lib/rx";
import { Chevron, Rating, SectionHeader, Wrap, btn, delay } from "../ui";

// Merchant-configured sections in Casho Medical's language. Each renders only
// the merchant's own content — no placeholder claims.

/** Offer strip: a slow mint marquee, messages separated by small plus marks. */
export function OfferStrip({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const run = Array.from({ length: Math.max(2, Math.ceil(8 / items.length)) }, () => items).flat();
  return (
    <div className="rx-marquee my-[calc(var(--rx-section)/4)] overflow-hidden border-y border-(--rx-line) bg-(--rx-tint) py-3 text-(--rx-tint-ink)" role="region" aria-label="عروض المتجر">
      <p className="sr-only">{items.join(" — ")}</p>
      <div className="rx-marquee-track" aria-hidden style={{ ["--rx-marquee-dur" as string]: `${run.length * 6}s` }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {run.map((t, i) => (
              <li key={i} className="flex items-center gap-8 pe-8 text-sm font-bold whitespace-nowrap sm:text-[0.9375rem]">
                {t}
                <svg viewBox="0 0 24 24" className="size-3.5 text-(--rx-btn)" fill="currentColor">
                  <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
                </svg>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** The store's promises (why choose us) as white cards with an icon disc. */
export function TrustRow({ content }: { content?: WhyChooseUsContent }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 4) ?? [];
  if (cards.length === 0) return null;
  return (
    <Wrap className="rx-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className={cn("grid gap-(--rx-gap) sm:grid-cols-2", cards.length >= 4 ? "lg:grid-cols-4" : cards.length === 3 ? "lg:grid-cols-3" : "")}>
        {cards.map((c, i) => (
          <li key={i} className="rx-reveal rx-panel flex items-start gap-4 p-5" style={delay(i)}>
            <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-(--rx-tint) text-2xl leading-none">
              {c.icon || "✚"}
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-(--rx-ink)">{c.title}</span>
              {c.description && <span className="mt-1 block text-sm leading-6 text-(--rx-quiet)">{c.description}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Numbers band on the deep store color. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()) ?? [];
  if (stats.length === 0) return null;
  return (
    <Wrap className="rx-section">
      <div className="rx-pluses rounded-(--rx-r-lg) bg-(--rx-deep) px-5 py-8 text-white sm:px-8 sm:py-10">
        {content?.headline && <h2 className="rx-h2 mb-6 text-center !text-white">{content.headline}</h2>}
        <ul className={cn("grid grid-cols-2 gap-y-6", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {stats.map((s, i) => (
            <li key={i} className="rx-reveal flex flex-col items-center px-2 text-center" style={delay(i)}>
              {s.icon && (
                <span aria-hidden className="mb-1.5 text-2xl">
                  {s.icon}
                </span>
              )}
              <span className="text-[clamp(1.75rem,3.6vw,2.5rem)] leading-none font-bold">{s.value}</span>
              <span className="mt-2 text-sm text-white/80">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Wrap>
  );
}

/** Customer quotes in a swipe row. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 8) ?? [];
  if (items.length === 0) return null;
  const title = content?.headline || "آراء عملائنا";
  return (
    <Wrap className="rx-section">
      <Rail label={title} title={title} listClassName="[&>li]:!w-[86%] sm:[&>li]:!w-[calc((100%-var(--rx-gap))/2)] lg:[&>li]:!w-[calc((100%-var(--rx-gap)*2)/3)]">
        {items.map((t, i) => (
          <li key={i} className="min-w-0">
            <figure className="rx-panel flex h-full flex-col p-6">
              <div className="flex items-center justify-between gap-3">
                <Quote aria-hidden className="size-7 -scale-x-100 fill-(--rx-tint) text-(--rx-btn) ltr:scale-x-100" />
                {t.rating ? <Rating value={t.rating} size="md" /> : null}
              </div>
              <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-7 text-(--rx-text)">{t.text}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-(--rx-line) pt-4">
                <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-(--rx-tint) font-bold text-(--rx-btn)">
                  {t.avatar ? <Image src={t.avatar} alt="" fill sizes="44px" className="object-cover" /> : [...t.name][0]}
                </span>
                <span className="font-bold text-(--rx-ink)">{t.name}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </Rail>
    </Wrap>
  );
}

export function RichText({ content }: { content?: RichTextSettings }) {
  if (!content?.heading?.trim() && !content?.paragraph?.trim()) return null;
  const width = content.width === "narrow" ? "max-w-2xl" : content.width === "wide" ? "max-w-5xl" : content.width === "full" ? "max-w-none" : "max-w-3xl";
  const align = content.textAlign === "left" ? "me-auto text-left" : content.textAlign === "right" ? "ms-auto text-right" : "mx-auto text-center";
  return (
    <Wrap className="rx-section">
      <div className={cn(width, align, "rounded-(--rx-r-lg)")} style={content.backgroundColor ? { background: content.backgroundColor, padding: "2.5rem 2rem" } : undefined}>
        {content.heading && <h2 className="rx-h2 text-balance">{content.heading}</h2>}
        {content.paragraph && <p className="rx-prose mt-4 max-w-none">{content.paragraph}</p>}
      </div>
    </Wrap>
  );
}

/** The Studio "hero banner" section: a wide image card with the copy on the start side. */
export function MediaBanner({ content, storeSlug }: { content?: HeroBannerSettings; storeSlug: string }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const align = content.textAlign === "center" ? "items-center text-center" : "items-start text-start";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  return (
    <Wrap className="rx-section">
      <section className="relative flex min-h-[22rem] overflow-hidden rounded-(--rx-r-lg) bg-(--rx-deep) text-white sm:min-h-[28rem]">
        {content.backgroundImage && <Image src={content.backgroundImage} alt="" fill sizes="(max-width: 1440px) 100vw, 90rem" className="object-cover" />}
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_left,rgb(3_22_24/0.85),rgb(3_22_24/0)_75%)] ltr:bg-[linear-gradient(to_right,rgb(3_22_24/0.85),rgb(3_22_24/0)_75%)]"
          style={{ opacity: content.backgroundImage ? Math.max(0.4, (content.overlayOpacity ?? 70) / 100) : 0 }}
        />
        <div className={cn("relative flex w-full flex-col justify-center px-6 py-12 sm:px-12", align)}>
          {content.subheadline && <p className="text-sm font-semibold text-white/90">{content.subheadline}</p>}
          {content.headline && <h2 className="rx-hero mt-2 max-w-[16ch] text-balance !text-white">{content.headline}</h2>}
          <Link href={href} className={btn({ variant: "white", size: "lg", className: "mt-6" })}>
            {content.buttonText || "تسوّق الآن"}
            <Chevron />
          </Link>
        </div>
      </section>
    </Wrap>
  );
}

function promoHref(storeSlug: string, link?: string) {
  const v = link?.trim();
  if (!v) return buildStoreUrl(storeSlug, "/products");
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return buildStoreUrl(storeSlug, `/categories/${v}`);
}

/** Merchant collections as photo tiles with the name and a "shop" link. */
export function PromoTiles({ content, storeSlug }: { content?: CollectionsContent; storeSlug: string }) {
  const items = content?.items?.filter((c) => c.name?.trim()).slice(0, 4) ?? [];
  if (items.length === 0) return null;
  return (
    <Wrap className="rx-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className={cn("grid gap-(--rx-gap) sm:grid-cols-2", items.length >= 3 && "lg:grid-cols-3", items.length === 4 && "lg:grid-cols-4")}>
        {items.map((c, i) => (
          <li key={i} className="rx-reveal" style={delay(i)}>
            <Link href={promoHref(storeSlug, c.link)} className="group relative flex h-full min-h-56 overflow-hidden rounded-(--rx-r-lg) bg-(--rx-tint) sm:min-h-72">
              {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="rx-zoom-img object-cover" />}
              {c.image && <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(3_22_24/0.7),transparent_60%)]" />}
              <span className={cn("relative mt-auto flex w-full items-end justify-between gap-3 p-5", c.image ? "text-white" : "text-(--rx-tint-ink)")}>
                <span className="text-xl leading-snug font-bold text-balance">{c.name}</span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#0f2a2e] transition-transform group-hover:-translate-x-1 ltr:group-hover:translate-x-1">
                  <Chevron />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Brand story beside the merchant's photo. */
export function AboutBrand({ content, storeName, storeSlug }: { content?: AboutBrandContent; storeName: string; storeSlug: string }) {
  if (!content?.text?.trim() && !content?.headline?.trim()) return null;
  const href = content.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Wrap className="rx-section">
      <div className={cn("rx-panel grid overflow-hidden", content.image && "lg:grid-cols-2")}>
        {content.image && (
          <div className="relative min-h-64 bg-(--rx-tint)">
            <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
          </div>
        )}
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className="rx-eyebrow">{storeName}</p>
          <h2 className="rx-h2 mt-2 text-balance">{content.headline || `عن ${storeName}`}</h2>
          {content.text && <p className="rx-prose mt-3 line-clamp-6 text-[0.9375rem]">{content.text}</p>}
          <Link href={href} className={btn({ variant: "outline", className: "mt-6 self-start" })}>
            {content.ctaText || "اعرف أكتر عنّا"}
          </Link>
        </div>
      </div>
    </Wrap>
  );
}

/** Prescription band: the store's WhatsApp with a ready-written message. */
export function RxBand({ whatsappHref }: { whatsappHref: string }) {
  return (
    <Wrap className="rx-section">
      <div className="rx-pluses flex flex-col gap-5 rounded-(--rx-r-lg) bg-(--rx-deep) p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white/12">
          <ClipboardPlus className="size-8" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold sm:text-2xl">عندك روشتة؟ ابعتها واتساب</h2>
          <p className="mt-1 text-sm leading-6 text-white/85 sm:text-[0.9375rem]">صوّر الروشتة وابعتها في محادثة المتجر، واسأل عن المتاح والسعر قبل ما تطلب.</p>
        </div>
        <a href={waWith(whatsappHref, RX_MESSAGE)} target="_blank" rel="noopener noreferrer" className={btn({ variant: "wa", size: "lg", className: "sm:self-center" })}>
          <MessageCircle />
          ابعت الروشتة
        </a>
      </div>
    </Wrap>
  );
}
