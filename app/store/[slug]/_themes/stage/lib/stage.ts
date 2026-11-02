// WhatsApp hand-offs and the small bits of product sense the theme adds on top
// of plain store data. Messages are pre-written for the shopper; nothing here
// invents a claim.

import { swatchColor } from "../../shared/colors";

/** wa.me link with a pre-written message. */
export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(text)}`;
}

export function askAboutMessage(productName: string) {
  return `السلام عليكم، عندي استفسار عن: ${productName}`;
}

export function joinMessage(storeName: string) {
  return `السلام عليكم، عايز أعرف كل جديد ${storeName} أول بأول.`;
}

// A flavor or scent word, unless it's the color adjective made from it
// ("برتقال" is a flavor, "برتقالي" a color; "خوخ" / "خوخي", "وردة" / "وردي").
const VARIETY = /(شوكول|فانيل|فراول|كراميل|مانج|موز|كوكيز|بندق|قهوة|ليمون|توت|بطيخ|خوخ|تفاح|عنب|برتقال|جوافة|رمان|عود|مسك|ورد|ياسمين)(?!ي)|\b(chocolate|vanilla|strawberry|caramel|mango|banana|cookie|coffee|berry|lemon|apple|oud|musk|jasmine)\b/i;

/** Many stores sell flavors or scents through the "color" option ("فراولة"
 *  even maps to a swatch): a variety word, or no real color at all, reads as a
 *  variety, so it's picked from boxes, not swatches. */
export const isVariety = (values: string[]) => values.length > 0 && (values.some((v) => VARIETY.test(v)) || !values.some((v) => swatchColor(v)));
