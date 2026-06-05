"use server";

import { createMetaEventId, sendMetaCapiEvent } from "@/lib/meta-capi";
import { getMetaRequestContext } from "@/lib/meta-request";

// ─── Purchase ─────────────────────────────────────────────────────────────────

type TrackPurchaseItem = {
  productId: string;
  quantity: number;
  price: number;
};

type TrackPurchaseInput = {
  orderId: string;
  storeId: string;
  storeSlug?: string | null;
  total: number;
  currency?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerFirstName?: string | null;
  customerLastName?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerCountry?: string | null;
  customerZipCode?: string | null;
  items: TrackPurchaseItem[];
};

export async function TrackPurchaseAction(input: TrackPurchaseInput) {
  try {
    if (!input.orderId || !input.storeId) {
      return { success: false, message: "Missing orderId or storeId" };
    }

    const { ip, userAgent, eventSourceUrl, fbp, fbc } = await getMetaRequestContext();
    const eventId = createMetaEventId(`purchase_${input.orderId}`);

    const result = await sendMetaCapiEvent({
      eventName: "Purchase",
      eventId,
      eventSourceUrl,
      ip,
      userAgent,
      fbp,
      fbc,
      email: input.customerEmail,
      phone: input.customerPhone,
      firstName: input.customerFirstName,
      lastName: input.customerLastName,
      city: input.customerCity,
      state: input.customerState,
      country: input.customerCountry,
      zipCode: input.customerZipCode,
      customData: {
        currency: input.currency || "EGP",
        value: input.total,
        order_id: input.orderId,
        store_id: input.storeId,
        store_slug: input.storeSlug || undefined,
        content_type: "product",
        content_ids: input.items.map((item) => item.productId),
        contents: input.items.map((item) => ({
          id: item.productId,
          quantity: item.quantity,
          item_price: item.price,
        })),
        num_items: input.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });

    return { success: result.ok, eventId };
  } catch (error) {
    console.error("TrackPurchaseAction error:", error);
    return { success: false, message: "Failed to track purchase" };
  }
}

// ─── Registration ─────────────────────────────────────────────────────────────

type TrackStoreRegistrationInput = {
  storeId: string;
  storeSlug?: string | null;
  storeName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userName?: string | null;
};

export async function TrackStoreRegistrationAction(input: TrackStoreRegistrationInput) {
  try {
    if (!input.storeId) return { success: false, message: "Missing storeId" };

    const { ip, userAgent, eventSourceUrl, fbp, fbc } = await getMetaRequestContext();

    const customData = {
      store_id: input.storeId,
      store_slug: input.storeSlug || undefined,
      store_name: input.storeName || undefined,
    };

    const userData = {
      email: input.userEmail,
      phone: input.userPhone,
      firstName: input.userName,
    };

    const result = await sendMetaCapiEvent({
      eventName: "CompleteRegistration",
      eventSourceUrl,
      ip,
      userAgent,
      fbp,
      fbc,
      ...userData,
      customData,
    });

    await sendMetaCapiEvent({
      eventName: "Lead",
      eventSourceUrl,
      ip,
      userAgent,
      fbp,
      fbc,
      ...userData,
      customData,
    });

    return { success: result.ok };
  } catch (error) {
    console.error("TrackStoreRegistrationAction error:", error);
    return { success: false, message: "Failed to track registration" };
  }
}
