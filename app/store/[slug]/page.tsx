import type { Metadata } from "next";
import { absoluteUrl, jsonLd, metaText, storeBaseUrl } from "@/lib/seo/store-seo";
import { prisma } from "@/lib/prisma";
import { withStudioDraft } from "@/lib/studio/storefront-draft";
import { notFound } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { getStorefrontTheme } from "./_themes";
import { PRODUCT_CARD_SELECT, getStoreCategoryLinks, liveBannersQuery, toBannerData, toProductCards, getStorefrontClosure } from "./_lib/storefront";
import { resolveStoreTheme } from "@/constants/store-themes";
import type { ThemeCustomization } from "@/types/store-theme.types";

// ISR: revalidate every 60 seconds — store home content changes infrequently
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const stores = await prisma.store.findMany({
    where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
    select: { slug: true },
    take: 200,
  });
  console.log(`[ISR] generateStaticParams: pre-building ${stores.length} store home pages`);
  return stores.map((s) => ({ slug: s.slug }));
}

type StoreHomeRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  // Title/description come from the layout (store SEO settings); just pin the canonical.
  return { alternates: { canonical: "/" }, openGraph: { url: "/" } };
}

/** Homepage structured data: the store as an online business + its site (sitelinks search box). */
async function StoreJsonLd({ slug }: { slug: string }) {
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      settings: { select: { logo: true, seoDescription: true, description: true, instagram: true, facebook: true, tiktok: true, whatsappNumber: true, email: true } },
    },
  });
  if (!store) return null;
  const base = storeBaseUrl(store);
  const s = store.settings;
  const sameAs = [s?.instagram, s?.facebook, s?.tiktok].filter((v): v is string => Boolean(v && /^https?:\/\//.test(v)));
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: store.name,
      url: base,
      ...(s?.logo && { logo: absoluteUrl(s.logo, base) }),
      ...((s?.seoDescription || s?.description) && { description: metaText(s?.seoDescription || s?.description, 300) }),
      ...(sameAs.length && { sameAs }),
      ...((s?.whatsappNumber || s?.email) && {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          ...(s?.whatsappNumber && { telephone: s.whatsappNumber }),
          ...(s?.email && { email: s.email }),
          areaServed: "EG",
          availableLanguage: ["ar"],
        },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: store.name,
      url: base,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${base}/products?search={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}

export default async function StoreHomeRoute({ params }: StoreHomeRouteProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: {
        select: {
          themeId: true,
          description: true,
          primaryColor: true,
          secondaryColor: true,
          themeConfig: true,
          storeLanguage: true,
          whatsappNumber: true,
        },
      },
      banners: liveBannersQuery(),
    },
  });

  if (!store) return notFound();
  store.settings = await withStudioDraft(store.id, store.settings);

  // ── Resolve theme + sections ──────────────────────────────────────────────
  const themeConfig = store.settings?.themeConfig as ThemeCustomization | null;
  const resolvedTheme = resolveStoreTheme(
    themeConfig?.presetId ?? store.settings?.themeId,
    themeConfig,
    store.settings?.primaryColor,
    store.settings?.secondaryColor,
  );
  const theme = getStorefrontTheme(resolvedTheme.id);
  const sections = resolvedTheme.sections.home;
  const sectionContent = resolvedTheme.sectionContent;

  const closure = await getStorefrontClosure(store.id);
  if (closure) {
    return <theme.StoreClosed storeSlug={store.slug} pause={closure.pause} />;
  }

  const activeProducts = { storeId: store.id, isActive: true };

  const [categories, featuredRows, latestRows, bestSellerRows] = await Promise.all([
    getStoreCategoryLinks(store.id),
    prisma.product.findMany({
      where: { ...activeProducts, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: PRODUCT_CARD_SELECT,
    }),
    prisma.product.findMany({
      where: activeProducts,
      orderBy: { createdAt: "desc" },
      take: 16,
      select: PRODUCT_CARD_SELECT,
    }),
    sections.showBestSellers ? getBestSellerRows(store.id, sectionContent.bestSellers?.maxProducts ?? 8) : [],
  ]);

  // "New arrivals" shouldn't repeat the featured row — unless that leaves too little to show.
  const featuredIds = new Set(sections.showFeaturedProducts ? featuredRows.map((p) => p.id) : []);
  const freshRows = latestRows.filter((p) => !featuredIds.has(p.id));
  const latestShown = (freshRows.length >= 4 ? freshRows : latestRows).slice(0, 8);

  const [featured, latest, bestSellers] = await Promise.all([
    toProductCards(featuredRows),
    toProductCards(latestShown),
    toProductCards(bestSellerRows),
  ]);

  return (
    <>
      <StoreJsonLd slug={slug} />
      <theme.Home
        store={{ id: store.id, name: store.name, slug: store.slug, description: store.settings?.description ?? null }}
        dir={store.settings?.storeLanguage === "en" ? "ltr" : "rtl"}
        banners={toBannerData(store.banners, store.settings?.whatsappNumber)}
        categories={categories}
        featured={featured}
        latest={latest}
        bestSellers={bestSellers}
        sections={sections}
        sectionContent={sectionContent}
        layout={resolvedTheme.layout}
        whatsapp={store.settings?.whatsappNumber ?? null}
      />
    </>
  );
}

/** Top-selling active products, ordered by units sold. */
async function getBestSellerRows(storeId: string, take: number) {
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { storeId } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take,
  });
  if (top.length === 0) return [];
  const ids = top.map((t) => t.productId);
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: PRODUCT_CARD_SELECT,
  });
  return ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is (typeof rows)[number] => !!r);
}
