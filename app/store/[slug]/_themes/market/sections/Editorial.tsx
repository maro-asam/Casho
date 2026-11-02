import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { readableOn } from "@/lib/theme/contrast";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type {
  AboutBrandContent,
  CollectionsContent,
  HeroBannerSettings,
  NewsletterContent,
  OfferStripContent,
  RichTextSettings,
  SocialProofContent,
  TestimonialsContent,
  WhyChooseUsContent,
} from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { joinMessage, waWith } from "../lib/market";
import Rail from "../product/Rail";
import { AisleArt, Chevron, Rating, SectionHeader, Wrap, btn, delay } from "../ui";

// Merchant-configured sections in Casho Market's language. Each renders only
// the merchant's own content (or real store data), no placeholder claims. Empty
// ones return null and MarketHome shows a Studio-only marker instead.

/** Offer strip: the merchant's messages as calm chips you can swipe, not a ticker. */
export function OfferStrip({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  return (
    <Wrap className="py-2">
      <ul aria-label="عروض المتجر" className="mk-rail mk-bleed gap-2">
        {items.map((t, i) => (
          <li key={i} className="mk-offer">
            {t}
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** The store's promises (why choose us) as an inset grouped list. */
export function TrustRow({ content }: { content?: WhyChooseUsContent }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 6) ?? [];
  if (cards.length === 0) return null;
  return (
    <Wrap className="mk-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className="mk-group mk-group--grid mk-reveal">
        {cards.map((c, i) => (
          <li key={i} className="mk-row">
            <span aria-hidden className="mk-row-icon">
              {c.icon || "✓"}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-(--mk-ink)">{c.title}</span>
              {c.description && <span className="mt-0.5 block text-sm leading-5 text-(--mk-label-2)">{c.description}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Numbers large and quiet, the way Apple states a spec. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()).slice(0, 4) ?? [];
  if (stats.length === 0) return null;
  return (
    <Wrap className="mk-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className="mk-stats" style={{ ["--n" as string]: stats.length }}>
        {stats.map((s, i) => (
          <li key={i} className="mk-reveal min-w-0" style={delay(i)}>
            <span className="mk-stat-value">{s.value}</span>
            <span className="mt-1 block text-[0.9375rem] text-(--mk-label-2)">{s.label}</span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Customer quotes as message bubbles. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 8) ?? [];
  if (items.length === 0) return null;
  const title = content?.headline || "آراء عملائنا";
  return (
    <Wrap className="mk-section">
      <Rail label={title} title={title} listClassName="[&>li]:!w-[84%] sm:[&>li]:!w-[calc((100%-var(--mk-gap))/2)] lg:[&>li]:!w-[calc((100%-var(--mk-gap)*2)/3)]">
        {items.map((t, i) => (
          <li key={i} className="min-w-0">
            <figure className="flex h-full flex-col">
              <blockquote className="mk-bubble flex-1">{t.text}</blockquote>
              <figcaption className="mt-3 flex items-center gap-2.5 ps-2">
                <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-(--mk-fill) text-sm font-semibold text-(--mk-ink)">
                  {t.avatar ? <Image src={t.avatar} alt="" fill sizes="32px" className="object-cover" /> : [...t.name][0]}
                </span>
                <span className="text-sm font-medium text-(--mk-ink)">{t.name}</span>
                {t.rating ? <Rating value={t.rating} className="ms-auto pe-2" /> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </Rail>
    </Wrap>
  );
}

/** Heading and paragraph; width, alignment and background come from the
 *  Studio, and the text keeps its contrast on whatever background is picked. */
export function RichText({ content }: { content?: RichTextSettings }) {
  if (!content?.heading?.trim() && !content?.paragraph?.trim()) return null;
  const width = content.width === "narrow" ? "max-w-2xl" : content.width === "wide" ? "max-w-5xl" : content.width === "full" ? "max-w-none" : "max-w-3xl";
  const align = content.textAlign === "left" ? "text-left" : content.textAlign === "right" ? "text-right" : "text-center";
  const bg = content.backgroundColor;
  const ink = bg && /^#[0-9a-f]{6}$/i.test(bg) ? readableOn(bg) : undefined;
  return (
    <Wrap className="mk-section">
      <div className={cn("mx-auto rounded-(--mk-r-lg)", width, align)} style={bg ? { background: bg, padding: "2.5rem 2rem", color: ink } : undefined}>
        {content.heading && (
          <h2 className="mk-h2 text-balance" style={ink ? { color: ink } : undefined}>
            {content.heading}
          </h2>
        )}
        {content.paragraph && (
          <p className="mk-prose mt-4 max-w-none" style={ink ? { color: ink } : undefined}>
            {content.paragraph}
          </p>
        )}
      </div>
    </Wrap>
  );
}

/** The Studio "custom banner" section: one big rounded tile; alignment and the
 *  overlay strength come from the Studio. */
export function MediaBanner({ content, storeSlug, dir }: { content?: HeroBannerSettings; storeSlug: string; dir: "rtl" | "ltr" }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const a = content.textAlign ?? "center";
  const atStart = (a === "right") === (dir === "rtl");
  const align = a === "center" ? "items-center text-center" : atStart ? "items-start text-start" : "items-end text-end";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  const image = !!content.backgroundImage;
  return (
    <Wrap className="mk-section">
      <section className="mk-banner mk-reveal" data-image={image}>
        {image && <Image src={content.backgroundImage!} alt="" fill sizes="100vw" className="object-cover" />}
        {image && <span aria-hidden className="absolute inset-0 bg-black" style={{ opacity: (content.overlayOpacity ?? 40) / 100 }} />}
        <div className={cn("relative flex flex-col justify-center gap-2 p-7 sm:p-12", align)}>
          {content.headline && <h2 className="mk-h1 max-w-[18ch] text-balance !text-current">{content.headline}</h2>}
          {content.subheadline && <p className="max-w-xl text-base opacity-90 sm:text-lg">{content.subheadline}</p>}
          <Link href={href} className={btn({ variant: image ? "white" : "solid", size: "lg", className: "mt-3" })}>
            {content.buttonText || "تسوّق دلوقتي"}
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

/** Collections as apple.com tiles: title at the top, the picture filling the
 *  rest. The Studio has no editor for this section, so it falls back to the
 *  store's own top aisles and works as soon as it's turned on. */
export function PromoTiles({ content, categories, storeSlug }: { content?: CollectionsContent; categories: CategoryLink[]; storeSlug: string }) {
  const own = content?.items?.filter((c) => c.name?.trim()).slice(0, 4) ?? [];
  const items = own.length
    ? own
    : categories
        .filter((c) => c.productCount > 0)
        .sort((a, b) => Number(!!b.image) - Number(!!a.image))
        .slice(0, 4)
        .map((c) => ({ name: c.name, image: c.image ?? undefined, link: c.slug }));
  if (items.length < 2) return null;
  return (
    <Wrap className="mk-section">
      <SectionHeader title={content?.headline || "تسوّق بالمجموعة"} />
      <ul className="mk-tiles" data-n={items.length}>
        {items.map((c, i) => (
          <li key={i} className="mk-reveal min-w-0" style={delay(i)}>
            <Link href={promoHref(storeSlug, c.link)} className="mk-tile group" data-image={!!c.image}>
              <span className="mk-tile-name">
                {c.name}
                <Chevron />
              </span>
              {c.image ? <Image src={c.image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="mk-zoom-img object-cover" /> : <AisleArt name={c.name} className="mk-tile-art" />}
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Brand story beside the merchant's photo. Falls back to the store's own
 *  description. */
export function AboutBrand({ content, storeName, storeSlug, description }: { content?: AboutBrandContent; storeName: string; storeSlug: string; description: string | null }) {
  const text = content?.text?.trim() || description?.trim();
  if (!text && !content?.headline?.trim()) return null;
  const href = content?.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Wrap className="mk-section">
      <div className={cn("mk-about mk-reveal", content?.image && "mk-about--image")}>
        {content?.image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-(--mk-r-lg) bg-(--mk-cell) lg:aspect-auto lg:min-h-80">
            <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 self-center p-2 sm:p-6">
          <h2 className="mk-h2 text-balance">{content?.headline || `عن ${storeName}`}</h2>
          {text && <p className="mk-prose mt-3 line-clamp-6">{text}</p>}
          <Link href={href} className="mk-link mt-4 text-[1.0625rem]">
            {content?.ctaText || "اعرف أكتر"}
            <Chevron />
          </Link>
        </div>
      </div>
    </Wrap>
  );
}

/** "Join" band. Casho has no newsletter inbox, so instead of a form that goes
 *  nowhere this hands the shopper to the store's WhatsApp (or contact page)
 *  with the merchant's own headline and button. */
export function JoinBand({ content, storeName, storeSlug, whatsappHref }: { content?: NewsletterContent; storeName: string; storeSlug: string; whatsappHref: string | null }) {
  const href = whatsappHref ? waWith(whatsappHref, joinMessage(storeName)) : buildStoreUrl(storeSlug, "/contact");
  const body = (
    <>
      {whatsappHref && <MessageCircle />}
      {content?.ctaText || (whatsappHref ? "تابعنا على واتساب" : "تواصل معنا")}
    </>
  );
  return (
    <Wrap className="mk-section">
      <div className="mk-join mk-reveal">
        <h2 className="mk-h2 text-balance">{content?.headline || "اعرف العروض قبل أي حد"}</h2>
        <p className="mt-2 max-w-xl text-[1.0625rem] text-(--mk-label-2)">{content?.subheadline || "أول ما ينزل عرض أو منتج جديد، هتعرف."}</p>
        {whatsappHref ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={btn({ size: "lg", className: "mt-5" })}>
            {body}
          </a>
        ) : (
          <Link href={href} className={btn({ size: "lg", className: "mt-5" })}>
            {body}
          </Link>
        )}
      </div>
    </Wrap>
  );
}
