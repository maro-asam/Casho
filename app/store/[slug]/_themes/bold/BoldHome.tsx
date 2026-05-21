import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  Flame,
  Grid3X3,
  Package,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { StoreThemeProps } from "../types";
import ThemeProductCard from "../shared/ThemeProductCard";
import ThemeCategoryCard from "../shared/ThemeCategoryCard";
import ThemeEmptyProducts from "../shared/ThemeEmptyProducts";
import Reveal from "../shared/Reveal";
import BoldHeroSlider from "./BoldHeroSlider";

export default function BoldHome({ store }: StoreThemeProps) {
  const featuredProducts = store.products
    .filter((product) => product.isFeatured)
    .slice(0, 4);

  const latestProducts = store.products.slice(0, 12);
  const heroProduct = featuredProducts[0] || latestProducts[0];

  return (
    <main className="overflow-hidden">
      <section className="relative w-full min-h-full">
        <div className="grid w-full lg:h-[calc(100svh-88px)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative flex min-h-[calc(100svh-88px)] items-center px-4 py-14 sm:px-6 lg:min-h-0 lg:px-8 xl:px-20">
            <div className="absolute inset-y-0 right-0 w-px bg-border max-lg:hidden" />

            <div className="relative z-10 w-full space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 border border-(--store-primary) bg-(--store-primary) px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-(--store-primary-foreground)">
                  <Flame className="size-4" />
                  Bold Store
                </span>

                <span className="inline-flex items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-[0.22em]">
                  Fast Checkout
                  <Zap className="size-4 text-(--store-primary)" />
                </span>
              </div>

              <div className="space-y-5">
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-(--store-primary)">
                  {store.slug}
                </p>

                <h1 className="max-w-5xl text-[4.7rem] font-bold uppercase leading-[0.78] tracking-[-0.08em] sm:text-[7rem] lg:text-[8.5rem] xl:text-[10rem]">
                  {store.name}
                </h1>

                <p className="max-w-2xl border-r-4 border-(--store-primary) pr-5 text-base font-medium leading-8 text-muted-foreground md:text-xl">
                  {store.settings?.description ||
                    "متجر مباشر، صريح، وقوي. المنتجات قدام العميل من غير زحمة، والقرار سريع من أول نظرة."}
                </p>
              </div>

              <div className="grid max-w-3xl border sm:grid-cols-3">
                <div className="border-b p-5 sm:border-b-0 sm:border-l">
                  <p className="text-4xl font-bold">
                    {featuredProducts.length}
                  </p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Featured
                  </p>
                </div>

                <div className="border-b p-5 sm:border-b-0 sm:border-l">
                  <p className="text-4xl font-bold">
                    {store.categories.length}
                  </p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Categories
                  </p>
                </div>

                <div className="p-5">
                  <p className="text-4xl font-bold">{store.products.length}</p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Products
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-13 rounded-none px-8 text-base font-bold"
                >
                  <Link href={buildStoreUrl(store.slug, "/products")}>
                    تسوق الآن
                    <Package className="me-2 size-5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 rounded-none px-8 text-base font-bold"
                >
                  <Link href={buildStoreUrl(store.slug, "/categories")}>
                    التصنيفات
                    <Grid3X3 className="me-2 size-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <BoldHeroSlider
            storeName={store.name}
            storeSlug={store.slug}
            coverImage={store.settings?.coverImage}
            banners={store.banners}
            heroProduct={heroProduct}
          />
        </div>

        <div className="w-full border-y bg-(--store-primary) py-3 text-(--store-primary-foreground)">
          <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-center text-xs font-bold uppercase tracking-[0.22em] sm:text-sm sm:tracking-[0.25em]">
            <span>New Arrivals</span>
            <span>•</span>
            <span>Fast Shopping</span>
            <span>•</span>
            <span>Featured Products</span>
            <span>•</span>
            <span>{store.name}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
        {store.categories.length > 0 && (
          <Reveal className="border-b pb-16">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-(--store-primary)">
                  Browse
                </p>

                <h2 className="mt-2 text-5xl font-bold uppercase tracking-[-0.06em] md:text-7xl">
                  التصنيفات
                </h2>
              </div>

              <Button
                asChild
                variant="outline"
                className="rounded-none font-bold"
              >
                <Link href={buildStoreUrl(store.slug, "/categories")}>
                  كل التصنيفات
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden border bg-border md:grid-cols-3 lg:grid-cols-6">
              {store.categories.slice(0, 6).map((category) => (
                <ThemeCategoryCard
                  key={category.id}
                  category={category}
                  storeSlug={store.slug}
                  variant="bold"
                />
              ))}
            </div>
          </Reveal>
        )}

        {featuredProducts.length > 0 && (
          <Reveal className="grid gap-8 border-b py-16 lg:grid-cols-[420px_1fr] lg:items-start">
            <div className="border bg-card p-7">
              <div className="mb-6 flex size-14 items-center justify-center bg-(--store-primary) text-(--store-primary-foreground)">
                <BadgePercent className="size-7" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.3em] text-(--store-primary)">
                Featured
              </p>

              <h2 className="mt-3 text-5xl font-bold uppercase leading-[0.9] tracking-[-0.06em]">
                مختارات قوية
              </h2>

              <p className="mt-5 text-sm font-medium leading-7 text-muted-foreground">
                سيكشن معمول عشان يطلع أهم المنتجات بشكل هجومي وواضح، مش هادي زي
                البوتيك.
              </p>

              <Button asChild className="mt-7 rounded-none font-bold">
                <Link href={buildStoreUrl(store.slug, "/products")}>
                  كل المنتجات
                  <ArrowLeft className="ms-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden border bg-border sm:grid-cols-2">
              {featuredProducts.map((product) => (
                <ThemeProductCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                  variant="bold"
                />
              ))}
            </div>
          </Reveal>
        )}

        {latestProducts.length === 0 ? (
          <div className="py-16">
            <ThemeEmptyProducts storeSlug={store.slug} />
          </div>
        ) : (
          <Reveal className="pt-16">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-(--store-primary)">
                  Catalog
                </p>

                <h2 className="mt-2 text-5xl font-bold uppercase tracking-[-0.06em] md:text-7xl">
                  كل المنتجات
                </h2>
              </div>

              <Button asChild className="rounded-none font-bold">
                <Link href={buildStoreUrl(store.slug, "/products")}>
                  عرض الكل
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latestProducts.map((product) => (
                <ThemeProductCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                  variant="bold"
                />
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </main>
  );
}