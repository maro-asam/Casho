import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type {
  AboutBrandContent,
  HeroBannerSettings,
  OfferStripContent,
  RichTextSettings,
  SocialProofContent,
  WhyChooseUsContent,
} from "@/types/store-theme.types";
import { Wrap, btn, delay } from "../ui";

// Merchant-configured editorial sections in Dune's language. Each renders only
// the merchant's own content — no placeholder claims.

/** Full-bleed photo with parallax and a text card overlapping one side
 *  (the brand story). Without a photo it becomes a quiet centered block. */
export function ImageWithText({ content, storeName, storeSlug }: { content?: AboutBrandContent; storeName: string; storeSlug: string }) {
  if (!content?.text?.trim() && !content?.headline?.trim()) return null;
  const href = content.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  const body = (
    <>
      <p className="dn-label dn-appear text-(--dn-quiet)">حكايتنا</p>
      <h2 className="dn-h2 dn-appear mt-4 text-balance" style={delay(1)}>
        {content.headline || `عن ${storeName}`}
      </h2>
      {content.text && (
        <p className="dn-prose dn-appear mt-5 text-[0.9375rem]" style={delay(2)}>
          {content.text}
        </p>
      )}
      <Link href={href} className={btn({ variant: "outline", className: "dn-appear mt-8" })} style={delay(3)}>
        {content.ctaText || "اعرف أكتر"}
      </Link>
    </>
  );

  if (!content.image) {
    return (
      <Wrap data-reveal className="dn-section">
        <div className="dn-narrow flex flex-col items-center text-center [&_.dn-prose]:mx-auto">{body}</div>
      </Wrap>
    );
  }

  return (
    <section data-reveal className="dn-section">
      <div className="relative lg:min-h-[44rem]">
        <div className="dn-crop relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
          <div className="absolute inset-0">
            <div data-parallax className="absolute inset-x-0 -inset-y-[14%]">
              <Image src={content.image} alt="" fill sizes="100vw" className="object-cover" />
            </div>
          </div>
        </div>
        <div className="dn-wrap relative lg:flex lg:min-h-[44rem] lg:items-center">
          <div className="-mt-16 bg-(--dn-bg) p-7 sm:mx-8 sm:p-10 lg:m-0 lg:w-[30rem] lg:p-14">{body}</div>
        </div>
      </div>
    </section>
  );
}

/** Merchant image banner from the visual builder. */
export function ImageBanner({ content, storeSlug }: { content?: HeroBannerSettings; storeSlug: string }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const align = content.textAlign === "center" ? "items-center text-center" : content.textAlign === "left" ? "items-end text-left" : "items-start text-start";
  return (
    <section data-reveal className="dn-section">
      <div className="relative overflow-hidden bg-(--dn-accent) text-white">
        {content.backgroundImage && (
          <div data-parallax className="absolute inset-x-0 -inset-y-[12%]">
            <Image src={content.backgroundImage} alt="" fill sizes="100vw" className="object-cover" />
          </div>
        )}
        <span aria-hidden className="absolute inset-0 bg-[#1d1d1c]" style={{ opacity: (content.overlayOpacity ?? 35) / 100 }} />
        <div className={cn("dn-wrap relative flex min-h-[26rem] flex-col justify-center py-16 sm:min-h-[34rem]", align)}>
          {content.headline && (
            <h2 className="dn-hero dn-appear max-w-4xl text-balance text-[clamp(2.5rem,6vw,5.5rem)]">{content.headline}</h2>
          )}
          {content.subheadline && (
            <p className="dn-appear mt-5 max-w-xl text-base leading-8 opacity-90" style={delay(1)}>
              {content.subheadline}
            </p>
          )}
          {content.buttonText && (
            <Link href={content.buttonLink?.trim() || buildStoreUrl(storeSlug, "/products")} className={btn({ variant: "light", size: "lg", className: "dn-appear mt-8" })} style={delay(2)}>
              {content.buttonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/** Large serif text scrolling across the page (the offer strip). */
export function ScrollingText({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  const run = Array.from({ length: Math.max(2, Math.ceil(6 / items.length)) }, () => items).flat();
  return (
    <div className="dn-marquee my-[calc(var(--dn-section)/4)] overflow-hidden border-y border-(--dn-line) py-5 sm:py-7" role="region" aria-label="عروض">
      <p className="sr-only">{items.join(" — ")}</p>
      <div className="dn-marquee-track" aria-hidden>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {run.map((t, i) => (
              <li key={i} className="dn-serif flex items-center gap-10 pe-10 text-[clamp(1.75rem,4vw,3.5rem)] leading-none whitespace-nowrap">
                {t}
                <span className="text-[0.5em] text-(--dn-sale)">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Big numbers separated by hairlines. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()) ?? [];
  if (stats.length === 0) return null;
  return (
    <Wrap data-reveal className="dn-section">
      {content?.headline && <h2 className="dn-h2 dn-appear mb-10 text-center">{content.headline}</h2>}
      <ul className={cn("grid grid-cols-2 border-y border-(--dn-line)", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {stats.map((s, i) => (
          <li key={i} className="dn-appear flex flex-col items-center border-(--dn-line) px-4 py-9 text-center odd:border-e lg:border-e lg:last:border-e-0" style={delay(i)}>
            <span className="dn-num text-[clamp(2.75rem,5vw,4.25rem)] leading-none">{s.value}</span>
            <span className="mt-3 text-sm text-(--dn-quiet)">
              {s.icon && <span aria-hidden>{s.icon} </span>}
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Text columns: the store's own promises. */
export function TextColumns({ content }: { content?: WhyChooseUsContent }) {
  const cards = content?.cards?.filter((c) => c.title?.trim()) ?? [];
  if (cards.length === 0) return null;
  return (
    <Wrap data-reveal className="dn-section">
      {content?.headline && <h2 className="dn-h2 dn-appear mb-12 text-center text-balance">{content.headline}</h2>}
      <ul className={cn("grid grid-cols-1 gap-10 sm:grid-cols-2", cards.length >= 4 && "lg:grid-cols-4", cards.length === 3 && "lg:grid-cols-3")}>
        {cards.map((c, i) => (
          <li key={i} className="dn-appear flex flex-col items-center text-center" style={delay(i)}>
            <span aria-hidden className="grid size-16 place-items-center rounded-full bg-(--dn-plate) text-2xl">
              {c.icon || "✦"}
            </span>
            <span className="dn-h4 mt-5">{c.title}</span>
            {c.description && <span className="mt-2 max-w-xs text-sm leading-7 text-(--dn-quiet)">{c.description}</span>}
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

export function RichText({ content }: { content?: RichTextSettings }) {
  if (!content?.heading?.trim() && !content?.paragraph?.trim()) return null;
  const width = content.width === "narrow" ? "max-w-2xl" : content.width === "wide" ? "max-w-5xl" : content.width === "full" ? "max-w-none" : "max-w-3xl";
  const align = content.textAlign === "left" ? "me-auto text-left" : content.textAlign === "right" ? "ms-auto text-right" : "mx-auto text-center";
  return (
    <Wrap data-reveal className="dn-section">
      <div className={cn(width, align)} style={content.backgroundColor ? { background: content.backgroundColor, padding: "3rem 2rem" } : undefined}>
        {content.heading && <h2 className="dn-h2 dn-appear text-balance">{content.heading}</h2>}
        {content.paragraph && (
          <p className="dn-prose dn-appear mt-5 max-w-none" style={delay(1)}>
            {content.paragraph}
          </p>
        )}
      </div>
    </Wrap>
  );
}

