import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Package, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import ProductGallery from "../_components/ProductGallery";
import AddToCartButton from "../../cart/_components/AddToCartButton";
import BuyNowButton from "../../cart/_components/BuyNowButton";
import ProductCard from "../../_components/shared/ProductCard";
import BoldProductCard from "../../_components/themes/BoldProductCard";
import { SubscriptionStatus } from "@prisma/client";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

export const dynamic = "force-dynamic";

type ProductDetailsRouteProps = {
  params: Promise<{ slug: string; productSlug: string }>;
};

function calcDiscount(price: number, compare: number | null) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

export default async function ProductDetailsRoute({ params }: ProductDetailsRouteProps) {
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

  const relatedProducts = await prisma.product.findMany({
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
  });

  const themeId = store.settings?.themeId;
  const isBold = themeId === "bold";

  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = calcDiscount(product.price, product.compareAtPrice);

  const gallery =
    product.images.length > 0
      ? [product.image, ...product.images.filter((img) => img !== product.image)]
      : [product.image];

  if (isBold) {
    return <BoldProductDetail store={store} product={product} gallery={gallery} relatedProducts={relatedProducts} hasDiscount={hasDiscount} discountPct={discountPct} />;
  }

  return <DefaultProductDetail store={store} product={product} gallery={gallery} relatedProducts={relatedProducts} hasDiscount={hasDiscount} discountPct={discountPct} />;
}

// ─── Shared types ─────────────────────────────────────────

type StoreInfo = { id: string; name: string; slug: string };
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
type ProductDetailProps = {
  store: StoreInfo;
  product: ProductInfo;
  gallery: string[];
  relatedProducts: RelatedProduct[];
  hasDiscount: boolean;
  discountPct: number;
};

// ─── Default Theme Product Page ───────────────────────────

function DefaultProductDetail({ store, product, gallery, relatedProducts, hasDiscount, discountPct }: ProductDetailProps) {
  return (
    <div className="min-h-screen" dir="rtl">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="-me-1 gap-1.5 px-2">
            <Link href={buildStoreUrl(store.slug)}>
              <ArrowRight className="size-4" />
              {store.name}
            </Link>
          </Button>
          <span>/</span>
          <Link
            href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}
            className="hover:text-foreground transition-colors"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground line-clamp-1 max-w-48">
            {product.name}
          </span>
        </nav>

        {/* Product Layout */}
        <div className="grid gap-10 lg:grid-cols-[1fr_480px]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery productName={product.name} mainImage={product.image} images={gallery} />
          </div>

          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <Tag className="size-3" />
                {product.category.name}
              </Badge>
              {hasDiscount && (
                <Badge className="rounded-full bg-red-500 px-3 py-1 text-white hover:bg-red-500">
                  خصم {discountPct}%
                </Badge>
              )}
              {product.isFeatured && (
                <Badge
                  className="rounded-full px-3 py-1"
                  style={{ background: "var(--store-primary)", color: "var(--store-primary-foreground)" }}
                >
                  منتج مميز
                </Badge>
              )}
              {product.brand && (
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {product.brand}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold leading-snug tracking-tight md:text-3xl">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold" style={{ color: "var(--store-primary)" }}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && product.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {product.description?.trim() && (
              <p className="text-sm leading-7 text-muted-foreground md:text-base">
                {product.description}
              </p>
            )}

            {((product.sizes ?? []).length > 0 || (product.colors ?? []).length > 0) && (
              <div className="space-y-4">
                {(product.sizes ?? []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">المقاسات</p>
                    <div className="flex flex-wrap gap-2">
                      {(product.sizes ?? []).map((size) => (
                        <Badge key={size} variant="outline" className="rounded-xl px-3 py-1">{size}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(product.colors ?? []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">الألوان</p>
                    <div className="flex flex-wrap gap-2">
                      {(product.colors ?? []).map((color) => (
                        <Badge key={color} variant="outline" className="rounded-xl px-3 py-1">{color}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${product.stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span className="text-sm text-muted-foreground">
                {product.stock > 0 ? `متوفر — ${product.stock} قطعة` : "نفد المخزون"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {product.stock > 0 ? (
                <>
                  <AddToCartButton size="lg" variant="default" storeSlug={store.slug} productId={product.id} />
                  <BuyNowButton storeSlug={store.slug} productId={product.id} />
                </>
              ) : (
                <Button size="lg" disabled className="w-full rounded-2xl text-base">غير متوفر حاليًا</Button>
              )}
            </div>

            <div className="rounded-2xl border bg-muted/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Package className="size-4" style={{ color: "var(--store-primary)" }} />
                <p className="font-semibold">تفاصيل المنتج</p>
              </div>
              <dl className="space-y-3 text-sm">
                {[
                  ["السعر", formatPrice(product.price)],
                  hasDiscount && product.compareAtPrice ? ["السعر الأصلي", formatPrice(product.compareAtPrice)] : null,
                  ["التصنيف", product.category.name],
                  product.brand ? ["البراند", product.brand] : null,
                  product.weight !== null ? ["الوزن", `${product.weight} كجم`] : null,
                ]
                  .filter((item): item is [string, string] => item !== null)
                  .map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">منتجات مشابهة</h2>
              <Link
                href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: "var(--store-primary)" }}
              >
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

// ─── Bold Theme Product Page ──────────────────────────────

function BoldProductDetail({ store, product, gallery, relatedProducts, hasDiscount, discountPct }: ProductDetailProps) {
  return (
    <div className="min-h-screen" dir="rtl">
      {/* Split-screen hero: image left (start in LTR) / info right */}
      <div className="lg:grid lg:min-h-[85vh] lg:grid-cols-[55%_45%]">
        {/* Image panel */}
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
        <div className="border-s px-6 py-12 sm:px-10 lg:overflow-y-auto lg:py-16" style={{ borderColor: "var(--store-border)" }}>
          {/* Breadcrumb */}
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href={buildStoreUrl(store.slug)} className="hover:text-foreground transition-colors">
              {store.name}
            </Link>
            <span>/</span>
            <Link
              href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}
              className="hover:text-foreground transition-colors"
            >
              {product.category.name}
            </Link>
          </nav>

          <div className="space-y-8">
            {/* Category + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60"
                style={{ color: "var(--store-primary)" }}
              >
                {product.category.name}
              </span>
              {hasDiscount && (
                <span className="bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  خصم {discountPct}%
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-4 border-y py-5" style={{ borderColor: "var(--store-border)" }}>
              <span className="text-4xl font-black" style={{ color: "var(--store-primary)" }}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && product.compareAtPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description?.trim() && (
              <p className="text-sm leading-7 text-muted-foreground">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {((product.sizes ?? []).length > 0 || (product.colors ?? []).length > 0) && (
              <div className="space-y-5">
                {(product.sizes ?? []).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest">المقاسات</p>
                    <div className="flex flex-wrap gap-2">
                      {(product.sizes ?? []).map((size) => (
                        <span
                          key={size}
                          className="border px-4 py-1.5 text-xs font-semibold"
                          style={{ borderColor: "var(--store-border)" }}
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(product.colors ?? []).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest">الألوان</p>
                    <div className="flex flex-wrap gap-2">
                      {(product.colors ?? []).map((color) => (
                        <span
                          key={color}
                          className="border px-4 py-1.5 text-xs font-semibold"
                          style={{ borderColor: "var(--store-border)" }}
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`size-1.5 rounded-full ${product.stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {product.stock > 0 ? "متوفر في المخزون" : "نفد المخزون"}
              </span>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {product.stock > 0 ? (
                <>
                  <AddToCartButton
                    size="lg"
                    storeSlug={store.slug}
                    productId={product.id}
                    className="flex-1 rounded-none border-2 border-black bg-black font-bold uppercase tracking-widest text-white hover:bg-transparent hover:text-black"
                  />
                  <BuyNowButton storeSlug={store.slug} productId={product.id} />
                </>
              ) : (
                <Button size="lg" disabled className="w-full rounded-none border-2 font-bold uppercase tracking-widest">
                  غير متوفر حاليًا
                </Button>
              )}
            </div>

            {/* Details table */}
            <div className="border-t pt-8" style={{ borderColor: "var(--store-border)" }}>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest">تفاصيل المنتج</p>
              <dl className="space-y-0">
                {[
                  ["السعر", formatPrice(product.price)],
                  hasDiscount && product.compareAtPrice ? ["السعر الأصلي", formatPrice(product.compareAtPrice)] : null,
                  ["التصنيف", product.category.name],
                  product.brand ? ["البراند", product.brand] : null,
                  product.weight !== null ? ["الوزن", `${product.weight} كجم`] : null,
                ]
                  .filter((item): item is [string, string] => item !== null)
                  .map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b py-3" style={{ borderColor: "var(--store-border)" }}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-xs font-semibold">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--store-border)" }}>
            <h2 className="text-2xl font-black uppercase tracking-tight">منتجات مشابهة</h2>
            <Link
              href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}
              className="mb-0.5 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ color: "var(--store-primary)" }}
            >
              عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {relatedProducts.map((item) => (
              <BoldProductCard key={item.id} product={item} storeSlug={store.slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
