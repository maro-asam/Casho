// WhatsApp hand-offs for pharmacy flows. Casho has no prescription upload,
// so the shopper sends the photo in the store's own WhatsApp chat — the
// message is pre-written, the shopper only attaches the photo.
//
// The pharmacy features are a Studio switch (`layout.pharmacy`): a store that
// isn't medical keeps the theme, and the prescription hand-offs become a plain
// "ask us on WhatsApp".

import type { ThemeLayout } from "@/types/store-theme.types";
import { st } from "@/lib/i18n/storefront";

/** Pharmacy features on? Missing = on (stores that picked the theme before the switch). */
export const pharmacyOn = (layout: Pick<ThemeLayout, "pharmacy"> | null | undefined) => layout?.pharmacy !== false;

/** wa.me link with a pre-written message (Arabic source text is translated to the store language). */
export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(st(text))}`;
}

// Arabic source text — waWith() translates it to the store language. i18n-ignore
export const RX_MESSAGE = "السلام عليكم، عايز أطلب روشتة. هبعت صورتها في الرسالة الجاية.";
export const ASK_MESSAGE = "السلام عليكم، عندي استفسار.";

/** Copy for the WhatsApp cards: a prescription in a pharmacy, a question otherwise. */
export const HANDOFF = {
  rx: {
    message: RX_MESSAGE,
    get title() { return st("عندك روشتة؟"); },
    get body() { return st("صوّرها وابعتها على واتساب المتجر، واسأل عن المتاح والسعر قبل ما تطلب."); },
    get cta() { return st("ابعت الروشتة"); },
  },
  ask: {
    message: ASK_MESSAGE,
    get title() { return st("عندك سؤال؟"); },
    get body() { return st("كلّمنا على واتساب المتجر، واسأل عن المتاح والسعر قبل ما تطلب."); },
    get cta() { return st("كلّمنا واتساب"); },
  },
} as const;

export function askAboutMessage(productName: string) {
  return st("السلام عليكم، عندي استفسار عن: {0}", productName);
}
