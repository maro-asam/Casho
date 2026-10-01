import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, isPlaceholderImage, storeBaseUrl, storeSlugFromHost } from "@/lib/seo/store-seo";

const BASE_URL = process.env.APP_URL || "https://casho.store";

/** A store's own sitemap: home, listings, every active product and category. */
async function storeSitemap(slug: string): Promise<MetadataRoute.Sitemap | null> {
  const store = await prisma.store
    .findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        customDomainStatus: true,
        settings: { select: { isIndexed: true, updatedAt: true } },
      },
    })
    .catch(() => null);
  if (!store) return null;
  if (store.settings?.isIndexed === false) return [];

  const base = storeBaseUrl(store);
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, isActive: true },
      select: { slug: true, updatedAt: true, image: true, images: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.category.findMany({
      where: { storeId: store.id, products: { some: { isActive: true } } },
      select: { slug: true, createdAt: true },
    }),
  ]);

  const lastProductUpdate = products[0]?.updatedAt ?? store.settings?.updatedAt ?? new Date();

  return [
    { url: base, lastModified: lastProductUpdate, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: lastProductUpdate, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.4 },
    ...categories.map((c) => ({
      url: `${base}/categories/${c.slug}`,
      lastModified: c.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: [p.image, ...p.images]
        .filter((src) => !isPlaceholderImage(src))
        .slice(0, 5)
        .map((src) => absoluteUrl(src, base)!)
        .filter(Boolean),
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const storeSlug = await storeSlugFromHost(h.get("x-forwarded-host") ?? h.get("host"));
  if (storeSlug) {
    const map = await storeSitemap(storeSlug);
    if (map) return map;
  }

  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
