"use client";

import { useOptionalStoreTheme } from "../../../_context/StoreThemeContext";
import { st } from "@/lib/i18n/storefront";

/** The game card's promise, true to the store's setting: charged to the
 *  player's account (player ID on), or simply delivered (codes, gift cards). */
export default function AccountNote() {
  const askPlayer = useOptionalStoreTheme()?.layout.playerId !== false;
  return <>{askPlayer ? st("بيتشحن على حسابك بعد تأكيد الطلب") : st("بيوصلك بعد تأكيد الطلب")}</>;
}
