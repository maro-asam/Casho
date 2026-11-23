import Image from "next/image";
import Link from "next/link";
import { Gamepad2, MessageCircle, PackageCheck, Quote, Sparkles, Star, Zap } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoryLink } from "../../types";
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
import { Arrow, Panel, SectionHead, num, stagger } from "../ui";
import { st } from "@/lib/i18n/storefront";

/** Section wrapper: the content column and the section rhythm. */
export function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("an-wrap an-section", className)}>
      {children}
    </section>
  );
}

/** The merchant's offers as glowing pills (wraps; no marquee). */
export function OfferStrip({ content }: { content?: OfferStripContent }) {
  const items = content?.items?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (items.length === 0) return null;
  return (
    <div className="an-wrap an-offers-wrap">
      <ul aria-label={st("عروض المتجر")} className="an-offers">
        {items.map((t, i) => (
          <li key={i}>
            <Zap aria-hidden className="size-3.5 shrink-0 text-(--an-gold)" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEP_ICONS = [Sparkles, Zap, PackageCheck];

/**
 * "كيف يشتغل الطلب؟" — the reference's three numbered cards. The merchant's
 * "why us" cards fill it when written; otherwise the store's real order flow
 * (pick the game, the package, send the account) explains itself.
 */
export function Steps({ content, askPlayer }: { content?: WhyChooseUsContent; askPlayer: boolean }) {
  const own = content?.cards?.filter((c) => c.title?.trim()).slice(0, 6) ?? [];
  const cards =
    own.length > 0
      ? own.map((c) => ({ icon: c.icon, title: c.title, description: c.description }))
      : [
          { icon: "", title: st("اختار اللعبة"), description: st("كل الألعاب والتطبيقات في مكان واحد.") },
          { icon: "", title: st("حدّد الباقة"), description: st("اختار عدد الجواهر أو الشدات أو العملات اللي تناسبك.") },
          askPlayer
            ? { icon: "", title: st("ابعت معرّفك"), description: st("اكتب معرّف اللاعب وتابع طلبك من «طلباتي».") }
            : { icon: "", title: st("أكّد طلبك"), description: st("اكتب رقمك وتابع طلبك من «طلباتي».") },
        ];
  return (
    <Section>
      <SectionHead title={content?.headline || (own.length ? st("ليه تشحن مننا؟") : st("إزاي بيتم الطلب؟"))} />
      <ol className="an-steps">
        {cards.map((c, i) => {
          const Icon = STEP_ICONS[i % STEP_ICONS.length];
          return (
            <Panel as="li" key={i} className="an-stepcard an-rise" style={stagger(i)}>
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="an-stepicon">
                  {c.icon?.trim() ? <span className="text-base leading-none">{c.icon}</span> : <Icon className="size-4" />}
                </span>
                <span className="an-h4">{c.title}</span>
                <span aria-hidden className="an-stepnum">
                  {num(i + 1)}
                </span>
              </span>
              {c.description && <p className="mt-2 text-[0.75rem] leading-relaxed text-(--an-muted)">{c.description}</p>}
            </Panel>
          );
        })}
      </ol>
    </Section>
  );
}

/** The merchant's own numbers. */
export function Stats({ content }: { content?: SocialProofContent }) {
  const stats = content?.stats?.filter((s) => s.value?.trim()) ?? [];
  if (!stats.length) return null;
  return (
    <Section>
      {content?.headline && <SectionHead title={content.headline} />}
      <ul className="an-stats">
        {stats.map((s, i) => (
          <Panel as="li" key={i} className="an-rise p-4 text-center" style={stagger(i)}>
            {s.icon && (
              <span aria-hidden className="text-xl">
                {s.icon}
              </span>
            )}
            <p className="an-stat">{s.value}</p>
            <p className="text-[0.75rem] text-(--an-muted)">{s.label}</p>
          </Panel>
        ))}
      </ul>
    </Section>
  );
}

export function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()) ?? [];
  if (!items.length) return null;
  return (
    <Section>
      <SectionHead title={content?.headline || st("آراء العملاء")} />
      <ul className="an-quotes">
        {items.slice(0, 6).map((t, i) => (
          <Panel as="li" key={i} className="an-rise p-4" style={stagger(i)}>
            <Quote aria-hidden className="size-5 text-(--an-soft)" />
            <p className="mt-2 text-[0.875rem] leading-7">{t.text}</p>
            <p className="mt-3 flex items-center justify-between gap-2 text-[0.75rem] text-(--an-muted)">
              <span className="font-bold text-(--an-ink)">{t.name}</span>
              {t.rating ? (
                <span className="flex gap-0.5 text-(--an-gold)" aria-label={st("{0} من ٥", num(t.rating))}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <Star key={k} aria-hidden className="size-3" fill={k < (t.rating ?? 0) ? "currentColor" : "none"} />
                  ))}
                </span>
              ) : null}
            </p>
          </Panel>
        ))}
      </ul>
    </Section>
  );
}

export function AboutBrand({ content, storeName, storeSlug, description }: { content?: AboutBrandContent; storeName: string; storeSlug: string; description: string | null }) {
  const text = content?.text?.trim() || description?.trim();
  if (!text && !content?.headline?.trim()) return null;
  return (
    <Section>
      <Panel className="an-about">
        {content?.image && (
          <span className="an-about-media">
            <Image src={content.image} alt="" fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover" />
          </span>
        )}
        <div className="min-w-0 p-5 md:p-7">
          <h2 className="an-h2">{content?.headline || st("عن {0}", storeName)}</h2>
          {text && <p className="an-sub mt-2 whitespace-pre-line !text-[0.875rem] !leading-7">{text}</p>}
          <Link href={content?.ctaLink || buildStoreUrl(storeSlug, "/about")} className="an-btn an-btn--glass mt-5">
            {content?.ctaText || st("اعرف أكتر")}
          </Link>
        </div>
      </Panel>
    </Section>
  );
}

export function RichText({ content }: { content?: RichTextSettings }) {
  if (!content?.heading?.trim() && !content?.paragraph?.trim()) return null;
  return (
    <Section>
      <div className={cn("an-richtext", content.textAlign === "center" && "text-center")}>
        {content.heading && <h2 className="an-h2">{content.heading}</h2>}
        {content.paragraph && <p className="an-sub mt-2 whitespace-pre-line !text-[0.9375rem] !leading-8">{content.paragraph}</p>}
      </div>
    </Section>
  );
}

/** Casho has no mailing list, so "join" hands off to WhatsApp. */
export function JoinBand({ content, storeName, whatsappHref }: { content?: NewsletterContent; storeName: string; whatsappHref: string | null }) {
  if (!whatsappHref) return null;
  return (
    <Section>
      <div className="an-join an-rise">
        <div className="min-w-0">
          <h2 className="an-h2">{content?.headline || st("أول واحد يعرف العروض")}</h2>
          <p className="an-sub mt-1">{content?.subheadline || st("ابعت لـ {0} على واتساب وهنبعتلك الباقات الجديدة والخصومات.", storeName)}</p>
        </div>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="an-btn an-btn--white shrink-0">
          <MessageCircle aria-hidden className="size-4" />
          {content?.ctaText || st("تابعنا على واتساب")}
        </a>
      </div>
    </Section>
  );
}

/** The Studio's custom banner: the merchant's image with their words over it. */
export function MediaBanner({ content, storeSlug }: { content?: HeroBannerSettings; storeSlug: string }) {
  if (!content?.backgroundImage && !content?.headline) return null;
  const href = content.buttonLink ? (/^https?:/.test(content.buttonLink) ? content.buttonLink : buildStoreUrl(storeSlug, content.buttonLink)) : null;
  return (
    <Section>
      <div className="an-media">
        {content.backgroundImage && <Image src={content.backgroundImage} alt="" fill sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />}
        <span aria-hidden className="an-media-shade" style={{ opacity: (content.overlayOpacity ?? 55) / 100 }} />
        <div className={cn("an-media-copy", content.textAlign === "center" && "items-center text-center")}>
          {content.headline && <h2 className="an-hero-title !text-[1.5rem] md:!text-[2rem]">{content.headline}</h2>}
          {content.subheadline && <p className="an-hero-text">{content.subheadline}</p>}
          {href && content.buttonText && (
            <a href={href} className="an-btn an-btn--white mt-4">
              {content.buttonText}
            </a>
          )}
        </div>
      </div>
    </Section>
  );
}

/** Collections: the merchant's own tiles, else the games themselves as big tiles. */
export function Collections({ content, categories, storeSlug }: { content?: CollectionsContent; categories: CategoryLink[]; storeSlug: string }) {
  const own = content?.items?.filter((c) => c.name?.trim()) ?? [];
  const tiles = own.length
    ? own.map((c) => ({ name: c.name, image: c.image ?? null, href: c.link ? (/^https?:/.test(c.link) ? c.link : buildStoreUrl(storeSlug, c.link.startsWith("/") ? c.link : `/categories/${c.link}`)) : buildStoreUrl(storeSlug, "/categories") }))
    : categories.filter((c) => c.productCount > 0 && c.image).slice(0, 4).map((c) => ({ name: c.name, image: c.image, href: buildStoreUrl(storeSlug, `/categories/${c.slug}`) }));
  if (tiles.length < 2) return null;
  return (
    <Section>
      <SectionHead title={content?.headline || st("تشكيلتنا")} />
      <ul className="an-collections">
        {tiles.map((t, i) => (
          <li key={i} className="contents">
            <Link href={t.href} className="an-collection an-rise" style={stagger(i)}>
              {t.image ? <Image src={t.image} alt="" fill sizes="(max-width: 768px) 50vw, 280px" className="object-cover" /> : <Gamepad2 aria-hidden className="m-auto size-10 text-(--an-soft)" />}
              <span className="an-collection-name">
                {t.name}
                <Arrow className="size-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
