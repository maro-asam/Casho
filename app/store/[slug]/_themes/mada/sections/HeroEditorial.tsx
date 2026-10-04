import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { HomeViewProps, ProductCardData } from "../../types";
import { Arrow, PlateImage, btn, num } from "../ui";

/** Hero for stores without banners: a pine panel with the pitch beside a
 *  collage of real product photos (each links to its product). */
export default function HeroEditorial({ store, products, hasCategories }: { store: HomeViewProps["store"]; products: ProductCardData[]; hasCategories: boolean }) {
  const shots = products.filter((p) => p.image && !p.image.includes("placeholder")).slice(0, 3);
  const url = (p: string) => buildStoreUrl(store.slug, p);
  return (
    <section className="md-wrap pt-3 sm:pt-4">
      <div className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] bg-(--md-brand) text-(--md-brand-ink) lg:grid-cols-2">
        <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
          <span className="md-eyebrow self-start">أهلًا بيك في {store.name}</span>
          <h1 className="md-hero-title mt-5 text-balance">{store.name}</h1>
          <p className="mt-5 max-w-[46ch] text-base leading-8 opacity-80">
            {store.description?.trim() || "منتجات مختارة بعناية، وطلب سهل في دقيقة."}
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link href={url("/products")} className={btn({ variant: "signal", size: "lg" })}>
              تسوّق الآن
              <Arrow />
            </Link>
            {hasCategories && (
              <Link href={url("/categories")} className={btn({ size: "lg", className: "border-white/25 bg-transparent text-inherit hover:bg-white/10" })}>
                التصنيفات
              </Link>
            )}
          </div>
        </div>
        {shots.length > 0 && (
          <div className="relative grid min-h-[22rem] grid-cols-2 gap-3 p-3 sm:min-h-[28rem] lg:p-4">
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
        )}
      </div>
    </section>
  );
}
