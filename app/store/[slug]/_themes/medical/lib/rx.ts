// WhatsApp hand-offs for pharmacy flows. Casho has no prescription upload,
// so the shopper sends the photo in the store's own WhatsApp chat — the
// message is pre-written, the shopper only attaches the photo.

/** wa.me link with a pre-written message. */
export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(text)}`;
}

export const RX_MESSAGE = "السلام عليكم، عايز أطلب روشتة. هبعت صورتها في الرسالة الجاية.";

export function askAboutMessage(productName: string) {
  return `السلام عليكم، عندي استفسار عن: ${productName}`;
}
