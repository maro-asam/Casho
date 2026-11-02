"use client";

// One live picture of the cart for every card, the header and the basket bar,
// so the + on a card can turn into a counter without a page load. Taps update
// the picture at once and queue on the server in order; the next read from the
// server is always the truth.

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { AddToCartAction, GetCartItemsAction, RemoveCartItemAction, UpdateCartItemQtyAction } from "@/actions/store/cart.actions";
import { CART_UPDATED_EVENT, notifyCartUpdated } from "../../shared/cart-events";

type Line = { itemId: string | null; qty: number };
type Summary = { count: number; subtotal: number };

let lines = new Map<string, Line>();
let summary: Summary = { count: 0, subtotal: 0 };
const EMPTY: Summary = { count: 0, subtotal: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

let slug = "";
let queue: Promise<unknown> = Promise.resolve();
let inFlight = 0;
let loading = false;
let again = false;

/** Reads the cart unless taps are still on their way (the last tap reads it). */
export async function refreshCart() {
  if (!slug || inFlight > 0) return;
  if (loading) {
    again = true;
    return;
  }
  loading = true;
  try {
    const { items, summary: s } = await GetCartItemsAction(slug);
    if (inFlight === 0) {
      const next = new Map<string, Line>();
      for (const item of items) {
        const features = item.selectedFeatures as Record<string, string> | null;
        // Cards count the plain product; a chosen option belongs to the cart.
        if (!features || Object.keys(features).length === 0) next.set(item.product.id, { itemId: item.id, qty: item.quantity });
      }
      lines = next;
      summary = { count: items.reduce((t, i) => t + i.quantity, 0), subtotal: s.subtotal };
      emit();
    }
  } catch {
    // A failed read keeps what's on screen.
  } finally {
    loading = false;
    if (again) {
      again = false;
      refreshCart();
    }
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (listeners.size === 1) window.addEventListener(CART_UPDATED_EVENT, refreshCart);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) window.removeEventListener(CART_UPDATED_EVENT, refreshCart);
  };
}

function shift(productId: string, delta: number, price: number) {
  const line = lines.get(productId);
  const qty = (line?.qty ?? 0) + delta;
  const next = new Map(lines);
  if (qty > 0) next.set(productId, { itemId: line?.itemId ?? null, qty });
  else next.delete(productId);
  lines = next;
  summary = { count: Math.max(0, summary.count + delta), subtotal: Math.max(0, summary.subtotal + delta * price) };
  emit();
}

/** Runs one server change after the ones before it, then settles on the truth. */
function enqueue(run: () => Promise<{ ok: boolean; message?: string; added?: Parameters<typeof notifyCartUpdated>[0] }>, undo: () => void, onError: (message: string) => void) {
  inFlight++;
  queue = queue.then(async () => {
    try {
      const res = await run();
      if (!res.ok) {
        undo();
        onError(res.message ?? "حصلت مشكلة، حاول تاني");
      } else if (res.added) {
        notifyCartUpdated(res.added);
      }
    } catch {
      undo();
      onError("حصلت مشكلة، حاول تاني");
    } finally {
      inFlight--;
      if (inFlight === 0) await refreshCart();
    }
  });
}

/** Keeps the picture current for the whole store; mount it once (the header). */
export function useCartSync(storeSlug: string, path: string) {
  useEffect(() => {
    slug = storeSlug;
    refreshCart();
  }, [storeSlug, path]);
}

export function useCartSummary() {
  return useSyncExternalStore(
    subscribe,
    () => summary,
    () => EMPTY,
  );
}

/** The quantity of a plain product in the cart, and its + / − taps. */
export function useCartLine(storeSlug: string, product: { id: string; price: number }, onError: (message: string) => void) {
  const qty = useSyncExternalStore(
    subscribe,
    () => lines.get(product.id)?.qty ?? 0,
    () => 0,
  );

  const add = useCallback(() => {
    slug = storeSlug;
    shift(product.id, 1, product.price);
    enqueue(
      async () => {
        const itemId = lines.get(product.id)?.itemId;
        const res = itemId ? await UpdateCartItemQtyAction(itemId, storeSlug, "increment") : await AddToCartAction(storeSlug, product.id, undefined, 1);
        if (!res?.success) return { ok: false, message: res && "message" in res ? String(res.message ?? "") || undefined : undefined };
        return { ok: true, added: "added" in res ? (res.added as Parameters<typeof notifyCartUpdated>[0]) : undefined };
      },
      () => shift(product.id, -1, product.price),
      onError,
    );
  }, [storeSlug, product.id, product.price, onError]);

  const remove = useCallback(() => {
    const line = lines.get(product.id);
    if (!line) return;
    slug = storeSlug;
    const last = line.qty <= 1;
    shift(product.id, -1, product.price);
    enqueue(
      async () => {
        const itemId = line.itemId ?? lines.get(product.id)?.itemId;
        if (!itemId) return { ok: true };
        const res = last ? await RemoveCartItemAction(itemId, storeSlug) : await UpdateCartItemQtyAction(itemId, storeSlug, "decrement");
        return { ok: res?.success !== false, message: res && "message" in res ? String(res.message ?? "") || undefined : undefined };
      },
      () => shift(product.id, 1, product.price),
      onError,
    );
  }, [storeSlug, product.id, product.price, onError]);

  return { qty, add, remove };
}
