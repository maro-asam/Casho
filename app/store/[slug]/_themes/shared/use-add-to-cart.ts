"use client";

import { useCallback, useTransition } from "react";

import { AddToCartAction } from "@/actions/store/cart.actions";
import { notifyCartUpdated } from "./cart-events";

type Result = { ok: true } | { ok: false; message: string };

/** Adds to the cart through the store action and refreshes cart badges.
 *  Themes decide the feedback (toast, drawer, inline state). */
export function useAddToCart(storeSlug: string) {
  const [pending, start] = useTransition();

  const add = useCallback(
    (productId: string, features?: Record<string, string>, qty = 1) =>
      new Promise<Result>((resolve) => {
        start(async () => {
          try {
            const res = await AddToCartAction(storeSlug, productId, features && Object.keys(features).length ? features : undefined, qty);
            if (res?.success) {
              notifyCartUpdated("added" in res ? res.added : undefined);
              resolve({ ok: true });
            } else {
              resolve({ ok: false, message: res && "message" in res && res.message ? res.message : "حصلت مشكلة، حاول تاني" });
            }
          } catch {
            resolve({ ok: false, message: "حصلت مشكلة، حاول تاني" });
          }
        });
      }),
    [storeSlug],
  );

  return { add, pending };
}
