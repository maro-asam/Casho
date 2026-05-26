import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import StoreBanner from "../../_components/StoreBanner";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { StoreThemeProps } from "../types";
import ThemeProductCard from "../shared/ThemeProductCard";
import ThemeEmptyProducts from "../shared/ThemeEmptyProducts";

export default function ModernHome({ store }: StoreThemeProps) {
  const featuredProducts = store.products
    .filter((p) => p.isFeatured)
    .slice(0, 6);

  const latestProducts = store.products.slice(0, 12);

  return (
    <main className="mx-auto w-full max-w-screen-2xl space-y-14 px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Hero ── */}
      {store.banners?.length > 0 ? (
        <section className="overflow-hidden rounded-(--store-radius)">
          <StoreBanner
            banners={store.banners.map((b) => ({ ...b, title: b.title ?? "" }))}
            storeSlug={store.slug}
          />
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-(--store-radius) bg-(--store-primary)">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-white/[0.03]" />
          <div className="pointer-events-none absolute -bottom-20 left-10 size-64 rounded-full bg-(--store-secondary)/10" />
          <div className="pointer-events-none absolute right-1/3 top-1/2 size-32 -translate-y-1/2 rounded-full border border-white/5" />

          <div className="relative z-10 px-8 py-16 md:px-14 md:py-24">
            <div className="max-w-xl space-y-6">
              <span className="inline-block rounded-full border border-(--store-secondary)/30 bg-(--store-secondary)/10 px-4 py-1.5 text-xs font-semibold text-(--store-secondary)">
                {store.name}
              </span>

              <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
                {store.settings?.description
                  ? store.settings.description
                  : `تسوق منتجات ${store.name} بأفضل الأسعار`}
              </h1>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  style={{
                    background: "var(--store-secondary)",
                    color: "var(--store-primary)",
                  }}
                  className="font-bold"
                >
                  <Link href={buildStoreUrl(store.slug, "/products")}>
                    تسوق الآن
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="border border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href={buildStoreUrl(store.slug, "/categories")}>
                    استعرض التصنيفات
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      {featuredProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-(--store-primary)/50">
                مختارات خاصة
              </p>
              <h2 className="text-2xl font-bold">المنتجات المميزة</h2>
            </div>
            <Link
              href={buildStoreUrl(store.slug, "/products")}
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-(--store-primary) transition hover:gap-2.5"
            >
              كل المنتجات
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            {featuredProducts.map((product) => (
              <ThemeProductCard
                key={product.id}
                product={product}
                storeSlug={store.slug}
                variant="modern"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Categories — horizontal pills ── */}
      {store.categories.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">تسوق حسب التصنيف</h2>
            <Link
              href={buildStoreUrl(store.slug, "/categories")}
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-(--store-primary) transition hover:gap-2.5"
            >
              كل التصنيفات
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {store.categories.map((cat) => {
              const href = buildStoreUrl(store.slug, `/categories/${cat.id}`);
              return (
                <Link
                  key={cat.id}
                  href={href}
                  prefetch={false}
                  className="group flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition hover:border-(--store-primary) hover:bg-(--store-primary) hover:text-white"
                >
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={20}
                      height={20}
                      className="size-5 rounded-full object-cover"
                    />
                  ) : (
                    <FolderOpen className="size-4 text-muted-foreground transition group-hover:text-white" />
                  )}
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── All Products ── */}
      {latestProducts.length === 0 ? (
        <ThemeEmptyProducts storeSlug={store.slug} />
      ) : (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-(--store-primary)/50">
                الكتالوج الكامل
              </p>
              <h2 className="text-2xl font-bold">شاهد المزيد</h2>
            </div>
            <Link
              href={buildStoreUrl(store.slug, "/products")}
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-(--store-primary) transition hover:gap-2.5"
            >
              عرض الكل
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {latestProducts.map((product) => (
              <ThemeProductCard
                key={product.id}
                product={product}
                storeSlug={store.slug}
                variant="modern"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
