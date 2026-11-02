// WhatsApp hand-offs and the small bits of grocery sense the theme adds on top
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
  return `السلام عليكم، عايز أتابع عروض ${storeName} أول بأول.`;
}

/** The shopper's written list, ready to send to the store. */
export function listMessage(items: string[]) {
  return ["السلام عليكم، عايز أطلب:", ...items.map((item) => `- ${item}`)].join("\n");
}

const VARIETY = /شوكول|فانيل|فراول|كراميل|مانج|موز|كوكيز|بندق|قهوة|ليمون|توت|بطيخ|خوخ|تفاح|عنب|برتقال|جوافة|رمان|جبن|طماطم|شطة|ملح|باربكيو|سادة|chocolate|vanilla|strawberry|caramel|mango|banana|cookie|coffee|berry|lemon|orange|apple|cheese|tomato|salt|plain/i;

/** Groceries sell varieties through the "color" option ("فراولة" even maps to a
 *  swatch): a variety word, or no real color at all, reads as a variety. */
export const isVariety = (values: string[]) => values.length > 0 && (values.some((v) => VARIETY.test(v)) || !values.some((v) => swatchColor(v)));

/** Time-of-day greeting for the home page. */
export function greeting(hour: number) {
  return hour >= 5 && hour < 12 ? "صباح الخير" : hour >= 12 && hour < 18 ? "نهارك سعيد" : "مساء الخير";
}
