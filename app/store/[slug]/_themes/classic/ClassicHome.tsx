import Link from "next/link";

import { Button } from "@/components/ui/button";
import StoreBanner from "../../_components/StoreBanner";
import StoreSectionHeader from "../../_components/shared/StoreSectionHeader";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { StoreThemeProps } from "../types";
import ThemeProductCard from "../shared/ThemeProductCard";
import ThemeCategoryCard from "../shared/ThemeCategoryCard";
import ThemeEmptyProducts from "../shared/ThemeEmptyProducts";

export default function ClassicHome({ store }: StoreThemeProps) {
  const featuredProducts = store.products
    .filter((product) => product.isFeatured)
    .slice(0, 4);

  const latestProducts = store.products.slice(0, 12);

  return (
    <main className="mx-auto w-full max-w-screen-2xl space-y-12 px-4 py-6 sm:px-6 lg:px-8">
      {store.banners?.length > 0 ? (
        <section className="overflow-hidden rounded-(--store-radius)">
          <StoreBanner
            banners={store.banners?.map((banner) => ({
              ...banner,
              title: banner.title ?? "",
            }))}
            storeSlug={store.slug}
          />
        </section>
      ) : (
        <section className="rounded-(--store-radius) border bg-(--store-card) p-8 shadow-sm md:p-12">
          <div className="max-w-3xl space-y-4">
            <p className="font-medium text-(--store-primary)">
              أهلاً بك في {store.name}
            </p>

            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              تسوق منتجات {store.name} بسهولة
            </h1>

            {store.settings?.description && (
              <p className="text-base leading-8 text-muted-foreground">
                {store.settings.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href={buildStoreUrl(store.slug, "/products")}>
                  عرض المنتجات
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link href={buildStoreUrl(store.slug, "/categories")}>
                  التصنيفات
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="space-y-6">
          <StoreSectionHeader
            title="المنتجات المميزة"
            btn="كل المنتجات"
            href={buildStoreUrl(store.slug, "/products")}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ThemeProductCard
                key={product.id}
                product={product}
                storeSlug={store.slug}
                variant="classic"
              />
            ))}
          </div>
        </section>
      )}

      {store.categories.length > 0 && (
        <section className="space-y-6">
          <StoreSectionHeader
            title="تسوق حسب التصنيف"
            btn="كل التصنيفات"
            href={buildStoreUrl(store.slug, "/categories")}
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {store.categories.slice(0, 6).map((category) => (
              <ThemeCategoryCard
                key={category.id}
                category={category}
                storeSlug={store.slug}
                variant="classic"
              />
            ))}
          </div>
        </section>
      )}

      {latestProducts.length === 0 ? (
        <ThemeEmptyProducts storeSlug={store.slug} />
      ) : (
        <section className="space-y-6">
          <StoreSectionHeader
            title="شاهد المزيد"
            btn="كل المنتجات"
            href={buildStoreUrl(store.slug, "/products")}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latestProducts.map((product) => (
              <ThemeProductCard
                key={product.id}
                product={product}
                storeSlug={store.slug}
                variant="classic"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
