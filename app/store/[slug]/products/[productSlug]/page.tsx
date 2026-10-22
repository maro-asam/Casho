import { isStorefrontOpen } from "@/lib/subscriptions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { storePageMetadata } from "@/lib/seo/page-meta";
import { absoluteUrl, isPlaceholderImage, jsonLd, metaText, storeBaseUrl } from "@/lib/seo/store-seo";

import { getStorefrontTheme } from "../../_themes";
import type { BundleItem, WholesaleTier } from "../../_themes/types";
import { PRODUCT_CARD_SELECT, getStoreThemeId, toProductCards } from "../../_lib/storefront";
import { PixelEvent } from "../../_components/pixels/PixelEvent";
import { stockOf } from "@/lib/products/digital";

// ISR: revalidate every 120 seconds — product data (price, stock, description) changes occasionally
export const revalidate = 120;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, store: { select: { slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  console.log(`[ISR] generateStaticParams: pre-building ${products.length} product pages`);
  return products.map((p) => ({ slug: p.store.slug, productSlug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productSlug: string }> }): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug: productSlug, isActive: true, store: { slug } },
    select: {
      name: true,
      description: true,
      image: true,
      price: true,
      category: { select: { name: true } },
      store: { select: { name: true } },
    },
  });
  if (!product) return {};

  const price = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(product.price);
  // No description? Build a useful one instead of falling back to the store's.
  const description =
    metaText(product.description) ||
    `اشتري ${product.name} من ${product.store.name} بسعر ${price} جنيه${product.category ? ` — ${product.category.name}` : ""}. اطلب أونلاين والدفع عند الاستلام.`;

  return storePageMetadata({
    title: product.name,
    description,
    path: `/products/${productSlug}`,
    image: isPlaceholderImage(product.image) ? null : product.image,
    storeName: product.store.name,
  });
}

// ─── Route ────────────────────────────────────────────────────────────────────

type ProductDetailsRouteProps = {
  params: Promise<{ slug: string; productSlug: string }>;
};

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
      customDomain: true,
      customDomainStatus: true,
    },
  });

  if (!store || !isStorefrontOpen(store.subscriptionStatus)) {
    return notFound();
  }

  const product = await prisma.product.findFirst({
    where: { slug: productSlug, storeId: store.id, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) return notFound();

  const [reviews, relatedRows, shipping, themeId] = await Promise.all([
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
      take: 8,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      select: PRODUCT_CARD_SELECT,
    }),
    prisma.shippingMethod.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, price: true, estimatedDays: true },
    }),
    getStoreThemeId(slug),
  ]);

  const gallery = [...new Set([product.image, ...product.images].filter(Boolean))];
  const theme = getStorefrontTheme(themeId);

  // Structured data → price, stock and stars right in Google results.
  const base = storeBaseUrl(store);
  const productUrl = `${base}/products/${product.slug}`;
  const images = gallery.filter((src) => !isPlaceholderImage(src)).map((src) => absoluteUrl(src, base)).filter(Boolean);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      ...(images.length && { image: images }),
      ...(product.description && { description: metaText(product.description, 5000) }),
      ...(product.sku && { sku: product.sku }),
      ...(product.category && { category: product.category.name }),
      brand: { "@type": "Brand", name: store.name },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "EGP",
        price: product.price.toFixed(2),
        availability: stockOf(product) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: store.name },
      },
      ...(reviews.length > 0 && {
        aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length },
        review: reviews.slice(0, 5).map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.customerName },
          datePublished: r.reviewDate.toISOString().slice(0, 10),
          reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
          reviewBody: r.content,
        })),
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: store.name, item: base },
        ...(product.category
          ? [{ "@type": "ListItem", position: 2, name: product.category.name, item: `${base}/categories/${product.category.slug}` }]
          : []),
        { "@type": "ListItem", position: product.category ? 3 : 2, name: product.name, item: productUrl },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <PixelEvent
        name="ViewContent"
        payload={{
          value: product.price,
          currency: "EGP",
          contents: [{ id: product.id, quantity: 1, price: product.price, name: product.name }],
        }}
      />
      <theme.Product
        store={{ id: store.id, name: store.name, slug: store.slug }}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          gallery,
          description: product.description,
          brand: product.brand,
          sku: product.sku,
          weight: product.weight,
          stock: stockOf(product),
          isFeatured: product.isFeatured,
          sizes: product.sizes,
          colors: product.colors,
          wholesaleOptions: (product.wholesaleOptions as WholesaleTier[] | null) ?? null,
          type: product.type,
          bundleItems: Array.isArray(product.bundleItems) ? (product.bundleItems as BundleItem[]) : null,
          category: product.category,
        }}
        reviews={reviews}
        related={await toProductCards(relatedRows)}
        shipping={shipping}
      />
    </>
  );
}
