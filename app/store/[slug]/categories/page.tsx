import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { storePageMetadata } from "@/lib/seo/page-meta";
import { prisma } from "@/lib/prisma";
import { getStorefrontTheme } from "../_themes";
import { getStoreCategoryLinks, getStoreThemeId, getStorefrontClosure } from "../_lib/storefront";
import { st } from "@/lib/i18n/storefront";
import { loadStoreLocale } from "@/lib/i18n/storefront/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await loadStoreLocale(slug);
  const store = await prisma.store.findUnique({ where: { slug }, select: { name: true } });
  return storePageMetadata({
    title: st("التصنيفات"),
    description: store ? st("تصفّح كل تصنيفات {0}.", store.name) : undefined,
    path: "/categories",
    storeName: store?.name,
  });
}

export default async function StoreCategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await loadStoreLocale(slug);

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

  return <theme.CategoriesIndex store={{ name: store.name, slug: store.slug }} categories={categories} />;
}
