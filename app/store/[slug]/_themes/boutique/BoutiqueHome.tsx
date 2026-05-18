import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { StoreThemeProps } from "../types";
import ThemeProductCard from "../shared/ThemeProductCard";
import ThemeCategoryCard from "../shared/ThemeCategoryCard";
import ThemeEmptyProducts from "../shared/ThemeEmptyProducts";
import BoutiqueHeroSlider from "./BoutiqueHeroSlider";
import Reveal from "../shared/Reveal";

export default function BoutiqueHome({ store }: StoreThemeProps) {
  const featuredProducts = store.products
    .filter((product) => product.isFeatured)
    .slice(0, 4);

  const latestProducts = store.products.slice(0, 8);

  return (
    <main className="">
      <BoutiqueHeroSlider store={store} />

      <section className="mx-auto w-full max-w-screen-2xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
        {store.categories.length > 0 && (
          <Reveal className="space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-(--store-primary)">
                  Collections
                </p>

                <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">
                  تسوق حسب التصنيف
                </h2>
              </div>

              <Button asChild variant="outline">
                <Link href={buildStoreUrl(store.slug, "/categories")}>
                  عرض الكل
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {store.categories.slice(0, 4).map((category) => (
                <ThemeCategoryCard
                  key={category.id}
                  category={category}
                  storeSlug={store.slug}
                  variant="boutique"
                />
              ))}
            </div>
          </Reveal>
        )}

        {featuredProducts.length > 0 && (
          <Reveal className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
            <div className="border rounded-md p-8 shadow-sm lg:sticky lg:top-24">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-(--store-primary)">
                Featured
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
                اختيارات مميزة من {store.name}
              </h2>

              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                مجموعة منتجات متصدرة ومناسبة للعملاء اللي بيحبوا الاختيار السريع
                والواضح.
              </p>

              <Button asChild className="mt-6 font-black">
                <Link href={buildStoreUrl(store.slug, "/products")}>
                  كل المنتجات
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {featuredProducts.map((product) => (
                <ThemeProductCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                  variant="boutique"
                />
              ))}
            </div>
          </Reveal>
        )}

        {latestProducts.length === 0 ? (
          <ThemeEmptyProducts storeSlug={store.slug} />
        ) : (
          <Reveal className="space-y-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-(--store-primary)">
                  New arrivals
                </p>

                <h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">
                  وصل حديثًا
                </h2>
              </div>

              <Button asChild variant="outline">
                <Link href={buildStoreUrl(store.slug, "/products")}>
                  عرض الكل
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latestProducts.map((product) => (
                <ThemeProductCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                  variant="boutique"
                />
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </main>
  );
}
