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
import { joinMessage, waWith } from "../lib/qirat";
import { Band, CategoryArt, Kicker, Ornament, SectionHead, TextLink, Wrap, btn, delay } from "../ui";
import Quotes from "./Quotes";

// Merchant-configured sections in Qirat's language. Each renders only the
// merchant's own content (or real store data), never placeholder claims.
// Empty ones return null and QiratHome shows a Studio-only marker instead.

/** The offer ribbon on velvet: the merchant's lines divided by diamonds,
 *  drifting slowly when there's motion (two copies make the loop seamless). */
export function OfferStrip({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const row = (hidden?: boolean) => (
    <ul aria-hidden={hidden} className="qr-ribbon-row">
      {items.map((t, i) => (
        <li key={i}>
          <span>{t}</span>
          <span aria-hidden className="qr-ribbon-gem" />
        </li>
      ))}
    </ul>
  );
  return (
    <section data-tone="velvet" aria-label="عروض المتجر" className="qr-ribbon">
      <div className="qr-ribbon-track">
        {row()}
        {row(true)}
      </div>
    </section>
  );
}

/** "Our promise": the merchant's reasons in columns divided by gold
 *  hairlines, each under its emoji in a thin gold ring. */
export function Promises({ content, storeName }: { content?: WhyChooseUsContent; storeName: string }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 4) ?? [];
  if (cards.length === 0) return null;
  return (
    <Band tone="alt" className="qr-section">
      <Wrap>
        <SectionHead kicker={`وعد ${storeName}`} title={content?.headline || "ليه تختارنا؟"} />
        <ul className="qr-promises" style={{ ["--n" as string]: cards.length }}>
          {cards.map((c, i) => (
            <li key={i} className="qr-reveal" style={delay(i)}>
              <span aria-hidden className="qr-promise-icon">
                {c.icon || "◆"}
              </span>
              <h3 className="qr-h4 mt-5">{c.title}</h3>
              {c.description && <p className="mt-2 text-sm leading-6 text-(--qr-ink-2)">{c.description}</p>}
            </li>
          ))}
        </ul>
      </Wrap>
    </Band>
  );
}

/** The merchant's numbers in large serif figures between gold hairlines. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()).slice(0, 4) ?? [];
  if (stats.length === 0) return null;
  return (
    <Band tone="velvet" className="qr-section">
      <Wrap>
        {content?.headline && <SectionHead title={content.headline} />}
        <ul className="qr-stats" style={{ ["--n" as string]: stats.length }}>
          {stats.map((s, i) => (
            <li key={i} className="qr-reveal min-w-0" style={delay(i)}>
              <span className="qr-stat-value">{s.value}</span>
              <span className="mt-3 block text-sm text-(--qr-ink-2)">
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

/** Customer words, one at a time, set large. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 10) ?? [];
  if (items.length === 0) return null;
  return (
    <Band className="qr-section">
      <Wrap>
        <SectionHead kicker="آراء عملائنا" title={content?.headline || "بيقولوا عننا"} />
        <Quotes items={items} />
      </Wrap>
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
    <Band className="qr-section">
      <Wrap>
        <div className={cn("qr-reveal mx-auto", width, align)} style={bg ? { background: bg, padding: "clamp(2rem, 5vw, 4.5rem)", color: ink, borderRadius: "var(--qr-r)" } : undefined}>
          {content.heading && (
            <h2 className="qr-h1 text-balance" style={ink ? { color: ink } : undefined}>
              {content.heading}
            </h2>
          )}
          {align === "text-center" && content.heading && <Ornament className="mt-5" />}
          {content.paragraph && (
            <p className={cn("qr-lead mt-5 whitespace-pre-line", align === "text-center" && "mx-auto")} style={ink ? { color: ink, opacity: 0.82 } : undefined}>
              {content.paragraph}
            </p>
          )}
        </div>
      </Wrap>
    </Band>
  );
}

/** The Studio "custom banner": a full-bleed photo with the copy where the
 *  merchant aligned it and the overlay strength they chose. */
export function MediaBanner({ content, storeSlug, dir }: { content?: HeroBannerSettings; storeSlug: string; dir: "rtl" | "ltr" }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const a = content.textAlign ?? "center";
  const atStart = (a === "right") === (dir === "rtl");
  const align = a === "center" ? "items-center text-center" : atStart ? "items-start text-start" : "items-end text-end";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  const image = !!content.backgroundImage;
  return (
    <section className="qr-banner" data-media={image} data-tone={image ? undefined : "velvet"}>
      {image && <Image src={content.backgroundImage!} alt="" fill sizes="100vw" className="qr-banner-img object-cover" />}
      {image && <span aria-hidden className="absolute inset-0 bg-black" style={{ opacity: (content.overlayOpacity ?? 40) / 100 }} />}
      <div className={cn("qr-wrap relative flex h-full flex-col justify-center gap-4", align)}>
        {content.headline && <h2 className="qr-display qr-reveal max-w-[18ch] text-balance">{content.headline}</h2>}
        {content.subheadline && (
          <p className="qr-lead qr-reveal max-w-xl" style={delay(1)}>
            {content.subheadline}
          </p>
        )}
        <div className="qr-reveal mt-4" style={delay(2)}>
          <Link href={href} className={btn({ variant: "light", size: "lg" })}>
            {content.buttonText || "تسوّق دلوقتي"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function collectionHref(storeSlug: string, link?: string) {
  const v = link?.trim();
  if (!v) return buildStoreUrl(storeSlug, "/products");
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return buildStoreUrl(storeSlug, `/categories/${v}`);
}

/** Collections as tall framed plates with the name set in serif over the
 *  photo. The Studio has no editor for this section, so it falls back to the
 *  store's own collections and works as soon as it's on. */
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
    <Band className="qr-section">
      <Wrap>
        <SectionHead kicker="الكوليكشن" title={content?.headline || "اكتشف المجموعات"} />
        <ul className="qr-collections" data-n={items.length}>
          {items.map((c, i) => (
            <li key={i} className="qr-reveal min-w-0" style={delay(i)}>
              <Link href={collectionHref(storeSlug, c.link)} className="qr-collection group" data-media={!!c.image}>
                {c.image ? <Image src={c.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="qr-zoom object-cover" /> : <CategoryArt name={c.name} image={null} sizes="33vw" />}
                {c.image && <span aria-hidden className="qr-shade" />}
                <span className="qr-collection-copy">
                  <span className="qr-collection-name">{c.name}</span>
                  <span className="qr-collection-more">
                    <span className="qr-underline">اكتشف</span> ›
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

/** The house story: the merchant's photo in a passepartout frame (or the
 *  store's initial as a monogram), and the words set as a serif statement.
 *  Falls back to the store's own description. */
export function AboutBrand({ content, storeName, storeSlug, description }: { content?: AboutBrandContent; storeName: string; storeSlug: string; description: string | null }) {
  const text = content?.text?.trim() || description?.trim();
  if (!text && !content?.headline?.trim()) return null;
  const href = content?.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Band className="qr-section">
      <Wrap className="qr-story">
        <div className="qr-story-art qr-reveal">
          {content?.image ? (
            <span className="qr-frame block size-full">
              <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
            </span>
          ) : (
            <span aria-hidden className="qr-story-monogram">
              {[...storeName.trim()][0]}
            </span>
          )}
        </div>
        <div className="qr-story-copy">
          <Kicker className="qr-reveal">حكايتنا</Kicker>
          <h2 className="qr-h1 qr-reveal mt-3 text-balance" style={delay(1)}>
            {content?.headline || `عن ${storeName}`}
          </h2>
          <Ornament className="qr-reveal qr-orn--start mt-6" />
          {text && (
            <p className="qr-statement qr-reveal mt-6 whitespace-pre-line" style={delay(2)}>
              {text}
            </p>
          )}
          <div className="qr-reveal mt-8" style={delay(3)}>
            <TextLink href={href}>{content?.ctaText || "اعرف حكايتنا"}</TextLink>
          </div>
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
      {content?.ctaText || (whatsappHref ? "تابع الجديد على واتساب" : "تواصل معانا")}
    </>
  );
  return (
    <Band tone="alt" className="qr-section">
      <Wrap className="qr-join">
        <Kicker className="qr-reveal">أول من يعرف</Kicker>
        <h2 className="qr-h1 qr-reveal mt-3 text-balance" style={delay(1)}>
          {content?.headline || "الكوليكشن الجديد يوصلك الأول"}
        </h2>
        <Ornament className="qr-reveal mt-5" />
        <p className="qr-lead qr-reveal mx-auto mt-5 max-w-xl text-balance" style={delay(2)}>
          {content?.subheadline || "أول ما تنزل قطع جديدة أو عرض خاص، هنبعتلك."}
        </p>
        <div className="qr-reveal mt-8" style={delay(3)}>
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
