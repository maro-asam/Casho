import { isStorefrontOpen } from "@/lib/subscriptions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { storePageMetadata } from "@/lib/seo/page-meta";
import { prisma } from "@/lib/prisma";
import { orderNumber, parseOrderCode, verifyOrderTrackToken } from "@/lib/orders/tracking";
import { loadTrackedOrder } from "@/lib/orders/track-order";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId } from "../_lib/storefront";

type TrackRouteProps = {
  params: Promise<{ slug: string }>;
  /** `order`: pre-fills the search · `o` + `t`: signed link from an email / WhatsApp. */
  searchParams: Promise<{ order?: string; o?: string; t?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return storePageMetadata({ title: "تتبّع طلبك", path: "/track", noindex: true });
}

export default async function TrackOrderRoute({ params, searchParams }: TrackRouteProps) {
  const { slug } = await params;
  const query = await searchParams;
  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, subscriptionStatus: true, settings: { select: { whatsappNumber: true } } },
  });
  if (!store) return notFound();

  const theme = getStorefrontTheme(await getStoreThemeId(slug));
  if (!isStorefrontOpen(store.subscriptionStatus)) return <theme.StoreClosed storeSlug={store.slug} />;

  const linked = typeof query.o === "string" && parseOrderCode(query.o)?.kind === "id" ? query.o : null;
  const signed = linked && verifyOrderTrackToken(linked, query.t) ? linked : null;
  const order = signed ? await loadTrackedOrder(store.id, signed) : null;
  const typed = typeof query.order === "string" ? query.order.replace(/[^0-9a-zA-Z#-]/g, "").slice(0, 40) : "";

  return (
    <theme.Track
      store={{ name: store.name, slug: store.slug }}
      whatsapp={store.settings?.whatsappNumber ?? null}
      // A link whose token no longer verifies (secret rotated) still pre-fills the search.
      initialCode={typed || (linked ? orderNumber(linked).slice(1) : "")}
      order={order}
    />
  );
}
