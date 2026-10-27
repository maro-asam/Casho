import type { Metadata } from "next";

import { GetCartItemsAction } from "@/actions/store/cart.actions";
import { getCartCrossSells } from "@/lib/offers/storefront-offers";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId, getStorefrontClosure } from "../_lib/storefront";
import { CartOffers } from "../_components/offers/CartOffers";

export const metadata: Metadata = { title: "السلة", robots: { index: false, follow: false } };

export default async function CartPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ couponStatus?: string; couponMessage?: string; stock?: string }>;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : undefined;

  const [cart, themeId] = await Promise.all([GetCartItemsAction(slug), getStoreThemeId(slug)]);
  const theme = getStorefrontTheme(themeId);

  const closure = await getStorefrontClosure(cart.store.id);
  if (closure) return <theme.StoreClosed storeSlug={slug} pause={closure.pause} />;

  // Cross-sells for what the shopper picked (offer lines don't trigger more offers).
  const anchors = cart.items.filter((i) => !i.offer || i.offer.type === "UPSELL").map((i) => i.productId);
  const crossSells = await getCartCrossSells(cart.store.id, [...new Set(anchors)]).catch(() => []);

  return (
    <>
      <theme.Cart
        storeSlug={slug}
        cart={cart}
        notice={{
          couponStatus: query?.couponStatus,
          couponMessage: query?.couponMessage,
          stockChanged: query?.stock === "changed",
        }}
      />
      <CartOffers storeSlug={slug} offers={crossSells} />
    </>
  );
}
