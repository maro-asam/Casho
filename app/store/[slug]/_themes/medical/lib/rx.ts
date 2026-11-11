// WhatsApp hand-offs for pharmacy flows. Casho has no prescription upload,
// so the shopper sends the photo in the store's own WhatsApp chat — the
// message is pre-written, the shopper only attaches the photo.
//
// The pharmacy features are a Studio switch (`layout.pharmacy`): a store that
// isn't medical keeps the theme, and the prescription hand-offs become a plain
// "ask us on WhatsApp".

import type { ThemeLayout } from "@/types/store-theme.types";

/** Pharmacy features on? Missing = on (stores that picked the theme before the switch). */
export const pharmacyOn = (layout: Pick<ThemeLayout, "pharmacy"> | null | undefined) => layout?.pharmacy !== false;

/** wa.me link with a pre-written message. */
export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(text)}`;
}

export const RX_MESSAGE = "السلام عليكم، عايز أطلب روشتة. هبعت صورتها في الرسالة الجاية.";
export const ASK_MESSAGE = "السلام عليكم، عندي استفسار.";

/** Copy for the WhatsApp cards: a prescription in a pharmacy, a question otherwise. */
export const HANDOFF = {
  rx: {
    message: RX_MESSAGE,
    title: "عندك روشتة؟",
    body: "صوّرها وابعتها على واتساب المتجر، واسأل عن المتاح والسعر قبل ما تطلب.",
    cta: "ابعت الروشتة",
  },
  ask: {
    message: ASK_MESSAGE,
    title: "عندك سؤال؟",
    body: "كلّمنا على واتساب المتجر، واسأل عن المتاح والسعر قبل ما تطلب.",
    cta: "كلّمنا واتساب",
  },
} as const;

export function askAboutMessage(productName: string) {
  return `السلام عليكم، عندي استفسار عن: ${productName}`;
}
