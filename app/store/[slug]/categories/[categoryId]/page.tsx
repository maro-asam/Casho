import type { Metadata } from "next";
import { storePageMetadata } from "@/lib/seo/page-meta";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getStorefrontTheme } from "../../_themes";
import { PRODUCT_CARD_SELECT, getStoreCategoryLinks, getStoreThemeId, toProductCards, getStorefrontClosure } from "../../_lib/storefront";

// ISR: revalidate every 300 seconds — category product lists change infrequently
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: { slug: true, store: { select: { slug: true } } },
    take: 500,
  });
  console.log(`[ISR] generateStaticParams: pre-building ${categories.length} category pages`);
  return categories.map((c) => ({ slug: c.store.slug, categoryId: c.slug }));
}

type PageProps = {
  params: Promise<{
    slug: string;
    categoryId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, categoryId } = await params;
  const category = await prisma.category.findFirst({
    where: { slug: categoryId, store: { slug } },
    select: { name: true, image: true, store: { select: { name: true } }, _count: { select: { products: { where: { isActive: true } } } } },
  });
  if (!category) return {};
  return storePageMetadata({
    title: category.name,
    description: `تسوّق ${category.name} من ${category.store.name} — ${new Intl.NumberFormat("ar-EG").format(category._count.products)} منتج، اطلب أونلاين بسهولة.`,
    path: `/categories/${categoryId}`,
    image: category.image,
    storeName: category.store.name,
  });
}

export default async function CategoryProducts({ params }: PageProps) {
  const { slug, categoryId } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!store) return notFound();

  const theme = getStorefrontTheme(await getStoreThemeId(slug));

  const closure = await getStorefrontClosure(store.id);
  if (closure) {
    return <theme.StoreClosed storeSlug={store.slug} pause={closure.pause} />;
  }

  const categories = await getStoreCategoryLinks(store.id);
  const category = categories.find((c) => c.slug === categoryId);
  if (!category) return notFound();

  const rows = await prisma.product.findMany({
    where: { storeId: store.id, categoryId: category.id, isActive: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: PRODUCT_CARD_SELECT,
  });

  return (
    <theme.Category
      store={{ name: store.name, slug: store.slug }}
      category={category}
      products={await toProductCards(rows)}
      otherCategories={categories.filter((c) => c.id !== category.id && c.productCount > 0)}
    />
  );
}
