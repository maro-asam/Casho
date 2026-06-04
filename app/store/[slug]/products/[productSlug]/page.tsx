import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Star,
  Tag,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice, cn } from "@/lib/utils";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { SubscriptionStatus } from "@prisma/client";

import ProductGallery from "../_components/ProductGallery";
import ProductTabs from "./_components/ProductTabs";
import ShareButton from "./_components/ShareButton";
import TrustBadges from "./_components/TrustBadges";
import ProductActionsSection from "./_components/ProductActionsSection";
import ProductCard from "../../_components/shared/ProductCard";
import BoldProductCard from "../../_components/themes/BoldProductCard";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDiscount(price: number, compare: number | null) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

function getAvgRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function buildProductUrl(storeSlug: string, productSlug: string) {
  return buildStoreUrl(storeSlug, `/products/${productSlug}`);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type StoreInfo = { id: string; name: string; slug: string };

type WholesaleTier = { minQty: number; maxQty?: number; price: number };

type BundleItem = {
  productId: string;
  productName: string;
  quantity: number;
  image: string;
};

type ProductInfo = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  images: string[];
  description: string | null;
  brand: string | null;
  weight: number | null;
  stock: number;
  isFeatured: boolean;
  sizes: string[] | null;
  colors: string[] | null;
  wholesaleOptions: WholesaleTier[] | null;
  type: string;
  bundleItems: BundleItem[] | null;
  category: { id: string; name: string; slug: string };
};

type RelatedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  isFeatured: boolean;
  category: { name: string; slug: string } | null;
};

type ReviewItem = {
  id: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  reviewDate: Date;
};

type ProductDetailProps = {
  store: StoreInfo;
  product: ProductInfo;
  gallery: string[];
  relatedProducts: RelatedProduct[];
  hasDiscount: boolean;
  discountPct: number;
  reviews: ReviewItem[];
};

// ─── Route ────────────────────────────────────────────────────────────────────

type ProductDetailsRouteProps = {
  params: Promise<{ slug: string; productSlug: string }>;
};

export default async function ProductDetailsRoute({
  params,
}: ProductDetailsRouteProps) {
  const { slug, productSlug } = await params;
  if (!slug || !productSlug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
      settings: { select: { themeId: true } },
    },
  });

  if (!store || store.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    return notFound();
  }

  const product = await prisma.product.findFirst({
    where: { slug: productSlug, storeId: store.id, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) return notFound();

  const [reviews, relatedProducts] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId: product.id, storeId: store.id },
      orderBy: { reviewDate: "desc" },
      select: {
        id: true,
        customerName: true,
        customerAvatar: true,
        rating: true,
        title: true,
        content: true,
        verifiedPurchase: true,
        reviewDate: true,
      },
    }),
    prisma.product.findMany({
      where: {
        storeId: store.id,
        categoryId: product.categoryId,
        isActive: true,
        NOT: { id: product.id },
      },
      take: 5,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        image: true,
        isFeatured: true,
        category: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const themeId = store.settings?.themeId ?? "default";
  const hasDiscount =
    !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = calcDiscount(product.price, product.compareAtPrice);

  const gallery =
    product.images.length > 0
      ? [product.image, ...product.images.filter((img) => img !== product.image)]
      : [product.image];

  const props: ProductDetailProps = {
    store,
    product: {
      ...product,
      wholesaleOptions: (product.wholesaleOptions as WholesaleTier[] | null) ?? null,
      bundleItems: Array.isArray(product.bundleItems)
        ? (product.bundleItems as BundleItem[])
        : null,
    },
    gallery,
    relatedProducts,
    hasDiscount,
    discountPct,
    reviews,
  };

  if (themeId === "bold") {
    return <BoldProductPage {...props} />;
  }

  return <StandardProductPage {...props} themeId={themeId} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUNDLE CONTENTS SECTION
// ─────────────────────────────────────────────────────────────────────────────

function BundleContentsSection({ items }: { items: BundleItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--store-border)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Layers className="size-4" style={{ color: "var(--store-primary)" }} />
        <h3 className="text-sm font-semibold">محتويات الباقة</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-2.5" style={{ borderColor: "var(--store-border)" }}>
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.productName}
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
            )}
            <span className="flex-1 text-sm font-medium">{item.productName}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                background: "var(--store-primary)",
                color: "var(--store-primary-foreground, #fff)",
              }}
            >
              × {item.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STANDARD PRODUCT PAGE  (default, elegant, modern, minimal, dark)
// ─────────────────────────────────────────────────────────────────────────────

type ThemeId = string;

function StandardProductPage({
  store,
  product,
  gallery,
  relatedProducts,
  hasDiscount,
  discountPct,
  reviews,
  themeId,
}: ProductDetailProps & { themeId: ThemeId }) {
  const avgRating = getAvgRating(reviews);
  const inStock = product.stock > 0;

  const specs = [
    hasDiscount && product.compareAtPrice
      ? { label: "السعر الأصلي", value: formatPrice(product.compareAtPrice) }
      : null,
    { label: "التصنيف", value: product.category.name },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.weight !== null
      ? { label: "الوزن", value: `${product.weight} كجم` }
      : null,
    { label: "الحالة", value: inStock ? "متوفر" : "نفد المخزون" },
  ].filter((s): s is { label: string; value: string } => s !== null);

  const productUrl = buildProductUrl(store.slug, product.slug);

  // Minimal theme: strip decorative elements
  const isMinimal = themeId === "minimal";
  // Elegant: extra spacing
  const isElegant = themeId === "elegant";

  return (
    <div dir="rtl" className="min-h-screen pb-28 lg:pb-0">
      <div
        className={cn(
          "mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8",
          isElegant ? "py-10 lg:py-16" : "py-6 lg:py-10",
        )}
      >
        {/* ── Breadcrumb ── */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground lg:mb-8">
          <Link
            href={buildStoreUrl(store.slug)}
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowRight className="size-3.5" />
            {store.name}
          </Link>
          <span className="opacity-40">/</span>
          <Link
            href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}
            className="transition-colors hover:text-foreground"
          >
            {product.category.name}
          </Link>
          <span className="opacity-40">/</span>
          <span className="line-clamp-1 max-w-[200px] font-medium text-foreground">
            {product.name}
          </span>
        </nav>

        {/* ── Main grid ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12 xl:grid-cols-[1fr_460px]">
          {/* Gallery column — sticky on desktop */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              productName={product.name}
              mainImage={product.image}
              images={gallery}
            />
          </div>

          {/* Info column */}
          <div className={cn("space-y-5", isElegant && "space-y-6")}>
            {/* ── Meta row: category + badges ── */}
            <div className="flex flex-wrap items-center gap-2">
              {!isMinimal && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 rounded-full px-3 py-1 text-xs"
                >
                  <Tag className="size-3" />
                  {product.category.name}
                </Badge>
              )}
              {hasDiscount && (
                <Badge className="rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white hover:bg-rose-500">
                  خصم {discountPct}%
                </Badge>
              )}
              {product.isFeatured && !isMinimal && (
                <Badge
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: "var(--store-primary)",
                    color: "var(--store-primary-foreground)",
                  }}
                >
                  منتج مميز ✦
                </Badge>
              )}
              {product.brand && (
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs"
                >
                  {product.brand}
                </Badge>
              )}
            </div>

            {/* ── Rating summary ── */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "size-4",
                        s <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted-foreground/20 text-muted-foreground/20",
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} تقييم)
                </span>
              </div>
            )}

            {/* ── Product name ── */}
            <h1
              className={cn(
                "font-bold leading-snug tracking-tight",
                isElegant
                  ? "text-2xl font-semibold md:text-3xl"
                  : "text-2xl md:text-3xl lg:text-4xl",
              )}
            >
              {product.name}
            </h1>

            {/* ── Price ── */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "font-extrabold leading-none",
                  isElegant ? "text-3xl" : "text-4xl",
                )}
                style={{ color: "var(--store-primary)" }}
              >
                {formatPrice(product.price)}
              </span>
              {hasDiscount && product.compareAtPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    وفّر {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* ── Description ── */}
            {product.description?.trim() && (
              <p className="text-sm leading-7 text-muted-foreground md:text-[15px]">
                {product.description}
              </p>
            )}

            {/* ── Variants + stock + purchase actions ── */}
            <ProductActionsSection
              storeSlug={store.slug}
              productId={product.id}
              sizes={product.sizes ?? []}
              colors={product.colors ?? []}
              inStock={inStock}
              stock={product.stock}
              price={formatPrice(product.price)}
              regularPriceRaw={product.price}
              wholesaleOptions={product.wholesaleOptions}
              isMinimal={isMinimal}
            />

            {product.type === "BUNDLE" && product.bundleItems && (
              <BundleContentsSection items={product.bundleItems} />
            )}

            {/* ── Share + extras row ── */}
            <div className="flex items-center gap-3 pt-1">
              <ShareButton title={product.name} url={productUrl} />
              {product.brand && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="size-3.5" />
                  {product.brand}
                </span>
              )}
            </div>

            {/* ── Trust badges ── */}
            {!isMinimal ? (
              <TrustBadges className="pt-1" />
            ) : (
              <TrustBadges variant="row" className="pt-1" />
            )}
          </div>
        </div>

        {/* ── Tabs: description / specs / reviews / shipping ── */}
        <div
          className={cn(
            "mt-14 rounded-2xl border p-1",
            isElegant && "mt-20",
            isMinimal && "mt-14 rounded-none border-x-0",
          )}
          style={{ borderColor: "var(--store-border)" }}
        >
          <ProductTabs
            description={product.description}
            specs={specs}
            reviews={reviews}
          />
        </div>

        {/* ── Related products ── */}
        {relatedProducts.length > 0 && (
          <section className={cn("mt-16", isElegant && "mt-24")}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Package
                  className="size-5"
                  style={{ color: "var(--store-primary)" }}
                />
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  قد يعجبك أيضاً
                </h2>
              </div>
              <Link
                href={buildStoreUrl(
                  store.slug,
                  `/categories/${product.category.slug}`,
                )}
                className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--store-primary)" }}
              >
                عرض الكل
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} storeSlug={store.slug} />
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BOLD PRODUCT PAGE
// ─────────────────────────────────────────────────────────────────────────────

function BoldProductPage({
  store,
  product,
  gallery,
  relatedProducts,
  hasDiscount,
  discountPct,
  reviews,
}: ProductDetailProps) {
  const avgRating = getAvgRating(reviews);
  const inStock = product.stock > 0;
  const productUrl = buildProductUrl(store.slug, product.slug);

  const specs = [
    hasDiscount && product.compareAtPrice
      ? { label: "السعر الأصلي", value: formatPrice(product.compareAtPrice) }
      : null,
    { label: "التصنيف", value: product.category.name },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.weight !== null
      ? { label: "الوزن", value: `${product.weight} كجم` }
      : null,
    { label: "الحالة", value: inStock ? "متوفر" : "نفد المخزون" },
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <div dir="rtl" className="min-h-screen pb-24 lg:pb-0">
      {/* ── Split-screen hero ── */}
      <div className="lg:grid lg:min-h-[90vh] lg:grid-cols-[55%_45%]">
        {/* Gallery panel — sticky on desktop */}
        <div className="relative lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
          <ProductGallery
            productName={product.name}
            mainImage={product.image}
            images={gallery}
            className="h-full"
            portrait
          />
        </div>

        {/* Info panel */}
        <div
          className="flex flex-col gap-0 border-s lg:overflow-y-auto"
          style={{ borderColor: "var(--store-border)" }}
        >
          <div className="px-6 py-10 sm:px-10 lg:py-14">
            {/* Breadcrumb */}
            <nav className="mb-10 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link
                href={buildStoreUrl(store.slug)}
                className="transition-colors hover:text-foreground"
              >
                {store.name}
              </Link>
              <span className="opacity-40">/</span>
              <Link
                href={buildStoreUrl(
                  store.slug,
                  `/categories/${product.category.slug}`,
                )}
                className="transition-colors hover:text-foreground"
              >
                {product.category.name}
              </Link>
            </nav>

            <div className="space-y-7">
              {/* Category + discount */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60"
                  style={{ color: "var(--store-primary)" }}
                >
                  {product.category.name}
                </span>
                {hasDiscount && (
                  <span className="bg-black px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-white dark:bg-white dark:text-black">
                    خصم {discountPct}%
                  </span>
                )}
                {product.brand && (
                  <span className="border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] opacity-50">
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "size-3.5",
                          s <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted-foreground/20 text-muted-foreground/20",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({reviews.length})
                  </span>
                </div>
              )}

              {/* Product name */}
              <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl lg:text-5xl">
                {product.name}
              </h1>

              {/* Price */}
              <div
                className="flex flex-wrap items-baseline gap-4 border-y py-5"
                style={{ borderColor: "var(--store-border)" }}
              >
                <span
                  className="text-4xl font-black leading-none"
                  style={{ color: "var(--store-primary)" }}
                >
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && product.compareAtPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
                {hasDiscount && product.compareAtPrice && (
                  <span className="bg-rose-500 px-2.5 py-1 text-xs font-black text-white">
                    وفّر {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description?.trim() && (
                <p className="text-sm leading-7 text-muted-foreground">
                  {product.description}
                </p>
              )}

              {/* Variants + stock + purchase actions */}
              <ProductActionsSection
                storeSlug={store.slug}
                productId={product.id}
                sizes={product.sizes ?? []}
                colors={product.colors ?? []}
                inStock={inStock}
                stock={product.stock}
                price={formatPrice(product.price)}
                regularPriceRaw={product.price}
                wholesaleOptions={product.wholesaleOptions}
                boldStyle
              />

              {product.type === "BUNDLE" && product.bundleItems && (
                <BundleContentsSection items={product.bundleItems} />
              )}

              {/* Share */}
              <div className="flex items-center gap-3 pt-2">
                <ShareButton
                  title={product.name}
                  url={productUrl}
                  variant="ghost"
                />
              </div>

              {/* Trust badges row */}
              <TrustBadges variant="row" className="border-t pt-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs (below split-screen) ── */}
      <div
        className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"
      >
        <div
          className="mt-0 border-t"
          style={{ borderColor: "var(--store-border)" }}
        >
          <ProductTabs
            description={product.description}
            specs={specs}
            reviews={reviews}
            tabsStyle="bold"
          />
        </div>

        {/* ── Related products ── */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pb-16">
            <div
              className="mb-8 flex items-end justify-between gap-4 border-b pb-4"
              style={{ borderColor: "var(--store-border)" }}
            >
              <h2 className="text-2xl font-black uppercase tracking-tight">
                منتجات مشابهة
              </h2>
              <Link
                href={buildStoreUrl(
                  store.slug,
                  `/categories/${product.category.slug}`,
                )}
                className="mb-0.5 text-xs font-black uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
                style={{ color: "var(--store-primary)" }}
              >
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((item) => (
                <BoldProductCard
                  key={item.id}
                  product={item}
                  storeSlug={store.slug}
                />
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
