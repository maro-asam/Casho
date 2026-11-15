import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData, HomeViewProps, ProductCardData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Arrow, PlateImage, btn, num } from "../ui";

/** Hero for stores without banners: a pine panel with the pitch beside a
 *  collage of real product photos (each links to its product).
 *  The Studio's `split` hero uses the same panel with the lead banner's copy
 *  and photo; `compact` keeps it shorter. */
export default function HeroEditorial({
  store,
  products,
  hasCategories,
  banner,
  compact,
}: {
  store: HomeViewProps["store"];
  products: ProductCardData[];
  hasCategories: boolean;
  banner?: BannerData;
  compact?: boolean;
}) {
  const shots = products.filter((p) => p.image && !p.image.includes("placeholder")).slice(0, 3);
  const url = (p: string) => buildStoreUrl(store.slug, p);
  const media = banner ? (
    <div className={cn("relative p-3 lg:p-4", compact ? "min-h-[16rem] sm:min-h-[20rem]" : "min-h-[22rem] sm:min-h-[28rem]")}>
      <div className="md-media absolute inset-3 lg:inset-4">
        <BannerImage banner={banner} priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      </div>
    </div>
  ) : shots.length > 0 ? (
    <div className={cn("relative grid grid-cols-2 gap-3 p-3 lg:p-4", compact ? "min-h-[16rem] sm:min-h-[20rem]" : "min-h-[22rem] sm:min-h-[28rem]")}>
      {shots.map((p, i) => (
        <Link
          key={p.id}
          href={url(`/products/${p.slug}`)}
          className={`md-media group ${shots.length === 1 ? "col-span-2" : i === 0 ? "row-span-2" : ""}`}
          aria-label={p.name}
        >
          <PlateImage src={p.image} priority sizes="(max-width: 1024px) 50vw, 25vw" className="transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute bottom-3 start-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#121714] backdrop-blur">
            {p.name.length > 24 ? `${p.name.slice(0, 24)}…` : p.name}
          </span>
        </Link>
      ))}
      {products.length > 3 && (
        <span className="absolute end-6 top-6 rounded-full bg-(--md-signal) px-3 py-1 text-xs font-bold text-(--md-signal-ink)">
          +{num(products.length - shots.length)} منتج
        </span>
      )}
    </div>
  ) : null;

  return (
    <section className="md-wrap pt-3 sm:pt-4">
      <div className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] bg-(--md-brand) text-(--md-brand-ink) lg:grid-cols-2">
        <div className={cn("flex flex-col justify-center", compact ? "p-6 sm:p-10 lg:p-12" : "p-7 sm:p-12 lg:p-16")}>
          <span className="md-eyebrow self-start">{banner ? `جديد في ${store.name}` : `أهلًا بيك في ${store.name}`}</span>
          <h1 className={cn("mt-5 text-balance", compact ? "md-h1" : "md-hero-title")}>{banner?.title || store.name}</h1>
          <p className={cn("max-w-[46ch] text-base leading-8 opacity-80", compact ? "mt-3 line-clamp-2" : "mt-5")}>
            {banner?.subtitle || store.description?.trim() || "منتجات مختارة بعناية، وطلب سهل في دقيقة."}
          </p>
          <div className={cn("flex flex-wrap gap-2.5", compact ? "mt-6" : "mt-8")}>
            {banner?.link ? (
              <BannerLink banner={banner} storeSlug={store.slug} className={btn({ variant: "signal", size: "lg" })}>
                {banner.cta}
                <Arrow />
              </BannerLink>
            ) : (
              <Link href={url("/products")} className={btn({ variant: "signal", size: "lg" })}>
                تسوّق الآن
                <Arrow />
              </Link>
            )}
            {hasCategories && (
              <Link href={url("/categories")} className={btn({ size: "lg", className: "border-white/25 bg-transparent text-inherit hover:bg-white/10" })}>
                التصنيفات
              </Link>
            )}
          </div>
        </div>
        {media}
      </div>
    </section>
  );
}

/** The Studio's `minimal` hero: type on the canvas, no photo. */
export function HeroMinimal({
  store,
  banner,
  hasCategories,
}: {
  store: HomeViewProps["store"];
  banner?: BannerData;
  hasCategories: boolean;
}) {
  const url = (p: string) => buildStoreUrl(store.slug, p);
  return (
    <section className="md-wrap pb-4 pt-12 sm:pt-16 lg:pt-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <span className="md-eyebrow">{banner ? `جديد في ${store.name}` : `أهلًا بيك في ${store.name}`}</span>
        <h1 className="md-hero-title mt-6 text-balance">{banner?.title || store.name}</h1>
        <p className="mt-5 max-w-[52ch] text-base leading-8 text-(--md-quiet) sm:text-lg">
          {banner?.subtitle || store.description?.trim() || "منتجات مختارة بعناية، وطلب سهل في دقيقة."}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-2.5">
          {banner?.link ? (
            <BannerLink banner={banner} storeSlug={store.slug} className={btn({ size: "lg" })}>
              {banner.cta}
              <Arrow />
            </BannerLink>
          ) : (
            <Link href={url("/products")} className={btn({ size: "lg" })}>
              تسوّق الآن
              <Arrow />
            </Link>
          )}
          {hasCategories && (
            <Link href={url("/categories")} className={btn({ variant: "outline", size: "lg" })}>
              التصنيفات
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
