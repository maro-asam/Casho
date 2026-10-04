"use server";

// Form actions for the cart page. Themes bind these to their forms
// (e.g. `changeQtyAction.bind(null, slug, item.id, "increment")`) so the
// view layer stays free of business logic.

import { redirect } from "next/navigation";

import {
  ApplyCouponAction,
  RemoveCartItemAction,
  RemoveCouponAction,
  SelectShippingMethodAction,
  UpdateCartItemQtyAction,
} from "@/actions/store/cart.actions";
import { ApplyLoyaltyPointsAction, RemoveLoyaltyPointsAction } from "@/actions/store/loyalty.actions";
import { GetGuestSessionId } from "@/actions/session/guest.actions";

export async function changeQtyAction(storeSlug: string, itemId: string, type: "increment" | "decrement") {
  await UpdateCartItemQtyAction(itemId, storeSlug, type);
}

export async function removeItemAction(storeSlug: string, itemId: string) {
  await RemoveCartItemAction(itemId, storeSlug);
}

export async function selectShippingAction(storeSlug: string, methodId: string) {
  await SelectShippingMethodAction(storeSlug, methodId);
}

export async function applyCouponAction(storeSlug: string, formData: FormData) {
  const result = await ApplyCouponAction(storeSlug, formData);
  // Surface the outcome — invalid / expired codes used to fail silently.
  const params = new URLSearchParams({
    couponStatus: result.success ? "success" : "error",
    couponMessage: (result.success ? result.message : result.error) ?? "",
  });
  redirect(`/store/${storeSlug}/cart?${params.toString()}`);
}

export async function removeCouponAction(storeSlug: string) {
  await RemoveCouponAction(storeSlug);
}

export async function applyLoyaltyAction(storeSlug: string, formData: FormData) {
  const phone = String(formData.get("loyaltyPhone") ?? "");
  const points = Number(formData.get("loyaltyPoints") ?? 0);
  const guestSessionId = await GetGuestSessionId();
  await ApplyLoyaltyPointsAction(phone, points, guestSessionId ?? "", storeSlug);
}

export async function removeLoyaltyAction(storeSlug: string) {
  const guestSessionId = await GetGuestSessionId();
  await RemoveLoyaltyPointsAction(guestSessionId ?? "", storeSlug);
}
