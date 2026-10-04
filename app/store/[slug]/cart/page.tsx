import type { Metadata } from "next";

import { GetCartItemsAction } from "@/actions/store/cart.actions";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId } from "../_lib/storefront";

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

  return (
    <theme.Cart
      storeSlug={slug}
      cart={cart}
      notice={{
        couponStatus: query?.couponStatus,
        couponMessage: query?.couponMessage,
        stockChanged: query?.stock === "changed",
      }}
    />
  );
}
