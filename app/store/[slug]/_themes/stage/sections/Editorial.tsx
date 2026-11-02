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
import { joinMessage, waWith } from "../lib/stage";
import Rail from "../product/Rail";
import { Band, CategoryArt, MoreLink, Rating, SectionHeader, Wrap, btn, delay } from "../ui";

// Merchant-configured sections in Casho Stage's language. Each renders only
// the merchant's own content (or real store data), no placeholder claims. Empty
// ones return null and StageHome shows a Studio-only marker instead.

/** Offer strip: the merchant's lines in a quiet centered row, apple.com's
 *  ribbon rather than a ticker. */
export function OfferStrip({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  return (
    <Band tone="alt" className="py-3.5">
      <ul aria-label="عروض المتجر" className="sg-offers">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </Band>
  );
}

/** "Why us" as apple.com/store's "difference" shelf: the promise in ink, its
 *  detail running on in gray, the merchant's emoji on top. */
export function TrustRow({ content, storeName }: { content?: WhyChooseUsContent; storeName: string }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 8) ?? [];
  if (cards.length === 0) return null;
  const title = content?.headline || `ليه ${storeName}؟`;
  return (
    <Band tone="alt" className="sg-section">
      <Rail label={title} title={title} tagline={content?.headline ? undefined : "أسباب أكتر تشتري مننا."}>
        {cards.map((c, i) => (
          <li key={i} className="sg-reveal" style={delay(Math.min(i, 4))}>
            <div className="sg-diff">
              <span aria-hidden className="sg-diff-icon">
                {c.icon || "✓"}
              </span>
              <p className="sg-diff-text">
                <span className="text-(--sg-ink)">{c.title.trim().replace(/[.!؟?]$/, "")}.</span> {c.description}
              </p>
            </div>
          </li>
        ))}
      </Rail>
    </Band>
  );
}

/** Numbers the way Apple states a spec: huge, in the tint's gradient, on night. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()).slice(0, 4) ?? [];
  if (stats.length === 0) return null;
  return (
    <Band tone="night" className="sg-section">
      <Wrap>
        {content?.headline && <h2 className="sg-display sg-reveal mx-auto mb-12 max-w-[20ch] text-center text-balance">{content.headline}</h2>}
        <ul className="sg-stats" style={{ ["--n" as string]: stats.length }}>
          {stats.map((s, i) => (
            <li key={i} className="sg-reveal min-w-0" style={delay(i)}>
              <span className="sg-stat-value sg-gradient-text">{s.value}</span>
              <span className="mt-2 block text-[1.0625rem] text-(--sg-label-2)">
                {s.icon && <span aria-hidden>{s.icon} </span>}
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </Wrap>
    </Band>
  );
}

/** Customer quotes as large-type cards on a shelf. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 8) ?? [];
  if (items.length === 0) return null;
  const title = content?.headline || "بيقولوا عننا";
  return (
    <Band tone="alt" className="sg-section">
      <Rail label={title} title={title} tagline={content?.headline ? undefined : "من عملائنا."}>
        {items.map((t, i) => (
          <li key={i} className="sg-reveal" style={delay(Math.min(i, 4))}>
            <figure className="sg-quote">
              {t.rating ? <Rating value={t.rating} size="md" /> : null}
              <blockquote className="sg-quote-text">{t.text}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-6">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--sg-fill) text-sm font-semibold text-(--sg-ink)">
                  {t.avatar ? <Image src={t.avatar} alt="" fill sizes="40px" className="object-cover" /> : [...t.name][0]}
                </span>
                <span className="text-[0.9375rem] font-semibold text-(--sg-ink)">{t.name}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </Rail>
    </Band>
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
    <Band className="sg-section">
      <Wrap>
        <div className={cn("sg-reveal mx-auto rounded-(--sg-r-xl)", width, align)} style={bg ? { background: bg, padding: "clamp(2rem, 5vw, 4rem)", color: ink } : undefined}>
          {content.heading && (
            <h2 className="sg-h1 text-balance" style={ink ? { color: ink } : undefined}>
              {content.heading}
            </h2>
          )}
          {content.paragraph && (
            <p className={cn("sg-lead mt-5 whitespace-pre-line", align === "text-center" && "mx-auto")} style={ink ? { color: ink, opacity: 0.8 } : undefined}>
              {content.paragraph}
            </p>
          )}
        </div>
      </Wrap>
    </Band>
  );
}

/** The Studio "custom banner" section: a full-bleed tile like the hero;
 *  alignment and the overlay strength come from the Studio. */
export function MediaBanner({ content, storeSlug, dir }: { content?: HeroBannerSettings; storeSlug: string; dir: "rtl" | "ltr" }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const a = content.textAlign ?? "center";
  const atStart = (a === "right") === (dir === "rtl");
  const align = a === "center" ? "items-center text-center" : atStart ? "items-start text-start" : "items-end text-end";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  const image = !!content.backgroundImage;
  return (
    <section className="sg-banner" data-media={image}>
      {image && <Image src={content.backgroundImage!} alt="" fill sizes="100vw" className="sg-banner-img object-cover" />}
      {image && <span aria-hidden className="absolute inset-0 bg-black" style={{ opacity: (content.overlayOpacity ?? 40) / 100 }} />}
      <div className={cn("sg-wrap relative flex h-full flex-col justify-center gap-3", align)}>
        {content.headline && <h2 className="sg-display sg-reveal max-w-[16ch] text-balance">{content.headline}</h2>}
        {content.subheadline && (
          <p className="sg-lead sg-reveal max-w-xl" style={delay(1)}>
            {content.subheadline}
          </p>
        )}
        <div className="sg-reveal mt-4" style={delay(2)}>
          <Link href={href} className={btn({ size: "lg" })}>
            {content.buttonText || "تسوّق دلوقتي"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function promoHref(storeSlug: string, link?: string) {
  const v = link?.trim();
  if (!v) return buildStoreUrl(storeSlug, "/products");
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return buildStoreUrl(storeSlug, `/categories/${v}`);
}

/** Collections as apple.com's home tiles, two to a row: the name at the top,
 *  the picture filling the tile. The Studio has no editor for this section, so
 *  it falls back to the store's own shelves and works as soon as it's on. */
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
    <section aria-label={content?.headline || "تسوّق بالمجموعة"}>
      {content?.headline && (
        <Wrap className="pt-(--sg-section)">
          <SectionHeader title={content.headline} />
        </Wrap>
      )}
      <ul className="sg-tiles" data-n={items.length}>
        {items.map((c, i) => (
          <li key={i} className="sg-reveal min-w-0" style={delay(i)}>
            <Link href={promoHref(storeSlug, c.link)} className="sg-tile group" data-media={!!c.image} data-tone={i % 3 === 0 ? "night" : "alt"}>
              {c.image ? <Image src={c.image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="sg-zoom-img object-cover" /> : <CategoryArt name={c.name} image={null} sizes="50vw" />}
              {c.image && <span aria-hidden className="sg-hero-shade" />}
              <span className="sg-tile-copy">
                <span className="sg-tile-title">{c.name}</span>
                <span className="sg-tile-more">تسوّق ›</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Brand story as one big statement, apple.com's environment-page style, over
 *  the merchant's photo when there is one. Falls back to the store's own
 *  description. */
export function AboutBrand({ content, storeName, storeSlug, description }: { content?: AboutBrandContent; storeName: string; storeSlug: string; description: string | null }) {
  const text = content?.text?.trim() || description?.trim();
  if (!text && !content?.headline?.trim()) return null;
  const href = content?.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Band className="sg-section">
      <Wrap>
        {content?.image && (
          <div className="sg-reveal relative mb-12 aspect-[16/10] overflow-hidden rounded-(--sg-r-xl) bg-(--sg-alt) sm:aspect-[21/9]">
            <Image src={content.image} alt="" fill sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />
          </div>
        )}
        <div className="sg-about">
          <p className="sg-eyebrow sg-reveal !text-(--sg-label-2)">{content?.headline || `عن ${storeName}`}</p>
          {text && (
            <p className="sg-statement sg-reveal" style={delay(1)}>
              {text}
            </p>
          )}
          <MoreLink href={href} className="sg-reveal mt-6 text-[1.0625rem]">
            {content?.ctaText || "اعرف حكايتنا"}
          </MoreLink>
        </div>
      </Wrap>
    </Band>
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
      {content?.ctaText || (whatsappHref ? "تابعنا على واتساب" : "تواصل معانا")}
    </>
  );
  return (
    <Band tone="alt" className="sg-section">
      <Wrap className="sg-join">
        <h2 className="sg-h1 sg-reveal text-balance">{content?.headline || "خليك أول من يعرف."}</h2>
        <p className="sg-lead sg-reveal mt-3 max-w-xl text-balance" style={delay(1)}>
          {content?.subheadline || "أول ما ينزل منتج جديد أو عرض، هيوصلك."}
        </p>
        <div className="sg-reveal mt-8" style={delay(2)}>
          {whatsappHref ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className={btn({ size: "lg" })}>
              {body}
            </a>
          ) : (
            <Link href={href} className={btn({ size: "lg" })}>
              {body}
            </Link>
          )}
        </div>
      </Wrap>
    </Band>
  );
}
