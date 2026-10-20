import { isStorefrontOpen } from "@/lib/subscriptions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { storePageMetadata } from "@/lib/seo/page-meta";
import { prisma } from "@/lib/prisma";
import { withStudioDraft } from "@/lib/studio/storefront-draft";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId } from "../_lib/storefront";

type AboutStoreRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug }, select: { name: true } });
  return storePageMetadata({
    title: "من نحن",
    description: store ? `تعرّف على ${store.name} وطرق التواصل معانا.` : undefined,
    path: "/about",
    storeName: store?.name,
  });
}

export default async function AboutStoreRoute({ params }: AboutStoreRouteProps) {
  const { slug } = await params;
  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionStatus: true,
      settings: { select: { logo: true, coverImage: true, description: true, email: true, whatsappNumber: true, instagram: true, facebook: true, tiktok: true } },
      _count: { select: { categories: true, products: { where: { isActive: true } } } },
    },
  });
  if (!store) return notFound();
  store.settings = await withStudioDraft(store.id, store.settings);

  const theme = getStorefrontTheme(await getStoreThemeId(slug));
  if (!isStorefrontOpen(store.subscriptionStatus)) return <theme.StoreClosed storeSlug={store.slug} />;

  const s = store.settings;
  return (
    <theme.About
      store={{ name: store.name, slug: store.slug }}
      logo={s?.logo ?? null}
      coverImage={s?.coverImage ?? null}
      description={s?.description ?? null}
      contact={{
          email: s?.email ?? null,
          whatsapp: s?.whatsappNumber ?? null,
          instagram: s?.instagram ?? null,
          facebook: s?.facebook ?? null,
          tiktok: s?.tiktok ?? null,
        }}
      productCount={store._count.products}
      categoryCount={store._count.categories}
    />
  );
}
