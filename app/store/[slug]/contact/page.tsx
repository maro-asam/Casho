import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { storePageMetadata } from "@/lib/seo/page-meta";
import { prisma } from "@/lib/prisma";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId, getStorefrontClosure } from "../_lib/storefront";
import { st } from "@/lib/i18n/storefront";
import { loadStoreLocale } from "@/lib/i18n/storefront/server";

type StoreContactRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await loadStoreLocale(slug);
  const store = await prisma.store.findUnique({ where: { slug }, select: { name: true } });
  return storePageMetadata({
    title: st("تواصل معنا"),
    description: store ? st("تواصل مع {0} — واتساب وسوشيال ميديا.", store.name) : undefined,
    path: "/contact",
    storeName: store?.name,
  });
}

export default async function StoreContactRoute({ params }: StoreContactRouteProps) {
  const { slug } = await params;
  await loadStoreLocale(slug);
  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: { select: { email: true, whatsappNumber: true, instagram: true, facebook: true, tiktok: true } },
    },
  });
  if (!store) return notFound();

  const theme = getStorefrontTheme(await getStoreThemeId(slug));
  const closure = await getStorefrontClosure(store.id);
  if (closure) return <theme.StoreClosed storeSlug={store.slug} pause={closure.pause} />;

  const s = store.settings;
  return (
    <theme.Contact
      store={{ name: store.name, slug: store.slug }}
      contact={{
          email: s?.email ?? null,
          whatsapp: s?.whatsappNumber ?? null,
          instagram: s?.instagram ?? null,
          facebook: s?.facebook ?? null,
          tiktok: s?.tiktok ?? null,
        }}
    />
  );
}
