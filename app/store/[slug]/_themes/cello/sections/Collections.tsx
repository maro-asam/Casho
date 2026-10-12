import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { AboutBrandContent, CollectionsContent } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import Rail from "../product/Rail";
import { PlateImage, SectionHeader, Wrap, btn, delay } from "../ui";

/** Cello's "Top most sold" collection grid: white tiles (photo + name) two
 *  rows high, five columns on desktop and two on phones, paged with the
 *  header arrows. */
export function CategoryGrid({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  const tiles = categories.filter((c) => c.productCount > 0).slice(0, 20);
  if (tiles.length === 0) return null;
  const columns: CategoryLink[][] = [];
  for (let i = 0; i < tiles.length; i += 2) columns.push(tiles.slice(i, i + 2));
  const tile = (c: CategoryLink) => (
    <Link
      key={c.id}
      href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)}
      className="group flex h-28 items-center gap-3 bg-(--ce-card) px-3 sm:h-34 sm:gap-5 sm:px-4 lg:px-5"
    >
      <span className="relative block size-14 shrink-0 overflow-hidden sm:size-24">
        <PlateImage src={c.image} sizes="96px" className="ce-zoom-img" />
      </span>
      <span className="line-clamp-2 min-w-0 text-[0.9375rem] font-medium text-(--ce-ink) group-hover:text-(--ce-btn) sm:text-lg">{c.name}</span>
    </Link>
  );
  return (
    <section className="ce-wrap ce-section">
      <Rail
        label="التصنيفات"
        title="تسوّق حسب التصنيف"
        sub={`${tiles.length} تصنيف في المتجر`}
        href={buildStoreUrl(storeSlug, "/categories")}
        linkLabel="كل التصنيفات"
        listClassName="!gap-0 overflow-hidden rounded-(--ce-r) [&>li]:!w-1/2 sm:[&>li]:!w-1/3 lg:[&>li]:!w-1/5"
      >
        {columns.map((col, i) => (
          <li key={i} className="flex flex-col divide-y divide-(--ce-line) border-e border-(--ce-line) last:border-e-0">
            {col.map(tile)}
            {col.length === 1 && <span aria-hidden className="h-28 bg-(--ce-card) sm:h-34" />}
          </li>
        ))}
      </Rail>
    </section>
  );
}

function promoHref(storeSlug: string, link?: string) {
  const v = link?.trim();
  if (!v) return buildStoreUrl(storeSlug, "/products");
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return buildStoreUrl(storeSlug, `/categories/${v}`);
}

/** Merchant collections as Cello's promo banners: a wide tile beside narrower
 *  ones, copy on the photo with an underlined link. */
export function PromoTiles({ content, storeSlug }: { content?: CollectionsContent; storeSlug: string }) {
  const items = content?.items?.filter((c) => c.name?.trim()).slice(0, 3) ?? [];
  if (items.length === 0) return null;
  const cols = items.length === 3 ? "lg:grid-cols-[1.4fr_1fr_1.2fr]" : items.length === 2 ? "lg:grid-cols-2" : "";
  return (
    <Wrap className="ce-section">
      {content?.headline && <SectionHeader title={content.headline} />}
      <ul className={cn("grid gap-(--ce-gap) sm:grid-cols-2", cols)}>
        {items.map((c, i) => (
          <li key={i} className={cn("ce-reveal", items.length === 3 && i === 0 && "sm:col-span-2 lg:col-span-1")} style={delay(i)}>
            <Link href={promoHref(storeSlug, c.link)} className="group relative flex h-full min-h-64 overflow-hidden rounded-(--ce-r-lg) bg-(--ce-navy) text-white sm:min-h-[24rem]">
              {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 1024px) 100vw, 40vw" className="ce-zoom-img object-cover" />}
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_left,rgb(0_16_48/0.62),rgb(0_16_48/0)_75%)] ltr:bg-[linear-gradient(to_right,rgb(0_16_48/0.62),rgb(0_16_48/0)_75%)]" />
              <span className="relative flex flex-col items-start justify-center p-6 sm:p-10">
                <span className="text-balance text-2xl font-semibold text-white sm:text-[2rem] sm:leading-tight">{c.name}</span>
                <span className="mt-4 border-b border-white pb-0.5 text-[0.9375rem] group-hover:border-transparent">تسوّق الآن</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

/** Brand story on a navy card beside the store's category photos. */
export function StoryWithCategories({ content, storeName, storeSlug, categories }: { content?: AboutBrandContent; storeName: string; storeSlug: string; categories: CategoryLink[] }) {
  if (!content?.text?.trim() && !content?.headline?.trim()) return null;
  const tiles = categories.filter((c) => c.image).slice(0, 8);
  const href = content.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <Wrap className={cn("ce-section grid gap-(--ce-gap)", tiles.length > 0 && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]")}>
      <div className="ce-reveal relative flex min-h-80 flex-col justify-end overflow-hidden rounded-(--ce-r-lg) bg-(--ce-navy) p-6 text-white sm:p-8">
        {content.image && (
          <>
            <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_16_48/0.9),rgb(0_16_48/0.2))]" />
          </>
        )}
        <div className="relative">
          <p className="text-sm opacity-85">{storeName}</p>
          <h2 className="ce-h2 mt-1 text-balance !text-white">{content.headline || `عن ${storeName}`}</h2>
          {content.text && <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-7 opacity-90">{content.text}</p>}
          <Link href={href} className={btn({ variant: "white", className: "mt-6" })}>
            {content.ctaText || "اعرف حكايتنا"}
          </Link>
        </div>
      </div>
      {tiles.length > 0 && (
        <ul className="grid grid-cols-2 gap-(--ce-gap) sm:grid-cols-4">
          {tiles.map((c, i) => (
            <li key={c.id} className="ce-reveal" style={delay(i)}>
              <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group flex h-full flex-col rounded-(--ce-r) bg-(--ce-card) p-3 transition-shadow hover:shadow-(--ce-shadow-sm)">
                <span className="relative block aspect-[4/3]">
                  <PlateImage src={c.image} sizes="(max-width: 640px) 45vw, 16vw" className="ce-zoom-img" />
                </span>
                <span className="mt-2 truncate px-1 text-[0.9375rem] font-medium text-(--ce-ink) group-hover:text-(--ce-btn)">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}
