import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { AboutBrandContent, CollectionsContent } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import Rail from "../product/Rail";
import { Chevron, PlateImage, SectionHeader, Wrap, btn, delay, num } from "../ui";

/** Category strip under the header: compact cards (name, product count and
 *  the category photo). A rail on phones; up to six across on desktop. */
export function CollectionStrip({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  const tiles = categories.filter((c) => c.productCount > 0).slice(0, 12);
  if (tiles.length === 0) return null;
  return (
    <Wrap className="pt-4 sm:pt-6">
      <h2 className="sr-only">تسوّق حسب التصنيف</h2>
      <Rail label="التصنيفات" controls="below" listClassName="[&>li]:!w-[46%] sm:[&>li]:!w-[30%] lg:[&>li]:!w-[calc((100%-var(--mx-gap)*5)/6)]">
        {tiles.map((c) => (
          <li key={c.id}>
            <Link
              href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)}
              className="group flex h-full flex-col-reverse items-center gap-3 rounded-(--mx-r) border border-(--mx-line) bg-(--mx-bg) p-3 text-center transition-[box-shadow,border-color] hover:border-transparent hover:shadow-(--mx-shadow-sm) sm:flex-row sm:justify-between sm:text-start"
            >
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-semibold text-(--mx-ink) group-hover:text-(--mx-link)">{c.name}</span>
                <span className="block text-xs text-(--mx-text)">{num(c.productCount)} منتج</span>
              </span>
              <span className="mx-media aspect-square w-full shrink-0 rounded-(--mx-r-sm) sm:size-16">
                <PlateImage src={c.image} sizes="(max-width: 640px) 45vw, 64px" fit="cover" className="mx-zoom-img" />
              </span>
            </Link>
          </li>
        ))}
      </Rail>
    </Wrap>
  );
}

/** "Top categories for you": round photos with names, a rail on phones. */
export function CategoryCircles({ categories, storeSlug, title = "تصنيفات مختارة ليك" }: { categories: CategoryLink[]; storeSlug: string; title?: string }) {
  const tiles = categories.slice(0, 12);
  if (tiles.length === 0) return null;
  return (
    <Wrap className="mx-section">
      <SectionHeader title={title} center href={buildStoreUrl(storeSlug, "/categories")} linkLabel="كل التصنيفات" />
      <ul className="mx-rail mx-bleed gap-4 sm:justify-center-safe sm:gap-6">
        {tiles.map((c, i) => (
          <li key={c.id} className="mx-reveal w-24 shrink-0 sm:w-32" style={delay(Math.min(i, 5))}>
            <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group block text-center">
              <span className="mx-media block aspect-square rounded-full">
                <PlateImage src={c.image} sizes="128px" fit="cover" className="mx-zoom-img" />
              </span>
              <span className="mt-2.5 line-clamp-2 block text-sm font-semibold text-(--mx-ink) group-hover:text-(--mx-link)">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}

// Grid spans per tile count: two wide tiles over three narrow ones at most.
const LG_SPANS: Record<number, number[]> = { 1: [6], 2: [3, 3], 3: [2, 2, 2], 4: [3, 3, 3, 3], 5: [3, 3, 2, 2, 2] };
const SM_SPANS: Record<number, number[]> = { 1: [2], 2: [2, 2], 3: [2, 1, 1], 4: [1, 1, 1, 1], 5: [2, 2, 2, 1, 1] };
const SPAN_CLASS: Record<number, string> = { 1: "col-span-1", 2: "col-span-2" };
const LG_CLASS: Record<number, string> = { 2: "lg:col-span-2", 3: "lg:col-span-3", 6: "lg:col-span-6" };

function promoHref(storeSlug: string, link?: string) {
  const v = link?.trim();
  if (!v) return buildStoreUrl(storeSlug, "/products");
  if (/^https?:\/\//.test(v) || v.startsWith("/")) return v;
  return buildStoreUrl(storeSlug, `/categories/${v}`);
}

/** Merchant collections as Maximize's promotion grid: two wide tiles over
 *  three narrower ones, copy on each photo. */
export function PromoTiles({ content, storeSlug }: { content?: CollectionsContent; storeSlug: string }) {
  const items = content?.items?.filter((c) => c.name?.trim()).slice(0, 5) ?? [];
  if (items.length === 0) return null;
  const lg = LG_SPANS[items.length];
  const sm = SM_SPANS[items.length];
  return (
    <Wrap className="mx-section">
      {content?.headline && <SectionHeader title={content.headline} center />}
      <ul className="grid grid-cols-2 gap-(--mx-gap) lg:grid-cols-6">
        {items.map((c, i) => {
          const isWide = lg[i] >= 3;
          return (
            <li key={i} className={cn("mx-reveal", SPAN_CLASS[sm[i]], LG_CLASS[lg[i]])} style={delay(i)}>
              <Link href={promoHref(storeSlug, c.link)} className="group relative block h-full min-h-56 overflow-hidden rounded-(--mx-r-lg) bg-(--mx-dark) text-white sm:min-h-72">
                {c.image && <Image src={c.image} alt="" fill sizes={isWide ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 33vw"} className="mx-zoom-img object-cover" />}
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_15_15/0.66),rgb(16_15_15/0)_60%)]" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col items-start p-5 sm:p-7">
                  <span className="mx-display text-balance text-xl text-white sm:text-2xl">{c.name}</span>
                  <span className="mt-2 inline-flex items-center gap-1 border-b border-white/80 pb-0.5 text-sm font-semibold">
                    تسوّق الآن
                    <Chevron />
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

/** "Exclusive in …" block: the brand story on a tinted card beside a grid of
 *  the store's categories (Maximize's collections list with text). */
export function StoryWithCategories({ content, storeName, storeSlug, categories }: { content?: AboutBrandContent; storeName: string; storeSlug: string; categories: CategoryLink[] }) {
  if (!content?.text?.trim() && !content?.headline?.trim()) return null;
  const tiles = categories.filter((c) => c.image).slice(0, 8);
  const href = content.ctaLink?.trim() || buildStoreUrl(storeSlug, "/about");
  return (
    <section className="mx-band mx-section mt-[calc(var(--mx-section)/2)]">
      <Wrap className={cn("grid gap-(--mx-gap)", tiles.length > 0 && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]")}>
        <div className="mx-reveal relative flex min-h-80 flex-col justify-end overflow-hidden rounded-(--mx-r-lg) bg-(--mx-btn) p-6 text-(--mx-btn-ink) sm:p-8">
          {content.image && (
            <>
              <Image src={content.image} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--mx-btn)_92%,#000),color-mix(in_srgb,var(--mx-btn)_35%,transparent))]" />
            </>
          )}
          <div className="relative">
            <p className="text-sm font-semibold opacity-85">حصريًا في {storeName}</p>
            <h2 className="mx-display mt-1 text-balance text-2xl text-(--mx-btn-ink) sm:text-[1.75rem]">{content.headline || `عن ${storeName}`}</h2>
            {content.text && <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-7 opacity-90">{content.text}</p>}
            <Link href={href} className={btn({ variant: "white", className: "mt-6" })}>
              {content.ctaText || "اعرف حكايتنا"}
            </Link>
          </div>
        </div>
        {tiles.length > 0 && (
          <ul className="grid grid-cols-2 gap-(--mx-gap) sm:grid-cols-4">
            {tiles.map((c, i) => (
              <li key={c.id} className="mx-reveal" style={delay(i)}>
                <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group flex h-full flex-col overflow-hidden rounded-(--mx-r) bg-(--mx-bg) p-2.5 transition-shadow hover:shadow-(--mx-shadow-sm)">
                  <span className="mx-media block aspect-[4/3] rounded-(--mx-r-sm)">
                    <PlateImage src={c.image} sizes="(max-width: 640px) 45vw, 16vw" fit="cover" className="mx-zoom-img" />
                  </span>
                  <span className="mt-2 truncate px-1 text-sm font-semibold text-(--mx-ink) group-hover:text-(--mx-link)">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Wrap>
    </section>
  );
}
