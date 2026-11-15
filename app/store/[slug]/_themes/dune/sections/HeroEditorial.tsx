import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData, HomeViewProps, ProductCardData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { PlateImage, btn, delay } from "../ui";
import Hotspot from "./Hotspot";

/** Hero for stores without banners: the store's name set large beside its
 *  lead product photo, with a shoppable hotspot on that photo.
 *  The Studio's `split` hero uses the same spread with the lead banner's copy
 *  and photo; `compact` keeps it shorter. */
export default function HeroEditorial({
  store,
  dir,
  products,
  hasCategories,
  banner,
  compact,
}: {
  store: HomeViewProps["store"];
  dir: "rtl" | "ltr";
  products: ProductCardData[];
  hasCategories: boolean;
  banner?: BannerData;
  compact?: boolean;
}) {
  const lead = products.find((p) => p.image && !p.image.includes("placeholder"));
  const second = products.find((p) => p !== lead && p.image && !p.image.includes("placeholder"));
  const url = (p: string) => buildStoreUrl(store.slug, p);

  return (
    <section data-reveal className="bg-(--dn-plate)">
      <div
        className={cn(
          "dn-wrap grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16",
          compact ? "min-h-[min(56svh,36rem)] py-10 sm:py-12 lg:py-14" : "min-h-[min(88svh,56rem)] py-12 sm:py-16 lg:py-20",
        )}
      >
        <div className="flex flex-col items-start">
          <p className="dn-label dn-appear text-(--dn-quiet)" style={delay(0)}>
            {banner ? store.name : "أهلًا بيك في"}
          </p>
          <h1 className={cn("dn-appear mt-4 text-balance", compact ? "dn-h1" : "dn-hero")} style={delay(1)}>
            {banner?.title || store.name}
          </h1>
          <p className={cn("dn-appear max-w-[44ch] text-base leading-8 text-(--dn-quiet)", compact ? "mt-4 line-clamp-2" : "mt-6")} style={delay(2)}>
            {banner?.subtitle || store.description?.trim() || "منتجات مختارة بعناية، وطلب سهل في دقيقة."}
          </p>
          <div className={cn("dn-appear flex flex-wrap gap-3", compact ? "mt-7" : "mt-9")} style={delay(3)}>
            {banner?.link ? (
              <BannerLink banner={banner} storeSlug={store.slug} className={btn({ size: "lg" })}>
                {banner.cta}
              </BannerLink>
            ) : (
              <Link href={url("/products")} className={btn({ size: "lg" })}>
                تسوّق الآن
              </Link>
            )}
            {hasCategories && (
              <Link href={url("/categories")} className={btn({ variant: "outline", size: "lg" })}>
                التصنيفات
              </Link>
            )}
          </div>
        </div>

        {banner ? (
          <div className={cn("dn-crop relative", compact ? "aspect-[16/10]" : "aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]")} style={delay(1)}>
            <div className="dn-media absolute inset-0">
              <BannerImage banner={banner} priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
          </div>
        ) : (
          lead && (
            <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)] items-end gap-(--dn-gap)">
              <div className={cn("dn-crop relative", compact ? "aspect-[5/4]" : "aspect-[4/5]")} style={delay(1)}>
                <div className="dn-media absolute inset-0">
                  <PlateImage src={lead.image} priority sizes="(max-width: 1024px) 70vw, 40vw" />
                </div>
                <Hotspot
                  href={url(`/products/${lead.slug}`)}
                  name={lead.name}
                  price={lead.price}
                  compareAt={lead.compareAtPrice}
                  dir={dir}
                  className="absolute start-[58%] top-[62%]"
                />
              </div>
              {second && (
                <Link href={url(`/products/${second.slug}`)} aria-label={second.name} className="dn-crop group relative mb-[18%] block aspect-[3/4]" style={delay(2)}>
                  <span className="dn-media absolute inset-0">
                    <PlateImage src={second.image} sizes="(max-width: 1024px) 30vw, 16rem" className="dn-zoom-img" />
                  </span>
                </Link>
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
}

/** The Studio's `minimal` hero: the name set large and centered, no photo. */
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
    <section data-reveal className="dn-wrap">
      <div className="mx-auto flex max-w-4xl flex-col items-center border-b border-(--dn-line) pb-14 pt-14 text-center sm:pb-20 sm:pt-20">
        <p className="dn-label dn-appear text-(--dn-quiet)" style={delay(0)}>
          {banner ? store.name : "أهلًا بيك في"}
        </p>
        <h1 className="dn-hero dn-appear mt-5 text-balance" style={delay(1)}>
          {banner?.title || store.name}
        </h1>
        <p className="dn-appear mt-6 max-w-[48ch] text-base leading-8 text-(--dn-quiet)" style={delay(2)}>
          {banner?.subtitle || store.description?.trim() || "منتجات مختارة بعناية، وطلب سهل في دقيقة."}
        </p>
        <div className="dn-appear mt-9 flex flex-wrap justify-center gap-3" style={delay(3)}>
          {banner?.link ? (
            <BannerLink banner={banner} storeSlug={store.slug} className={btn({ size: "lg" })}>
              {banner.cta}
            </BannerLink>
          ) : (
            <Link href={url("/products")} className={btn({ size: "lg" })}>
              تسوّق الآن
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
