"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Truck,
  Headphones,
  ShieldCheck,
  Tag,
  LayoutGrid,
  Flame,
} from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "../../cart/_components/AddToCartButton";

import type { StoreThemeProps } from "../types";
import ThemeEmptyProducts from "../shared/ThemeEmptyProducts";

export default function ExclusiveHome({ store }: StoreThemeProps) {
  const featured = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const latest = store.products.slice(0, 12);
  const newArrivals = store.products.filter((p) => p.isFeatured).slice(0, 4);
  const hasBanners = store.banners?.length > 0;

  return (
    <div className="w-full overflow-x-hidden bg-white">
      {/* ═══════════════════════════════════════════
          HERO — full screen, sidebar + banner
      ══════════════════════════════════════════════ */}
      <section className="flex h-screen w-full flex-row" style={{ maxHeight: "100svh" }}>
        {/* Category sidebar — right side (RTL = right) */}
        <aside
          className="hidden w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-e py-4 lg:flex"
          style={{ borderColor: "var(--store-border)", background: "#fafafa" }}
        >
          <p
            className="px-5 pb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--store-primary)" }}
          >
            الأقسام
          </p>
          {store.categories.length > 0 ? (
            store.categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildStoreUrl(store.slug, `/categories/${cat.id}`)}
                className="group flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all hover:bg-(--store-primary) hover:text-white"
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={22}
                    height={22}
                    className="size-5 rounded-sm object-cover"
                  />
                ) : (
                  <LayoutGrid className="size-4 shrink-0 text-muted-foreground group-hover:text-white" />
                )}
                <span className="line-clamp-1">{cat.name}</span>
                <ChevronLeft className="ml-auto size-3.5 shrink-0 text-muted-foreground group-hover:text-white/70" />
              </Link>
            ))
          ) : (
            <p className="px-5 text-xs text-muted-foreground">لا توجد أقسام</p>
          )}
        </aside>

        {/* Hero area — left side fills remaining space */}
        <div className="relative flex-1 overflow-hidden">
          {hasBanners ? (
            <ExclusiveHeroCarousel
              banners={store.banners.map((b) => ({ ...b, title: b.title ?? "" }))}
              storeSlug={store.slug}
            />
          ) : (
            <div
              className="relative flex h-full w-full flex-col items-start justify-center gap-6 overflow-hidden px-14"
              style={{ background: "var(--store-secondary)" }}
            >
              {/* decorative circle */}
              <div
                className="pointer-events-none absolute -bottom-32 -left-32 size-[600px] rounded-full opacity-10"
                style={{ background: "var(--store-primary)" }}
              />
              <div
                className="pointer-events-none absolute -top-20 right-0 size-96 rounded-full opacity-5"
                style={{ background: "var(--store-primary)" }}
              />

              <p
                className="rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest text-white/60"
                style={{ border: "1px solid rgba(255,255,255,.15)" }}
              >
                {store.name}
              </p>

              <h1 className="max-w-xl text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
                {store.settings?.description ?? `اكتشف أحدث منتجات ${store.name}`}
              </h1>

              <p className="max-w-sm text-base text-white/50">
                تسوق بسهولة واحصل على أفضل الأسعار مع توصيل سريع لباب بيتك
              </p>

              <div className="flex gap-3">
                <Link
                  href={buildStoreUrl(store.slug, "/products")}
                  className="flex items-center gap-2 rounded-sm px-7 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: "var(--store-primary)" }}
                >
                  تسوق الآن
                  <ShoppingCart className="size-4" />
                </Link>
                <Link
                  href={buildStoreUrl(store.slug, "/categories")}
                  className="flex items-center gap-2 rounded-sm border px-7 py-3.5 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
                  style={{ borderColor: "rgba(255,255,255,.2)" }}
                >
                  الأقسام
                </Link>
              </div>

              {/* scroll hint */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
                <div className="h-10 w-px bg-white" />
                <p className="text-[10px] uppercase tracking-widest text-white">scroll</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FLASH SALES — dark strip
      ══════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section style={{ background: "var(--store-secondary)" }}>
          {/* Header strip */}
          <div className="flex items-center justify-between px-6 py-5 md:px-10">
            <div className="flex items-center gap-3">
              <Flame className="size-5 text-white" style={{ color: "var(--store-primary)" }} />
              <span className="text-lg font-extrabold text-white">عروض اليوم</span>
              <span
                className="ml-2 rounded-sm px-2 py-0.5 text-xs font-bold text-white"
                style={{ background: "var(--store-primary)" }}
              >
                مميز
              </span>
            </div>
            <Link
              href={buildStoreUrl(store.slug, "/products")}
              className="flex items-center gap-1.5 text-sm font-semibold transition"
              style={{ color: "var(--store-primary)" }}
            >
              عرض الكل
              <ChevronLeft className="size-4" />
            </Link>
          </div>

          {/* Horizontal product scroll */}
          <div className="flex gap-4 overflow-x-auto px-6 pb-8 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((product) => (
              <ExclusiveDarkCard
                key={product.id}
                product={product}
                storeSlug={store.slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          CATEGORIES — bold icon grid
      ══════════════════════════════════════════════ */}
      {store.categories.length > 0 && (
        <section className="px-6 py-16 md:px-10">
          <SectionLabel label="الأقسام" title="تسوق حسب القسم" storeSlug={store.slug} href={buildStoreUrl(store.slug, "/categories")} />

          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {store.categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={buildStoreUrl(store.slug, `/categories/${cat.id}`)}
                className="group flex flex-col items-center gap-2.5 rounded-sm py-5 text-center text-xs font-semibold transition-all hover:-translate-y-1"
                style={{ border: "1.5px solid var(--store-border)", background: "#fff" }}
              >
                <div
                  className="flex size-12 items-center justify-center rounded-full transition group-hover:scale-110"
                  style={{ background: "var(--store-muted)" }}
                >
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={32}
                      height={32}
                      className="size-8 object-contain"
                    />
                  ) : (
                    <Tag className="size-5 text-muted-foreground" />
                  )}
                </div>
                <span className="line-clamp-1 px-1">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* divider */}
      <div className="mx-6 border-t md:mx-10" style={{ borderColor: "var(--store-border)" }} />

      {/* ═══════════════════════════════════════════
          ALL PRODUCTS — overlay cards
      ══════════════════════════════════════════════ */}
      <section className="px-6 py-16 md:px-10">
        {latest.length === 0 ? (
          <ThemeEmptyProducts storeSlug={store.slug} />
        ) : (
          <>
            <SectionLabel
              label="الكتالوج"
              title="استعرض المنتجات"
              storeSlug={store.slug}
              href={buildStoreUrl(store.slug, "/products")}
            />
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {latest.map((product) => (
                <ExclusiveOverlayCard
                  key={product.id}
                  product={product}
                  storeSlug={store.slug}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          NEW ARRIVALS — editorial full-bleed banners
      ══════════════════════════════════════════════ */}
      {newArrivals.length >= 2 && (
        <section
          className="px-6 py-16 md:px-10"
          style={{ background: "#f7f7f7" }}
        >
          <SectionLabel label="وصل حديثاً" title="الوصول الجديد" storeSlug={store.slug} href={buildStoreUrl(store.slug, "/products")} />

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Large card */}
            <Link
              href={buildStoreUrl(store.slug, `/products/${newArrivals[0].slug}`)}
              className="group relative col-span-1 overflow-hidden md:col-span-1 lg:col-span-2"
              style={{ borderRadius: "var(--store-radius)", minHeight: 380 }}
            >
              <div
                className="absolute inset-0"
                style={{ background: "var(--store-secondary)" }}
              />
              {newArrivals[0].image && (
                <Image
                  src={newArrivals[0].image}
                  alt={newArrivals[0].name}
                  fill
                  className="object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 right-0 space-y-2 p-7">
                <p
                  className="inline-block rounded-sm px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: "var(--store-primary)" }}
                >
                  جديد
                </p>
                <h3 className="text-2xl font-extrabold text-white">
                  {newArrivals[0].name}
                </h3>
                <p className="text-lg font-bold" style={{ color: "var(--store-primary)" }}>
                  {formatPrice(newArrivals[0].price)}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white underline underline-offset-4">
                  تسوق الآن <ChevronLeft className="size-3.5" />
                </span>
              </div>
            </Link>

            {/* Stacked small cards */}
            <div className="flex flex-col gap-4">
              {newArrivals.slice(1, 3).map((product) => (
                <Link
                  key={product.id}
                  href={buildStoreUrl(store.slug, `/products/${product.slug}`)}
                  className="group relative overflow-hidden"
                  style={{ borderRadius: "var(--store-radius)", minHeight: 178 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ background: "var(--store-secondary)" }}
                  />
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-65"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 right-0 space-y-1 p-5">
                    <h3 className="text-base font-extrabold text-white">
                      {product.name}
                    </h3>
                    <p className="text-sm font-bold" style={{ color: "var(--store-primary)" }}>
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          FEATURES BAR
      ══════════════════════════════════════════════ */}
      <section
        className="grid gap-0 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        style={{ background: "var(--store-secondary)" }}
      >
        {[
          { icon: Truck, title: "توصيل سريع", desc: "على جميع الطلبات" },
          { icon: Headphones, title: "خدمة عملاء 24/7", desc: "نحن دايمًا موجودين" },
          { icon: ShieldCheck, title: "ضمان استرداد", desc: "استرجع أموالك بسهولة" },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-center justify-center gap-4 px-8 py-8"
            style={{ borderColor: "rgba(255,255,255,.08)" }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,.07)" }}
            >
              <Icon className="size-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">{title}</p>
              <p className="text-sm text-white/50">{desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hero carousel (client-side, manual autoplay)
───────────────────────────────────────────── */
function ExclusiveHeroCarousel({
  banners,
  storeSlug,
}: {
  banners: { id: string; title: string; image: string }[];
  storeSlug: string;
}) {
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer() {
    timer.current = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 4000);
  }

  useEffect(() => {
    startTimer();
    return () => { if (timer.current) clearInterval(timer.current); };
  });

  function go(dir: 1 | -1) {
    if (timer.current) clearInterval(timer.current);
    setCurrent((c) => (c + dir + banners.length) % banners.length);
    startTimer();
  }

  const banner = banners[current];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <Image
            src={b.image}
            alt={b.title || ""}
            fill
            priority={i === 0}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent" />

          {b.title && (
            <div className="absolute bottom-16 right-10 max-w-md space-y-4 text-right">
              <h2 className="text-3xl font-extrabold leading-snug text-white md:text-4xl">
                {b.title}
              </h2>
              <Link
                href={buildStoreUrl(storeSlug, "/products")}
                className="inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--store-primary)" }}
              >
                تسوق الآن
                <ShoppingCart className="size-4" />
              </Link>
            </div>
          )}
        </div>
      ))}

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 8,
                  background: i === current ? "var(--store-primary)" : "rgba(255,255,255,.5)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dark horizontal card (for Flash Sales strip)
───────────────────────────────────────────── */
type ExProduct = StoreThemeProps["store"]["products"][number];

function ExclusiveDarkCard({ product, storeSlug }: { product: ExProduct; storeSlug: string }) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;
  const pct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div
      className="group relative w-44 shrink-0 overflow-hidden rounded-sm transition-transform hover:-translate-y-1"
      style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <Link href={href}>
          <Image
            src={product.image || "/images/product-placeholder.png"}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {hasDiscount && (
          <span
            className="absolute left-2 top-2 rounded-sm px-2 py-0.5 text-[10px] font-extrabold text-white"
            style={{ background: "var(--store-primary)" }}
          >
            -{pct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 p-3">
        <Link href={href}>
          <p className="line-clamp-1 text-sm font-semibold text-white">{product.name}</p>
        </Link>
        <div className="flex items-center justify-between gap-1">
          <div>
            <p className="text-sm font-extrabold" style={{ color: "var(--store-primary)" }}>
              {formatPrice(product.price)}
            </p>
            {hasDiscount && (
              <p className="text-xs text-white/40 line-through">{formatPrice(product.compareAtPrice!)}</p>
            )}
          </div>
        </div>
        <AddToCartButton storeSlug={storeSlug} productId={product.id} size="sm" variant="default" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Overlay card — image fills card, info slides up on hover
───────────────────────────────────────────── */
function ExclusiveOverlayCard({ product, storeSlug }: { product: ExProduct; storeSlug: string }) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;
  const pct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div
      className="group relative overflow-hidden bg-white"
      style={{
        border: "1.5px solid var(--store-border)",
        borderRadius: "var(--store-radius)",
      }}
    >
      {/* Square image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link href={href}>
          <Image
            src={product.image || "/images/product-placeholder.png"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-110"
          />
        </Link>

        {/* Dark overlay slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/70 px-4 py-3 transition-transform duration-300 group-hover:translate-y-0">
          <AddToCartButton storeSlug={storeSlug} productId={product.id} size="sm" variant="default" />
        </div>

        {/* Badges */}
        {hasDiscount && (
          <span
            className="absolute right-2.5 top-2.5 rounded-sm px-2 py-0.5 text-[10px] font-extrabold text-white"
            style={{ background: "var(--store-primary)" }}
          >
            -{pct}%
          </span>
        )}
      </div>

      {/* Info — always visible */}
      <div className="space-y-1 p-3">
        {product.category?.name && (
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
        )}
        <Link href={href}>
          <h3 className="line-clamp-1 text-sm font-semibold transition hover:text-(--store-primary)">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 pt-0.5">
          <p className="text-sm font-extrabold" style={{ color: "var(--store-primary)" }}>
            {formatPrice(product.price)}
          </p>
          {hasDiscount && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reusable section label
───────────────────────────────────────────── */
function SectionLabel({
  label,
  title,
  href,
}: {
  label: string;
  title: string;
  storeSlug: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className="inline-block h-10 w-1 rounded-full"
          style={{ background: "var(--store-primary)" }}
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--store-primary)" }}>
            {label}
          </p>
          <h2 className="text-2xl font-extrabold">{title}</h2>
        </div>
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 text-sm font-semibold transition hover:gap-2"
        style={{ color: "var(--store-primary)" }}
      >
        عرض الكل
        <ChevronLeft className="size-4" />
      </Link>
    </div>
  );
}
