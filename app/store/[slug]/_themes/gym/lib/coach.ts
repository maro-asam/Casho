// WhatsApp hand-offs and the small pieces of supplement sense the theme adds on
// top of plain store data. Nothing here invents a claim: the messages are
// pre-written for the shopper, and the matchers only read the merchant's own
// names. Gym is used by stores in every field, so each matcher stays quiet
// unless the names clearly say "supplement": a book shop's "روايات" or a
// kitchen shop's "شوايات" must never read as whey.

import { swatchColor } from "../../shared/colors";
import { st } from "@/lib/i18n/storefront";

/** wa.me link with a pre-written message (Arabic source text is translated to the store language). */
export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(st(text))}`;
}

// Arabic source text — waWith() translates it to the store language. i18n-ignore
export const COACH_MESSAGE = "السلام عليكم، محتاج مساعدة أختار المنتج اللي يناسبني.";

export function askAboutMessage(productName: string) {
  return st("السلام عليكم، عندي استفسار عن: {0}", productName);
}

export function joinMessage(storeName: string) {
  return st("السلام عليكم، عايز أتابع عروض {0} أول بأول.", storeName);
}

/** "واي" (whey) as its own word only (also "الواي"): not inside "روايات",
 *  "شواية" or "هاواي", and not "واي فاي". */
export const WHEY = /(?:^|[^\p{L}]|ال)واي(?![\p{L}])(?!\s*فاي)/u;

/** One case-insensitive Unicode pattern from several (regex literals keep the
 *  Arabic out of string literals). */
export const anyOf = (...parts: RegExp[]) => new RegExp(parts.map((r) => r.source).join("|"), "iu");

/** Words that are flavors but also common fashion / home color names. */
const FLAVOR = /شوكول|شيكول|فانيل|فراول|كراميل|مانج|موز|كوكيز|بندق|كابتشينو|قهوة|ليمون|توت|بطيخ|خوخ|تفاح|عنب|سادة|بدون نكهة|chocolate|vanilla|strawberr|caramel|mango|banana|cookie|cappuccino|coffee|berry|lemon|unflavou?red/i;
/** Flavors nobody sells a shirt or a sofa in. */
const ONLY_FLAVOR = /فراول|كوكيز|كابتشينو|بطيخ|موز|مانج|راسبيري|بلو ?بيري|فروت ?بانش|تروبيكال|بدون نكهة|strawberr|cookie|cappuccino|watermelon|banana|mango|raspberr|blueberr|fruit ?punch|tropical|unflavou?red/i;

const SUPPLEMENT = anyOf(/مكمل|بروتين/, WHEY, /كرياتين|امينو|أمينو|فيتامين|حرق|تنشيف|جينر|ضخامة|بري ?و+رك|supplement|protein|whey|creatine|amino|bcaa|vitamin|gainer|pre.?workout|burner/);
/** Not swallowed: hair protein, keratin, vitamin C serum, skin care. */
const NOT_INGESTED = /شعر|كيراتين|سيروم|شامبو|بلسم|لوشن|صابون|غسول|تونر|بشرة|ماسك(?![\p{L}])|hair|keratin|serum|shampoo|conditioner|lotion|soap|cleanser|toner|skin/iu;
const PROTEIN = anyOf(/بروتين/, WHEY, /protein|whey/);

/** Is this a consumable (gets the supplement care note on its product page)?
 *  Pass the product and/or category names. */
export function isSupplement(...names: (string | null | undefined)[]) {
  const text = names.filter(Boolean).join(" ");
  return SUPPLEMENT.test(text) && !NOT_INGESTED.test(text);
}

/** Supplements sell flavors through the "color" option ("chocolate" even maps
 *  to a swatch). For a supplement (by its product / category names) a flavor
 *  word, or no real color at all, reads as flavors. For anything else only an
 *  unmistakable flavor does, and only when no value is a plain color, so a
 *  bag in "كراميل" or a dress in "خوخي" keeps "اللون". */
export function isFlavor(values: string[], ...names: (string | null | undefined)[]) {
  if (values.length === 0) return false;
  if (isSupplement(...names)) return values.some((v) => FLAVOR.test(v)) || !values.some((v) => swatchColor(v));
  return values.some((v) => ONLY_FLAVOR.test(v)) && values.every((v) => FLAVOR.test(v) || ONLY_FLAVOR.test(v) || !swatchColor(v));
}

/** Does the store sell supplements at all? (The protein calculator only shows
 *  up then.) Its shelves first, then the products already on the page, for
 *  shops that organize by brand. */
export function sellsSupplements(categories: { name: string; productCount: number }[], products: { name: string; categoryName?: string | null }[]) {
  return categories.some((c) => c.productCount > 0 && isSupplement(c.name)) || products.some((p) => isSupplement(p.name, p.categoryName));
}

/** The store's shelf for the calculator's "shop protein" link, if it has one. */
export function proteinCategory<T extends { name: string; productCount: number }>(categories: T[]) {
  return categories.find((c) => c.productCount > 0 && PROTEIN.test(c.name) && !NOT_INGESTED.test(c.name)) ?? null;
}
