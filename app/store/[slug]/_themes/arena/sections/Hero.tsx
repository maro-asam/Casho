import Link from "next/link";
import { ReceiptText, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData, CategoryLink } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import type { HeroStyle } from "@/types/store-theme.types";
import { splitHeadline } from "../lib/arena";
import BannerSlider from "./BannerSlider";
import { gamesCount } from "../ui";
import { st } from "@/lib/i18n/storefront";

/**
 * The reference app's hero: one glowing violet card with a chip, a two-line
 * headline (the second line glows), a sentence, a white button and a glass
 * one, and two small facts. The merchant's first banner supplies the words
 * (title, subtitle, button) and its art sits at the card's end; without a
 * banner the store's own name and description fill it. The Studio's hero
 * style: split (default) art beside the words · fullscreen the banners shown
 * whole in a slider (designed banners with their own words and logo) ·
 * compact shorter · minimal words only, centered.
 */
export default function Hero({
  style,
  store,
  banners,
  categories,
}: {
  style: HeroStyle;
  store: { name: string; slug: string; description: string | null };
  banners: BannerData[];
  categories: CategoryLink[];
}) {
  if (style === "fullscreen" && banners.length > 0) {
    return (
      <section className="an-wrap an-section-first">
        <BannerSlider banners={banners} storeSlug={store.slug} />
      </section>
    );
  }

  const banner = banners[0] ?? null;
  const [line1, line2] = splitHeadline(banner?.title?.trim() || store.name);
  const sentence = banner ? banner.subtitle : store.description;
  const live = categories.filter((c) => c.productCount > 0).length;
  // A banner with a link (not "image only") sends the main button where the merchant chose.
  const linked = !!banner?.link;
  const art = style !== "minimal" && banner;

  return (
    <section className="an-wrap an-section-first">
      <div className={cn("an-hero an-rise", art && "an-hero--art")} data-style={style}>
        {art && (
          <span aria-hidden className="an-hero-art">
            <BannerImage banner={banner} sizes="(max-width: 768px) 100vw, 560px" priority className="object-cover" />
          </span>
        )}
        <div className="an-hero-copy">
          <span className="an-chip">
            <Zap aria-hidden className="size-3.5 text-(--an-gold)" />
            {live > 0 ? st("{0} متاحة للشحن", gamesCount(live)) : store.name}
          </span>
          <h1 className="an-hero-title">
            <span className="block">{line1}</span>
            {line2 && <span className="an-glowtext block">{line2}</span>}
          </h1>
          {sentence?.trim() && <p className="an-hero-text">{sentence}</p>}
          <div className="an-hero-cta">
            {banner && linked ? (
              <BannerLink banner={banner} storeSlug={store.slug} className="an-btn an-btn--white an-btn--lg">
                <Sparkles aria-hidden className="size-4" />
                {banner.cta}
              </BannerLink>
            ) : (
              <Link href={buildStoreUrl(store.slug, "/categories")} className="an-btn an-btn--white an-btn--lg">
                <Sparkles aria-hidden className="size-4" />
                {banner?.cta || st("تسوّق الباقات")}
              </Link>
            )}
            <Link href={buildStoreUrl(store.slug, "/track")} className="an-btn an-btn--glass an-btn--lg">
              {st("تابع طلبك")}
            </Link>
          </div>
          <ul className="an-hero-facts">
            <li>
              <ShieldCheck aria-hidden className="size-3.5 text-(--an-ok)" />
              {st("بياناتك بتروح للمتجر بس")}
            </li>
            <li>
              <ReceiptText aria-hidden className="size-3.5 text-(--an-gold)" />
              {st("تابع طلبك برقمه في أي وقت")}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
