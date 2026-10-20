import type { Prisma } from "@prisma/client";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import type { BannerFormContext, EditableBanner } from "../_components/banner-form";

/** Everything the new / edit pages need besides the banner itself; `null` when the user has no store. */
export async function loadBannerFormContext(userId: string): Promise<BannerFormContext | null> {
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, settings: { select: { whatsappNumber: true } } },
  });
  if (!store) return null;

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return {
    storeId: store.id,
    storefrontUrl: buildStoreUrl(store.slug),
    categories,
    whatsapp: store.settings?.whatsappNumber ?? null,
  };
}

const editableBannerSelect = {
  id: true,
  title: true,
  subtitle: true,
  ctaLabel: true,
  image: true,
  mobileImage: true,
  isActive: true,
  linkType: true,
  linkCategoryId: true,
  linkValue: true,
  openInNewTab: true,
  startsAt: true,
  endsAt: true,
  linkProduct: { select: { id: true, name: true, slug: true, image: true, isActive: true } },
} satisfies Prisma.BannerSelect;

/** The store's banner in the shape the form edits (dates as ISO strings for the client). */
export async function loadEditableBanner(storeId: string, bannerId: string): Promise<EditableBanner | null> {
  const row = await prisma.banner.findFirst({ where: { id: bannerId, storeId }, select: editableBannerSelect });
  if (!row) return null;
  return { ...row, startsAt: row.startsAt?.toISOString() ?? null, endsAt: row.endsAt?.toISOString() ?? null };
}
