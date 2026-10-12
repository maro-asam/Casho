import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CollectionsContent } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { Arrow, PlateImage, SectionHeader, Wrap, delay, num } from "../ui";

/** "Shop by category": square images with the name centered underneath. */
export function CollectionList({ categories, storeSlug, title = "تسوّق حسب التصنيف" }: { categories: CategoryLink[]; storeSlug: string; title?: string }) {
  const tiles = categories.slice(0, 8);
  const cols = tiles.length % 3 === 0 && tiles.length <= 6 ? "md:grid-cols-3" : "md:grid-cols-4";
  return (
    <Wrap data-reveal className="dn-section">
      <SectionHeader title={title} href={buildStoreUrl(storeSlug, "/categories")} linkLabel="كل التصنيفات" />
      <ul className={cn("grid grid-cols-2 gap-x-(--dn-gap) gap-y-8", cols)}>
        {tiles.map((c, i) => (
          <li key={c.id}>
            <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group block text-center">
              <span className="dn-crop block" style={delay(Math.min(i, 5))}>
                <span className="dn-media block aspect-square">
                  <PlateImage src={c.image} sizes="(max-width: 768px) 50vw, 25vw" className="dn-zoom-img" />
                </span>
              </span>
              <span className="dn-h4 mt-4 block">
                <span className="dn-link">{c.name}</span>
              </span>
              <span className="mt-0.5 block text-xs text-(--dn-quiet)">{num(c.productCount)} منتج</span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

function promoHref(storeSlug: string, link?: string) {
  const v = link?.trim();
  if (!v) return buildStoreUrl(storeSlug, "/products");
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return buildStoreUrl(storeSlug, `/categories/${v}`);
}

/** Promo grid of merchant collections: image tiles with copy over the photo.
 *  Layout follows the count — a full-width lead when odd, then halves. */
export function PromoGrid({ content, storeSlug }: { content?: CollectionsContent; storeSlug: string }) {
  const items = content?.items?.filter((c) => c.name?.trim()).slice(0, 6) ?? [];
  if (items.length === 0) return null;
  const leadFull = items.length % 2 === 1;
  return (
    <Wrap data-reveal className="dn-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className="grid grid-cols-1 gap-(--dn-gap) md:grid-cols-2">
        {items.map((c, i) => {
          const full = leadFull && i === 0;
          return (
            <li key={i} className={cn(full && "md:col-span-2")}>
              <Link href={promoHref(storeSlug, c.link)} className="group relative block overflow-hidden text-white">
                <span className={cn("dn-crop block", full ? "aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]" : "aspect-[4/5] sm:aspect-[5/4]")} style={delay(i)}>
                  <span className="absolute inset-0 bg-(--dn-accent)">
                    {c.image && <Image src={c.image} alt="" fill sizes={full ? "100vw" : "(max-width: 768px) 100vw, 50vw"} className="dn-zoom-img object-cover" />}
                  </span>
                </span>
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(20_20_18/0.6),rgb(20_20_18/0.05)_60%)]" />
                <span className={cn("absolute inset-x-0 bottom-0 flex flex-col p-6 sm:p-9", full ? "items-center text-center lg:pb-14" : "items-start")}>
                  <span className={cn("dn-serif text-balance leading-[1.1]", full ? "text-[clamp(2.25rem,5vw,4.5rem)]" : "text-[clamp(1.875rem,3vw,3rem)]")}>{c.name}</span>
                  <span className="dn-label mt-4 inline-flex items-center gap-2 border-b border-white/70 pb-1 transition-[gap] duration-500 group-hover:gap-3">
                    تسوّق الآن
                    <Arrow />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Wrap>
  );
}
