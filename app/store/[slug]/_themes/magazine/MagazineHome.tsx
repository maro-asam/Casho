import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  Grid3X3,
  Package,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";

import type { StoreThemeProps } from "../types";
import ThemeProductCard from "../shared/ThemeProductCard";
import ThemeCategoryCard from "../shared/ThemeCategoryCard";
import ThemeEmptyProducts from "../shared/ThemeEmptyProducts";
import Reveal from "../shared/Reveal";

export default function MagazineHome({ store }: StoreThemeProps) {
  const featuredProducts = store.products
    .filter((product) => product.isFeatured)
    .slice(0, 8);

  const latestProducts = store.products.slice(0, 8);

  const heroProducts =
    featuredProducts.length > 0 ? featuredProducts : latestProducts.slice(0, 8);

  const hasProducts = latestProducts.length > 0;
  const hasCategories = store.categories.length > 0;

  return (
    <main className="overflow-hidden bg-background text-foreground">
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--muted))_0,transparent_30%),radial-gradient(circle_at_85%_10%,hsl(var(--muted))_0,transparent_26%)] opacity-60" />

        <div className="relative mx-auto flex min-h-[calc(100svh-88px)] w-full max-w-screen-2xl flex-col px-5 py-7 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid flex-1 content-center gap-10 ">
            {heroProducts.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-700">
                <div className="mb-6 flex items-center justify-center gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--store-primary)]">
                      Featured Products
                    </p>

                    <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
                      المنتجات المميزة
                    </h2>
                  </div>
                </div>

                <Carousel
                  opts={{
                    align: "start",
                    loop: heroProducts.length > 4,
                    direction: "rtl",
                  }}
                  className="relative w-full"
                >
                  <CarouselContent className="-ms-4">
                    {heroProducts.map((product) => (
                      <CarouselItem
                        key={product.id}
                        className="basis-[82%] ps-4 sm:basis-[48%] lg:basis-[31%] xl:basis-[24%]"
                      >
                        <ThemeProductCard
                          product={product}
                          storeSlug={store.slug}
                          variant="boutique"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {heroProducts.length > 1 && (
                    <div className="flex w-full mt-6 items-center justify-center gap-4">
                      <CarouselPrevious className="static translate-y-0 rounded-full border bg-background shadow-sm" />
                      <CarouselNext className="static translate-y-0 rounded-full border bg-background shadow-sm" />
                    </div>
                  )}
                </Carousel>
              </div>
            )}

            <div className="grid overflow-hidden rounded-(--store-radius) border bg-card/70 shadow-sm backdrop-blur sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
              <div className="border-b p-5 sm:border-b-0 sm:border-l">
                <p className="text-3xl font-black">{store.products.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                  Products
                </p>
              </div>

              <div className="border-b p-5 sm:border-b-0 sm:border-l">
                <p className="text-3xl font-black">{store.categories.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                  Categories
                </p>
              </div>

              <div className="p-5">
                <p className="text-3xl font-black">{featuredProducts.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                  Featured
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b bg-card py-3">
        <div className="flex w-max animate-[magazineMarquee_30s_linear_infinite] items-center gap-8 whitespace-nowrap px-4 text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
          <span>New Collection</span>
          <span>•</span>
          <span>{store.name}</span>
          <span>•</span>
          <span>Curated Products</span>
          <span>•</span>
          <span>Fast Checkout</span>
          <span>•</span>
          <span>Premium Storefront</span>
          <span>•</span>
          <span>New Collection</span>
          <span>•</span>
          <span>{store.name}</span>
          <span>•</span>
          <span>Curated Products</span>
          <span>•</span>
          <span>Fast Checkout</span>
          <span>•</span>
          <span>Premium Storefront</span>
        </div>
      </div>

      <section className="mx-auto w-full max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
        {hasCategories && (
          <Reveal className="border-b pb-16">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--store-primary)]">
                  Collections
                </p>

                <h2 className="mt-2 text-4xl font-black leading-tight tracking-[-0.04em] md:text-6xl">
                  تسوق حسب التصنيف
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  اختار التصنيف المناسب ووصل للمنتجات اللي بتدور عليها بسرعة.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                className="rounded-full font-black"
              >
                <Link href={buildStoreUrl(store.slug, "/categories")}>
                  كل التصنيفات
                  <ArrowLeft className="ms-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {store.categories.slice(0, 4).map((category) => (
                <ThemeCategoryCard
                  key={category.id}
                  category={category}
                  storeSlug={store.slug}
                  variant="magazine"
                />
              ))}
            </div>
          </Reveal>
        )}

        {featuredProducts.length > 0 && (
          <Reveal className={cn("border-b py-16", !hasCategories && "pt-0")}>
            <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--store-primary)]">
                  Editor Picks
                </p>

                <h2 className="mt-2 text-4xl font-black leading-tight tracking-[-0.04em] md:text-6xl">
                  اختيارات مميزة
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  المنتجات اللي تستاهل تظهر في أول الواجهة وتلفت نظر العميل.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground shadow-sm md:inline-flex">
                <BadgePercent className="size-4 text-[var(--store-primary)]" />
                Featured
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.slice(0, 4).map((product) => (
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

        {!hasProducts ? (
          <div className="py-16">
            <ThemeEmptyProducts storeSlug={store.slug} />
          </div>
        ) : (
          <Reveal
            className={cn(
              "pt-16",
              !hasCategories && featuredProducts.length === 0 && "pt-0",
            )}
          >
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--store-primary)]">
                  Catalog
                </p>

                <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-6xl">
                  أحدث المنتجات
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  آخر المنتجات المتاحة في المتجر، جاهزة للتصفح والطلب.
                </p>
              </div>

              <Button asChild className="rounded-full font-black">
                <Link href={buildStoreUrl(store.slug, "/products")}>
                  عرض الكل
                  <ArrowLeft className="ms-2 size-4" />
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

        {hasProducts && (
          <Reveal className="pt-16">
            <div className="rounded-[var(--store-radius)] border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                    <Star className="size-4 text-[var(--store-primary)]" />
                    Explore More
                  </div>

                  <h2 className="text-3xl font-black leading-tight tracking-[-0.03em] md:text-5xl">
                    لسه فيه منتجات أكتر مستنياك
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                    تصفح الكتالوج كامل وشوف كل المنتجات المتاحة في مكان واحد.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full font-black">
                    <Link href={buildStoreUrl(store.slug, "/products")}>
                      كل المنتجات
                      <Package className="me-2 size-5" />
                    </Link>
                  </Button>

                  {hasCategories && (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full font-black"
                    >
                      <Link href={buildStoreUrl(store.slug, "/categories")}>
                        التصنيفات
                        <Grid3X3 className="me-2 size-5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        )}
      </section>
    </main>
  );
}
