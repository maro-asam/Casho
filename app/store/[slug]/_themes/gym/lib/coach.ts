// WhatsApp hand-offs and the small pieces of gym sense the theme adds on top of
// plain store data. Nothing here invents a claim: the messages are pre-written
// for the shopper, and the matchers only read the merchant's own names.

import { swatchColor } from "../../shared/colors";

/** wa.me link with a pre-written message. */
export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(text)}`;
}

export const COACH_MESSAGE = "السلام عليكم، محتاج أسأل عن المكملات والأدوات اللي تناسب هدفي.";

export function askAboutMessage(productName: string) {
  return `السلام عليكم، عندي استفسار عن: ${productName}`;
}

export function joinMessage(storeName: string) {
  return `السلام عليكم، عايز أتابع عروض ${storeName} أول بأول.`;
}

const FLAVOR = /شوكول|فانيل|فراول|كراميل|مانج|موز|كوكيز|بندق|كابتشينو|قهوة|ليمون|توت|بطيخ|خوخ|تفاح|عنب|سادة|بدون نكهة|chocolate|vanilla|strawberry|caramel|mango|banana|cookie|cappuccino|coffee|berry|lemon|unflavou?red/i;

/** Supplements sell flavors through the "color" option ("chocolate" even maps
 *  to a swatch): a flavor word, or no real color at all, reads as a flavor. */
export const isFlavor = (values: string[]) => values.length > 0 && (values.some((v) => FLAVOR.test(v)) || !values.some((v) => swatchColor(v)));

const SUPPLEMENT = /مكمل|بروتين|واي|كرياتين|امينو|أمينو|فيتامين|حرق|تنشيف|جينر|ضخامة|بري ?و+رك|supplement|protein|whey|creatine|amino|bcaa|vitamin|gainer|pre.?workout|burner/i;
const PROTEIN = /بروتين|واي|protein|whey/i;

/** Is this a consumable (gets the supplement care note on its product page)? */
export const isSupplement = (...names: (string | null | undefined)[]) => names.some((n) => n && SUPPLEMENT.test(n));

/** The store's shelf for the calculator's "shop protein" link, if it has one. */
export function proteinCategory<T extends { name: string; productCount: number }>(categories: T[]) {
  return categories.find((c) => c.productCount > 0 && PROTEIN.test(c.name)) ?? null;
}
