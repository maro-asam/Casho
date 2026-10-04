"use client";

import { useEffect, useState } from "react";

import { GetCartItemsAction } from "@/actions/store/cart.actions";
import { CART_UPDATED_EVENT } from "./cart-events";
import { useStorePath } from "./store-path";

/** Units in the shopper's cart; refreshes on navigation and on add-to-cart. */
export function useCartCount(storeSlug: string) {
  const [count, setCount] = useState(0);
  const path = useStorePath(storeSlug);

  useEffect(() => {
    let alive = true;
    const load = () =>
      GetCartItemsAction(storeSlug)
        .then(({ items }) => alive && setCount(items.reduce((t, i) => t + i.quantity, 0)))
        .catch(() => {});
    load();
    window.addEventListener(CART_UPDATED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(CART_UPDATED_EVENT, load);
    };
  }, [storeSlug, path]);

  return count;
}
