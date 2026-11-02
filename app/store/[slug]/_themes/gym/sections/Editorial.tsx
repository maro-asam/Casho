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
import { joinMessage, waWith } from "../lib/coach";
import Rail from "../product/Rail";
import { Arrow, Chevron, Rating, SectionHeader, Wrap, btn, delay, num2 } from "../ui";

// Merchant-configured sections in Casho Gym's language. Each renders only the
// merchant's own content (or real store data) — no placeholder claims. Empty
// ones return null and GymHome shows a Studio-only marker instead.

/** Offer strip: two crossed bands of gym tape, the merchant's messages running
 *  along the top one. */
export function OfferStrip({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const run = Array.from({ length: Math.max(2, Math.ceil(8 / items.length)) }, () => items).flat();
  return (
    <div className="gy-tape-wrap gy-marquee my-[calc(var(--gy-section)/6)]" role="region" aria-label="عروض المتجر">
      <p className="sr-only">{items.join(" — ")}</p>
      <div aria-hidden className="gy-tape gy-tape--under" />
      <div className="gy-tape py-3">
        <div className="gy-marquee-track" aria-hidden style={{ ["--gy-marquee-dur" as string]: `${run.length * 6}s` }}>
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {run.map((t, i) => (
                <li key={i} className="gy-tape-item">
                  {t}
                  <i />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The store's promises (why choose us) as numbered spec plates. */
export function TrustRow({ content }: { content?: WhyChooseUsContent }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()).slice(0, 4) ?? [];
  if (cards.length === 0) return null;
  return (
    <Wrap className="gy-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className={cn("grid gap-(--gy-gap) sm:grid-cols-2", cards.length >= 4 ? "lg:grid-cols-4" : cards.length === 3 ? "lg:grid-cols-3" : "")}>
        {cards.map((c, i) => (
          <li key={i} className="gy-reveal min-w-0" style={delay(i)}>
            <div className="gy-spec">
              <span aria-hidden className="gy-spec-num">
                {num2(i + 1)}
              </span>
              <span aria-hidden className="gy-spec-icon">
                {c.icon || "🏋️"}
              </span>
              <p className="gy-h3 relative mt-4">{c.title}</p>
              {c.description && <p className="relative mt-1.5 text-sm leading-6 text-(--gy-quiet)">{c.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Numbers as a scoreboard between two steel rules. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()) ?? [];
  if (stats.length === 0) return null;
  return (
    <Wrap className="gy-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className="gy-score gy-knurl" style={{ ["--n" as string]: Math.min(stats.length, 4) }}>
        {stats.slice(0, 4).map((s, i) => (
          <li key={i} className="gy-reveal min-w-0" style={delay(i)}>
            {s.icon && (
              <span aria-hidden className="mb-2 block text-2xl">
                {s.icon}
              </span>
            )}
            <span className="gy-score-value">{s.value}</span>
            <span className="mt-2 block text-sm font-bold text-(--gy-quiet)">{s.label}</span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Customer quotes in a swipe row, each under a heavy red quote mark. */
export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 8) ?? [];
  if (items.length === 0) return null;
  const title = content?.headline || "آراء عملائنا";
  return (
    <Wrap className="gy-section">
      <Rail label={title} eyebrow="من العملاء" title={title} listClassName="[&>li]:!w-[86%] sm:[&>li]:!w-[calc((100%-var(--gy-gap))/2)] lg:[&>li]:!w-[calc((100%-var(--gy-gap)*2)/3)]">
        {items.map((t, i) => (
          <li key={i} className="min-w-0">
            <figure className="gy-quote">
              <span aria-hidden className="gy-quote-mark">
                ”
              </span>
              {t.rating ? <Rating value={t.rating} size="md" className="relative" /> : <span className="h-4" />}
              <blockquote className="relative mt-4 flex-1 text-[1.0625rem] leading-8 font-semibold text-(--gy-ink)">{t.text}</blockquote>
              <figcaption className="relative mt-5 flex items-center gap-3 border-t border-(--gy-line) pt-4">
                <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-(--gy-r-sm) bg-(--gy-btn) font-black text-(--gy-btn-ink)">
                  {t.avatar ? <Image src={t.avatar} alt="" fill sizes="44px" className="object-cover" /> : [...t.name][0]}
                </span>
                <span className="font-extrabold text-(--gy-ink)">{t.name}</span>
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
    <Wrap className="gy-section">
      <div className={cn("mx-auto rounded-(--gy-r)", width, align)} style={bg ? { background: bg, padding: "2.5rem 2rem", color: ink } : undefined}>
        {content.heading && (
          <h2 className="gy-h2 text-balance" style={ink ? { color: ink } : undefined}>
            {content.heading}
          </h2>
        )}
        {content.paragraph && (
          <p className="gy-prose mt-4 max-w-none" style={ink ? { color: ink } : undefined}>
            {content.paragraph}
          </p>
        )}
      </div>
    </Wrap>
  );
}

/** The Studio "custom banner" section: a full-bleed photo with a slanted foot;
 *  alignment and the overlay strength come from the Studio. */
export function MediaBanner({ content, storeSlug, dir }: { content?: HeroBannerSettings; storeSlug: string; dir: "rtl" | "ltr" }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const a = content.textAlign ?? "right";
  const atStart = (a === "right") === (dir === "rtl");
  const align = a === "center" ? "items-center text-center" : atStart ? "items-start text-start" : "items-end text-end";
  const href = content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products");
  const image = !!content.backgroundImage;
  return (
    <section className="gy-banner" data-image={image}>
      {image && <Image src={content.backgroundImage!} alt="" fill sizes="100vw" className="object-cover" />}
      {image && <span aria-hidden className="absolute inset-0 bg-black" style={{ opacity: (content.overlayOpacity ?? 50) / 100 }} />}
      <div className={cn("gy-wrap relative flex flex-col justify-center py-14 pb-20", align)}>
        {content.subheadline && <p className="gy-reveal text-base font-bold sm:text-lg">{content.subheadline}</p>}
        {content.headline && <h2 className="gy-hero gy-reveal mt-2 max-w-[18ch] text-balance !text-current">{content.headline}</h2>}
        <Link href={href} className={btn({ variant: image ? "solid" : "white", size: "lg", className: "gy-reveal mt-7" })}>
          {content.buttonText || "تسوّق دلوقتي"}
          <Arrow />
        </Link>
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

/** Collections as tall posters; the one under the cursor takes the room. The
 *  Studio has no editor for this section, so it falls back to the store's
 *  own top shelves and works as soon as it's turned on. */
export function PromoTiles({ content, categories, storeSlug }: { content?: CollectionsContent; categories: CategoryLink[]; storeSlug: string }) {
  const own = content?.items?.filter((c) => c.name?.trim()).slice(0, 4) ?? [];
  const items = own.length
    ? own
    : categories
        .filter((c) => c.productCount > 0)
        .sort((a, b) => Number(!!b.image) - Number(!!a.image))
        .slice(0, 4)
        .map((c) => ({ name: c.name, image: c.image ?? undefined, link: c.slug }));
  if (items.length === 0) return null;
  return (
    <Wrap className="gy-section">
      <SectionHeader eyebrow="المجموعات" title={content?.headline || "اختار طريقك"} />
      <ul className="gy-posters">
        {items.map((c, i) => (
          <li key={i} className="gy-reveal" style={delay(i)}>
            <Link href={promoHref(storeSlug, c.link)} className="gy-poster-tile group" data-image={!!c.image}>
              {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 768px) 100vw, 40vw" className="gy-zoom-img object-cover" />}
              {c.image && <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.82),transparent_60%)]" />}
              <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-5 sm:p-6">
                <span className="gy-h2 !text-current text-balance">{c.name}</span>
                <span className="grid size-11 shrink-0 skew-x-(--gy-slant) place-items-center bg-(--gy-btn) text-(--gy-btn-ink) transition-transform group-hover:-translate-x-1 ltr:group-hover:translate-x-1">
                  <Chevron className="size-5" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Brand story beside the merchant's photo, a red block offset behind it.
 *  Falls back to the store's own description. */
export function AboutBrand({ content, storeName, storeSlug, description }: { content?: AboutBrandContent; storeName: string; storeSlug: string; description: string | null }) {
  const text = content?.text?.trim() || description?.trim();
  if (!text && !content?.headline?.trim()) return null;
  const href = content?.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Wrap className="gy-section">
      <div className={cn("grid items-center gap-8 lg:gap-16", content?.image && "lg:grid-cols-2")}>
        {content?.image && (
          <div className="relative ms-3 mt-3">
            <span aria-hidden className="absolute -inset-s-3 -top-3 h-full w-full bg-(--gy-btn)" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-(--gy-r) bg-(--gy-band)">
              <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
            </div>
          </div>
        )}
        <div className="min-w-0">
          <p className="gy-eyebrow">{storeName}</p>
          <h2 className="gy-h2 mt-2 text-balance">{content?.headline || `عن ${storeName}`}</h2>
          {text && <p className="gy-prose mt-4 line-clamp-6 text-base">{text}</p>}
          <Link href={href} className={btn({ variant: "outline", size: "lg", className: "mt-6" })}>
            {content?.ctaText || "اعرف أكتر عنّا"}
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
    <Wrap className="gy-section">
      <div className="gy-knurl flex flex-col items-start gap-5 rounded-(--gy-r) bg-(--gy-btn) p-6 text-(--gy-btn-ink) sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="gy-h2 !text-current text-balance">{content?.headline || "اعرف العروض قبل أي حد"}</h2>
          <p className="mt-2 max-w-xl text-base opacity-90">{content?.subheadline || "أول ما ينزل عرض أو منتج جديد، هتعرف."}</p>
        </div>
        {whatsappHref ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={btn({ variant: "white", size: "lg" })}>
            {body}
          </a>
        ) : (
          <Link href={href} className={btn({ variant: "white", size: "lg" })}>
            {body}
          </Link>
        )}
      </div>
    </Wrap>
  );
}
