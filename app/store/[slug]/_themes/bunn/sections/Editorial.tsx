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
import { BeanIcon } from "../icons";
import { joinMessage, waWith } from "../lib/coffee";
import Rail from "../product/Rail";
import { Band, CategoryArt, Kicker, Rating, SectionHead, TextLink, Wrap, btn, delay, num2 } from "../ui";
import Stamp from "./Stamp";
import { st } from "@/lib/i18n/storefront";

// Merchant-configured sections in Bunn's language. Each renders only the
// merchant's own content (or real store data), never placeholder claims.
// Empty ones return null and BunnHome shows a Studio-only marker instead.

/** The ticker on espresso: the merchant's lines divided by beans, drifting
 *  slowly when there's motion (two copies make the loop seamless). */
export function OfferStrip({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const row = (hidden?: boolean) => (
    <ul aria-hidden={hidden} className="bn-ticker-row">
      {items.map((t, i) => (
        <li key={i}>
          <span>{t}</span>
          <BeanIcon aria-hidden className="bn-ticker-bean" />
        </li>
      ))}
    </ul>
  );
  return (
    <section data-tone="espresso" aria-label={st("عروض المتجر")} className="bn-ticker">
      <div className="bn-ticker-track">
        {row()}
        {row(true)}
      </div>
    </section>
  );
}

/** "Our promise" as numbered labels with dashed edges, each under its emoji. */
export function Promises({ content, storeName }: { content?: WhyChooseUsContent; storeName: string }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 4) ?? [];
  if (cards.length === 0) return null;
  return (
    <Band tone="alt" className="bn-section">
      <Wrap>
        <SectionHead kicker={st("وعد {0}", storeName)} title={content?.headline || st("ليه تشرب قهوتك مننا؟")} />
        <ul className="bn-promises" style={{ ["--n" as string]: cards.length }}>
          {cards.map((c, i) => (
            <li key={i} className="bn-promise bn-reveal" style={delay(i)}>
              <span className="bn-promise-top">
                <span aria-hidden className="bn-promise-icon">
                  {c.icon || "☕"}
                </span>
                <span aria-hidden className="bn-num bn-promise-n">
                  {num2(i + 1)}
                </span>
              </span>
              <h3 className="bn-h4 mt-6">{c.title}</h3>
              {c.description && <p className="mt-2 text-sm leading-6 text-(--bn-ink-2)">{c.description}</p>}
            </li>
          ))}
        </ul>
      </Wrap>
    </Band>
  );
}

/** The merchant's numbers set big, divided by dashed rules. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()).slice(0, 4) ?? [];
  if (stats.length === 0) return null;
  return (
    <Band tone="espresso" className="bn-section">
      <Wrap>
        {content?.headline && <SectionHead title={content.headline} />}
        <ul className="bn-stats" style={{ ["--n" as string]: stats.length }}>
          {stats.map((s, i) => (
            <li key={i} className="bn-reveal min-w-0" style={delay(i)}>
              <span className="bn-stat-value">{s.value}</span>
              <span className="mt-3 block text-sm text-(--bn-ink-2)">
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

/** Customer words on café order tickets — perforated edges, the stars and
 *  the name at the foot — on a shelf that slides. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 12) ?? [];
  if (items.length === 0) return null;
  const title = content?.headline || st("بيقولوا إيه عن قهوتنا");
  return (
    <Band tone="alt" className="bn-section">
      <Rail label={title} title={title} kicker={st("من عملائنا")} listClassName="bn-shelf--tickets">
        {items.map((t, i) => (
          <li key={i} className="min-w-0">
            <figure className="bn-ticket bn-reveal" style={delay(Math.min(i, 5))}>
              <p className="bn-ticket-no bn-num" aria-hidden>
                #{num2(i + 1)}
              </p>
              <blockquote className="bn-ticket-text">{t.text}</blockquote>
              <figcaption className="bn-ticket-foot">
                {t.avatar ? (
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-full">
                    <Image src={t.avatar} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                ) : (
                  <span aria-hidden className="bn-ticket-initial">
                    {[...t.name.trim()][0]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-(--bn-ink)">{t.name}</span>
                  {t.rating ? <Rating value={t.rating} /> : null}
                </span>
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
    <Band className="bn-section">
      <Wrap>
        <div className={cn("bn-reveal mx-auto", width, align)} style={bg ? { background: bg, padding: "clamp(2rem, 5vw, 4.5rem)", color: ink, borderRadius: "var(--bn-r-lg)" } : undefined}>
          {content.heading && (
            <h2 className="bn-h1 text-balance" style={ink ? { color: ink } : undefined}>
              {content.heading}
            </h2>
          )}
          {content.paragraph && (
            <p className={cn("bn-lead mt-5 whitespace-pre-line", align === "text-center" && "mx-auto")} style={ink ? { color: ink, opacity: 0.82 } : undefined}>
              {content.paragraph}
            </p>
          )}
        </div>
      </Wrap>
    </Band>
  );
}

/** The Studio "custom banner": a wide photo with the copy where the merchant
 *  aligned it and the overlay strength they chose. */
export function MediaBanner({ content, storeSlug, dir }: { content?: HeroBannerSettings; storeSlug: string; dir: "rtl" | "ltr" }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const a = content.textAlign ?? "center";
  const atStart = (a === "right") === (dir === "rtl");
  const align = a === "center" ? "items-center text-center" : atStart ? "items-start text-start" : "items-end text-end";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  const image = !!content.backgroundImage;
  return (
    <section className="bn-section bn-section--tight">
      <Wrap>
        <div className="bn-banner" data-media={image} data-tone={image ? undefined : "espresso"}>
          {image && <Image src={content.backgroundImage!} alt="" fill sizes="(max-width: 1400px) 100vw, 1400px" className="bn-banner-img object-cover" />}
          {image && <span aria-hidden className="absolute inset-0 bg-black" style={{ opacity: (content.overlayOpacity ?? 40) / 100 }} />}
          <div className={cn("relative flex h-full flex-col justify-center gap-4 p-[clamp(1.5rem,5vw,4.5rem)]", align)}>
            {content.headline && <h2 className="bn-display-lg bn-reveal max-w-[18ch] text-balance">{content.headline}</h2>}
            {content.subheadline && (
              <p className="bn-lead bn-reveal max-w-xl" style={delay(1)}>
                {content.subheadline}
              </p>
            )}
            <div className="bn-reveal mt-3" style={delay(2)}>
              <Link href={href} className={btn({ variant: "crema", size: "lg" })}>
                {content.buttonText || st("تسوّق دلوقتي")}
              </Link>
            </div>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

function collectionHref(storeSlug: string, link?: string) {
  const v = link?.trim();
  if (!v) return buildStoreUrl(storeSlug, "/products");
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return buildStoreUrl(storeSlug, `/categories/${v}`);
}

/** Collections as tall photos with their name on a kraft label. The Studio has
 *  no editor for this section, so it falls back to the store's sections. */
export function Collections({ content, categories, storeSlug }: { content?: CollectionsContent; categories: CategoryLink[]; storeSlug: string }) {
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
    <Band className="bn-section">
      <Wrap>
        <SectionHead kicker={st("المجموعات")} title={content?.headline || st("اكتشف أكتر")} />
        <ul className="bn-collections" data-n={items.length}>
          {items.map((c, i) => (
            <li key={i} className="bn-reveal min-w-0" style={delay(i)}>
              <Link href={collectionHref(storeSlug, c.link)} className="bn-collection group" data-media={!!c.image}>
                {c.image ? <Image src={c.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="bn-zoom object-cover" /> : <CategoryArt name={c.name} image={null} sizes="33vw" />}
                <span className="bn-collection-label">
                  <span className="bn-display block truncate text-lg">{c.name}</span>
                  <span className="bn-link mt-1 text-xs">
                    <span className="bn-underline">{st("اكتشف")}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    </Band>
  );
}

/** The roastery's story: the merchant's photo framed round like a cup with
 *  the stamp on its rim (or the store's initial), and the words beside it.
 *  Falls back to the store's own description. */
export function AboutBrand({ content, storeName, storeSlug, description }: { content?: AboutBrandContent; storeName: string; storeSlug: string; description: string | null }) {
  const text = content?.text?.trim() || description?.trim();
  if (!text && !content?.headline?.trim()) return null;
  const href = content?.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Band className="bn-section">
      <Wrap className="bn-story">
        <div className="bn-story-art bn-reveal">
          {content?.image ? (
            <span className="bn-story-photo">
              <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 90vw, 36vw" className="object-cover" />
            </span>
          ) : (
            <span aria-hidden className="bn-story-monogram">
              {[...storeName.trim()][0]}
            </span>
          )}
          <Stamp words={[storeName]} className="bn-story-stamp" />
        </div>
        <div className="bn-story-copy">
          <Kicker className="bn-reveal">{st("حكايتنا")}</Kicker>
          <h2 className="bn-h1 bn-reveal mt-3 text-balance" style={delay(1)}>
            {content?.headline || st("عن {0}", storeName)}
          </h2>
          {text && (
            <p className="bn-statement bn-reveal mt-6 whitespace-pre-line" style={delay(2)}>
              {text}
            </p>
          )}
          <div className="bn-reveal mt-8" style={delay(3)}>
            <TextLink href={href}>{content?.ctaText || st("اعرف حكايتنا")}</TextLink>
          </div>
        </div>
      </Wrap>
    </Band>
  );
}

/** "Join" band. Casho has no newsletter inbox, so instead of a form that goes
 *  nowhere this hands the shopper to the store's WhatsApp (or contact page). */
export function JoinBand({ content, storeName, storeSlug, whatsappHref }: { content?: NewsletterContent; storeName: string; storeSlug: string; whatsappHref: string | null }) {
  const href = whatsappHref ? waWith(whatsappHref, joinMessage(storeName)) : buildStoreUrl(storeSlug, "/contact");
  const body = (
    <>
      {whatsappHref && <MessageCircle />}
      {content?.ctaText || (whatsappHref ? st("ابعتلنا على واتساب") : st("تواصل معانا"))}
    </>
  );
  return (
    <Band tone="espresso" className="bn-section bn-join">
      <Wrap className="bn-join-inner">
        <div>
          <Kicker className="bn-reveal">{st("أول من يعرف")}</Kicker>
          <h2 className="bn-display-lg bn-reveal mt-3 text-balance" style={delay(1)}>
            {content?.headline || st("المحصول الجديد يوصلك أول ما يتحمّص")}
          </h2>
          <p className="bn-lead bn-reveal mt-4 max-w-xl text-balance" style={delay(2)}>
            {content?.subheadline || st("أول ما ينزل بن جديد أو عرض، هنبعتلك.")}
          </p>
        </div>
        <div className="bn-reveal" style={delay(3)}>
          {whatsappHref ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className={btn({ variant: "crema", size: "lg" })}>
              {body}
            </a>
          ) : (
            <Link href={href} className={btn({ variant: "crema", size: "lg" })}>
              {body}
            </Link>
          )}
        </div>
      </Wrap>
    </Band>
  );
}
