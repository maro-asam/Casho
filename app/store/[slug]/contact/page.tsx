import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { storePageMetadata } from "@/lib/seo/page-meta";
import { prisma } from "@/lib/prisma";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId, getStorefrontClosure } from "../_lib/storefront";

type StoreContactRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug }, select: { name: true } });
  return storePageMetadata({
    title: "تواصل معنا",
    description: store ? `تواصل مع ${store.name} — واتساب وسوشيال ميديا.` : undefined,
    path: "/contact",
    storeName: store?.name,
  });
}

export default async function StoreContactRoute({ params }: StoreContactRouteProps) {
  const { slug } = await params;
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
