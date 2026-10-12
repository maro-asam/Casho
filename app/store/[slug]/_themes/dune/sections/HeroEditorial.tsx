import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { HomeViewProps, ProductCardData } from "../../types";
import { PlateImage, btn, delay } from "../ui";
import Hotspot from "./Hotspot";

/** Hero for stores without banners: the store's name set large beside its
 *  lead product photo, with a shoppable hotspot on that photo. */
export default function HeroEditorial({
  store,
  dir,
  products,
  hasCategories,
}: {
  store: HomeViewProps["store"];
  dir: "rtl" | "ltr";
  products: ProductCardData[];
  hasCategories: boolean;
}) {
  const lead = products.find((p) => p.image && !p.image.includes("placeholder"));
  const second = products.find((p) => p !== lead && p.image && !p.image.includes("placeholder"));
  const url = (p: string) => buildStoreUrl(store.slug, p);

  return (
    <section data-reveal className="bg-(--dn-plate)">
      <div className="dn-wrap grid min-h-[min(88svh,56rem)] grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-20">
        <div className="flex flex-col items-start">
          <p className="dn-label dn-appear text-(--dn-quiet)" style={delay(0)}>
            أهلًا بيك في
          </p>
          <h1 className="dn-hero dn-appear mt-4 text-balance" style={delay(1)}>
            {store.name}
          </h1>
          <p className="dn-appear mt-6 max-w-[44ch] text-base leading-8 text-(--dn-quiet)" style={delay(2)}>
            {store.description?.trim() || "منتجات مختارة بعناية، وطلب سهل في دقيقة."}
          </p>
          <div className="dn-appear mt-9 flex flex-wrap gap-3" style={delay(3)}>
            <Link href={url("/products")} className={btn({ size: "lg" })}>
              تسوّق الآن
            </Link>
            {hasCategories && (
              <Link href={url("/categories")} className={btn({ variant: "outline", size: "lg" })}>
                التصنيفات
              </Link>
            )}
          </div>
        </div>

        {lead && (
          <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)] items-end gap-(--dn-gap)">
            <div className="dn-crop relative aspect-[4/5]" style={delay(1)}>
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
        )}
      </div>
    </section>
  );
}
