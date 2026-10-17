"use client";

// Sends one commerce event to every pixel the storefront loaded (Meta, TikTok,
// Snap), each in its own vocabulary. Events fired before the pixels are
// installed wait in a small queue (see StorePixels).

import type { PixelEventName, PixelEventPayload } from "@/lib/pixels/shared";

type PixelFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: PixelFn;
    ttq?: { track: PixelFn; page: PixelFn };
    snaptr?: PixelFn;
  }
}

const TIKTOK_NAMES: Record<PixelEventName, string | null> = {
  PageView: null, // ttq.page()
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
};

const SNAP_NAMES: Record<PixelEventName, string> = {
  PageView: "PAGE_VIEW",
  ViewContent: "VIEW_CONTENT",
  AddToCart: "ADD_CART",
  InitiateCheckout: "START_CHECKOUT",
  Purchase: "PURCHASE",
};

let installed = false;
const pending: [PixelEventName, PixelEventPayload][] = [];

/** Called by StorePixels once the pixel stubs exist. */
export function markPixelsInstalled() {
  installed = true;
  for (const [name, payload] of pending.splice(0)) send(name, payload);
}

export function trackPixelEvent(name: PixelEventName, payload: PixelEventPayload = {}) {
  if (typeof window === "undefined") return;
  if (!installed) {
    // Stores without pixels never install — keep the queue bounded.
    if (pending.length < 50) pending.push([name, payload]);
    return;
  }
  send(name, payload);
}

function send(name: PixelEventName, p: PixelEventPayload) {
  const contents = p.contents ?? [];
  const currency = p.currency ?? "EGP";
  const numItems = contents.reduce((sum, c) => sum + c.quantity, 0);

  try {
    if (window.fbq) {
      const data =
        name === "PageView"
          ? {}
          : {
              currency,
              value: p.value,
              content_type: "product",
              content_ids: contents.map((c) => c.id),
              contents: contents.map((c) => ({ id: c.id, quantity: c.quantity, item_price: c.price })),
              ...(numItems && { num_items: numItems }),
              ...(p.orderId && { order_id: p.orderId }),
            };
      if (p.eventId) window.fbq("track", name, data, { eventID: p.eventId });
      else window.fbq("track", name, data);
    }
  } catch {
    // a broken pixel must never break the store
  }

  try {
    if (window.ttq) {
      const ttName = TIKTOK_NAMES[name];
      if (!ttName) window.ttq.page();
      else
        window.ttq.track(
          ttName,
          {
            currency,
            value: p.value,
            content_type: "product",
            contents: contents.map((c) => ({ content_id: c.id, quantity: c.quantity, price: c.price, content_name: c.name })),
            ...(p.orderId && { order_id: p.orderId }),
          },
          p.eventId ? { event_id: p.eventId } : undefined,
        );
    }
  } catch {
    // ignore
  }

  try {
    if (window.snaptr) {
      window.snaptr(
        "track",
        SNAP_NAMES[name],
        name === "PageView"
          ? {}
          : {
              currency,
              price: p.value,
              item_ids: contents.map((c) => c.id),
              ...(numItems && { number_items: numItems }),
              ...(p.orderId && { transaction_id: p.orderId }),
              ...(p.eventId && { client_dedup_id: p.eventId }),
            },
      );
    }
  } catch {
    // ignore
  }
}
