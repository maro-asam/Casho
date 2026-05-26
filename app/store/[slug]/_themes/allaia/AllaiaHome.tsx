"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowLeft, Truck, RefreshCw, CreditCard } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "../../cart/_components/AddToCartButton";
import type { StoreThemeProps } from "../types";
import ThemeEmptyProducts from "../shared/ThemeEmptyProducts";

/* ─────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */
export default function AllaiaHome({ store }: StoreThemeProps) {
  const featured   = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const allLatest  = store.products.slice(0, 12);
  const promoBanner = store.products.find((p) => p.isFeatured && p.image);
  const cats        = store.categories.slice(0, 3);

  return (
    <div className="w-full bg-white" style={{ color: "#1c1c1c" }}>

      {/* ══════════════════════════════════════════
          HERO — full-width slider or split fallback
      ══════════════════════════════════════════ */}
      {store.banners?.length > 0 ? (
        <AllaiaHeroSlider banners={store.banners.map((b) => ({ ...b, title: b.title ?? "" }))} storeSlug={store.slug} />
      ) : (
        <AllaiaHeroFallback store={store} />
      )}

      {/* ══════════════════════════════════════════
          CATEGORY PROMO TILES — 3 portrait tiles
      ══════════════════════════════════════════ */}
      {cats.length > 0 && (
        <section className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-8 lg:px-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((cat, i) => (
              <Link
                key={cat.id}
                href={buildStoreUrl(store.slug, `/categories/${cat.id}`)}
                className="group relative block overflow-hidden bg-gray-100"
                style={{ aspectRatio: i === 0 ? "3/4" : "3/4" }}
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: i === 0
                        ? "linear-gradient(135deg,#1c1c1c,#4a4a4a)"
                        : i === 1
                        ? "linear-gradient(135deg,#c8b8a2,#8c7c6a)"
                        : "linear-gradient(135deg,#a8b8c8,#6878a0)",
                    }}
                  />
                )}
                {/* overlay */}
                <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:bg-black/35" />
                {/* label */}
                <div className="absolute bottom-0 right-0 p-6 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {i === 0 ? "الأكثر مبيعاً" : i === 1 ? "وصل حديثاً" : "العروض"}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-white">{cat.name}</h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white underline underline-offset-4 transition-gap duration-200 group-hover:gap-3">
                    تسوق الآن
                    <ArrowLeft className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* divider */}
      <div className="mx-auto max-w-screen-2xl px-12">
        <div className="border-t" style={{ borderColor: "#e8e8e8" }} />
      </div>

      {/* ══════════════════════════════════════════
          TOP SELLING — centered heading + 4-col grid
      ══════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-8 lg:px-12">
          {/* Centered heading */}
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              مختارات مميزة
            </p>
            <h2 className="text-3xl font-bold tracking-tight">المنتجات المميزة</h2>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <AllaiaProductCard key={product.id} product={product} storeSlug={store.slug} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href={buildStoreUrl(store.slug, "/products")}
              className="inline-flex items-center gap-2 border border-black px-10 py-3.5 text-sm font-semibold tracking-wide transition hover:bg-black hover:text-white"
            >
              عرض جميع المنتجات
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          PROMO BANNER — full-width split (image + text)
      ══════════════════════════════════════════ */}
      {promoBanner && (
        <section className="overflow-hidden bg-gray-50">
          <div className="mx-auto flex max-w-screen-2xl flex-col lg:flex-row">
            {/* Image side — right (start) in RTL */}
            <div className="relative h-72 w-full lg:h-auto lg:w-1/2">
              {promoBanner.image && (
                <Image
                  src={promoBanner.image}
                  alt={promoBanner.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            {/* Text side — left (end) in RTL */}
            <div className="flex w-full flex-col items-start justify-center gap-5 p-10 text-right lg:w-1/2 lg:p-16">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                منتج مميز
              </p>
              <h2 className="text-3xl font-bold leading-snug lg:text-4xl">
                {promoBanner.name}
              </h2>
              {promoBanner.description && (
                <p className="max-w-sm text-sm leading-7 text-gray-500">
                  {promoBanner.description}
                </p>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold" style={{ color: "var(--store-primary)" }}>
                  {formatPrice(promoBanner.price)}
                </span>
                {typeof promoBanner.compareAtPrice === "number" &&
                  promoBanner.compareAtPrice > promoBanner.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(promoBanner.compareAtPrice)}
                    </span>
                  )}
              </div>
              <AddToCartButton
                storeSlug={store.slug}
                productId={promoBanner.id}
                size="default"
                variant="default"
              />
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          ALL PRODUCTS — 5-col borderless grid
      ══════════════════════════════════════════ */}
      <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-8 lg:px-12">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            الكتالوج الكامل
          </p>
          <h2 className="text-3xl font-bold tracking-tight">استعرض المنتجات</h2>
        </div>

        {allLatest.length === 0 ? (
          <ThemeEmptyProducts storeSlug={store.slug} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {allLatest.map((product) => (
                <AllaiaProductCard key={product.id} product={product} storeSlug={store.slug} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href={buildStoreUrl(store.slug, "/products")}
                className="inline-flex items-center gap-2 border border-black px-10 py-3.5 text-sm font-semibold tracking-wide transition hover:bg-black hover:text-white"
              >
                عرض الكل
                <ArrowLeft className="size-4" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════
          TRUST BADGES — 3 columns, minimal
      ══════════════════════════════════════════ */}
      <section
        className="border-t"
        style={{ borderColor: "#e8e8e8", background: "#fafafa" }}
      >
        <div className="mx-auto grid max-w-screen-2xl divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
          {[
            { icon: Truck,      title: "شحن مجاني",        sub: "على الطلبات فوق 500 جنيه" },
            { icon: RefreshCw,  title: "إرجاع مجاني",      sub: "خلال 14 يوم من الاستلام" },
            { icon: CreditCard, title: "دفع آمن 100%",      sub: "جميع وسائل الدفع مقبولة" },
          ].map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center justify-center gap-4 px-8 py-8"
              style={{ borderColor: "#e8e8e8" }}
            >
              <Icon className="size-6 shrink-0 text-gray-400" />
              <div className="text-right">
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Hero slider — crossfade, minimal dots & arrows
───────────────────────────────────────────────────────── */
function AllaiaHeroSlider({
  banners,
  storeSlug,
}: {
  banners: { id: string; title: string; image: string }[];
  storeSlug: string;
}) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setIdx((i) => (i + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    timer.current = setInterval(next, 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [next]);

  function jump(i: number) {
    if (timer.current) clearInterval(timer.current);
    setIdx(i);
    timer.current = setInterval(next, 5000);
  }

  const b = banners[idx];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "90vh", maxHeight: 780 }}>
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0, zIndex: i === idx ? 1 : 0 }}
        >
          <Image
            src={banner.image}
            alt={banner.title || ""}
            fill
            priority={i === 0}
            className="object-cover"
          />
          {/* gradient overlay — subtle */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-black/15 to-transparent" />
        </div>
      ))}

      {/* Text overlay */}
      {b.title && (
        <div className="absolute inset-0 z-10 flex flex-col items-start justify-end p-10 text-right md:p-16">
          <div className="max-w-lg space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              مجموعة جديدة
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {b.title}
            </h1>
            <Link
              href={buildStoreUrl(storeSlug, "/products")}
              className="inline-flex items-center gap-2 bg-white px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              تسوق الآن
              <ShoppingBag className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute right-5 top-1/2 z-20 -translate-y-1/2 flex size-11 items-center justify-center bg-white/90 text-black backdrop-blur-sm transition hover:bg-white"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            onClick={next}
            className="absolute left-5 top-1/2 z-20 -translate-y-1/2 flex size-11 items-center justify-center bg-white/90 text-black backdrop-blur-sm transition hover:bg-white"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => jump(i)}
                className="transition-all duration-300"
                style={{
                  width:       i === idx ? 28 : 8,
                  height:      8,
                  borderRadius: 4,
                  background:  i === idx ? "#fff" : "rgba(255,255,255,.4)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Hero fallback — no banners
───────────────────────────────────────────────────────── */
function AllaiaHeroFallback({ store }: StoreThemeProps) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-7 text-center"
      style={{
        height: "80vh",
        maxHeight: 680,
        background: "linear-gradient(160deg,#f9f7f4 0%,#ede9e3 100%)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
        {store.name}
      </p>
      <h1 className="max-w-xl px-6 text-5xl font-bold leading-tight tracking-tight text-black md:text-6xl">
        {store.settings?.description ?? `اكتشف أحدث مجموعات ${store.name}`}
      </h1>
      <p className="max-w-sm px-6 text-sm leading-7 text-gray-500">
        تسوق أجود المنتجات بأسعار تنافسية مع توصيل سريع لباب بيتك
      </p>
      <div className="flex gap-3 px-6">
        <Link
          href={buildStoreUrl(store.slug, "/products")}
          className="flex items-center gap-2 bg-black px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-black/80"
        >
          تسوق الآن
          <ShoppingBag className="size-4" />
        </Link>
        <Link
          href={buildStoreUrl(store.slug, "/categories")}
          className="flex items-center gap-2 border border-black px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          الأقسام
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Allaia product card — no border, image scale + overlay CTA
───────────────────────────────────────────────────────── */
type AllaiaProduct = StoreThemeProps["store"]["products"][number];

function AllaiaProductCard({ product, storeSlug }: { product: AllaiaProduct; storeSlug: string }) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;
  const pct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="group">
      {/* Image wrapper */}
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "3/4" }}>
        <Link href={href} className="block h-full w-full">
          <Image
            src={product.image || "/images/product-placeholder.png"}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Sale badge */}
        {hasDiscount && (
          <span className="absolute right-2.5 top-2.5 bg-black px-2 py-0.5 text-[10px] font-bold text-white">
            -{pct}%
          </span>
        )}
        {product.isFeatured && !hasDiscount && (
          <span className="absolute right-2.5 top-2.5 bg-black px-2 py-0.5 text-[10px] font-bold text-white">
            جديد
          </span>
        )}

        {/* Hover CTA — slides up from bottom */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <AddToCartButton
            storeSlug={storeSlug}
            productId={product.id}
            size="default"
            variant="default"
          />
        </div>
      </div>

      {/* Info — no card background, just text */}
      <div className="mt-3 space-y-1 text-right">
        {product.category?.name && (
          <p className="text-[11px] uppercase tracking-widest text-gray-400">
            {product.category.name}
          </p>
        )}
        <Link href={href}>
          <h3 className="line-clamp-1 text-sm font-medium transition hover:text-gray-500">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-sm font-bold">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
