// The small bits of jeweler's sense Qirat adds on top of plain store data:
// metal finishes for swatches, budget tiers from real prices, ring sizing and
// pre-written WhatsApp messages. Nothing here invents a claim about a product.

import { swatchColor } from "../../shared/colors";

// ─── WhatsApp hand-offs ──────────────────────────────────────────────────────

/** wa.me link with a pre-written message. */
export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(text)}`;
}

/** Share link with no recipient: WhatsApp opens its contact picker. */
export function waShare(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function askAboutMessage(productName: string) {
  return `السلام عليكم، عندي استفسار عن: ${productName}`;
}

export function joinMessage(storeName: string) {
  return `السلام عليكم، عايز أعرف كل جديد ${storeName} أول بأول.`;
}

/** "Drop a hint": the shopper sends a piece they love to someone who might gift it. */
export function hintMessage(productName: string, url: string, storeName: string) {
  return `شوفت القطعة دي في ${storeName} وعجبتني جدًا ✨\n${productName}\n${url}`;
}

/** The whole wishlist, one line per piece. */
export function wishlistMessage(items: { name: string; url: string }[], storeName: string) {
  const lines = items.map((it, i) => `${i + 1}. ${it.name}\n${it.url}`);
  return `دي قايمة أمنياتي من ${storeName} ✨\n\n${lines.join("\n\n")}`;
}

export function giftHelpMessage(storeName: string, budget?: string, kind?: string) {
  const parts = [budget && `الميزانية: ${budget}`, kind && `النوع: ${kind}`].filter(Boolean).join(" · ");
  return `السلام عليكم، محتاج مساعدة أختار هدية من ${storeName}${parts ? ` (${parts})` : ""}.`;
}

// ─── Metals ──────────────────────────────────────────────────────────────────

export type Metal = "gold" | "rose" | "silver" | "copper";

// Order matters: "روز جولد" / "rose gold" and "ذهب أبيض" / "white gold" are
// checked before plain gold.
const METALS: [Metal, RegExp][] = [
  ["rose", /روز|rose|وردي ذهبي|ذهبي وردي/i],
  ["silver", /فض|silver|sterling|ستيرل|بلاتين|platinum|ذهب أبيض|دهب أبيض|white gold|ستانلس|ستانليس|stainless|steel|ستيل|روديوم|rhodium/i],
  ["gold", /ذهب|دهب|gold|جولد|عيار|karat|\bk?\d{2}k\b/i],
  ["copper", /نحاس|برونز|copper|bronze/i],
];

/** The metal a color label names, if any ("ذهبي عيار ٢١" → gold). */
export function metalOf(label: string): Metal | null {
  for (const [metal, re] of METALS) if (re.test(label)) return metal;
  return null;
}

const FINISH: Record<Metal, string> = {
  gold: "linear-gradient(135deg, #f7e7b0 0%, #d9b45a 34%, #b38a2e 58%, #f1d88f 82%, #c99d3f 100%)",
  rose: "linear-gradient(135deg, #f8dcd2 0%, #d39a88 36%, #ad6f60 60%, #f1c6b6 84%, #c48573 100%)",
  silver: "linear-gradient(135deg, #ffffff 0%, #d4d7dc 34%, #a3a8b0 58%, #f1f3f5 82%, #bfc3c9 100%)",
  copper: "linear-gradient(135deg, #f3c9a4 0%, #c27c43 36%, #91562a 60%, #e8b086 84%, #b06c36 100%)",
};

/** Swatch paint for an option label: a polished metal finish for metals, the
 *  plain color for everything else, null when it names no color. */
export function swatchFill(label: string): string | null {
  const metal = metalOf(label);
  return metal ? FINISH[metal] : swatchColor(label);
}

// A flavor or scent word, unless it's the color adjective made from it.
const VARIETY = /(شوكول|فانيل|فراول|كراميل|مانج|موز|كوكيز|بندق|قهوة|ليمون|توت|بطيخ|خوخ|تفاح|عنب|برتقال|جوافة|رمان|عود|مسك|ورد|ياسمين)(?!ي)|\b(chocolate|vanilla|strawberry|caramel|mango|banana|cookie|coffee|berry|lemon|apple|oud|musk|jasmine)\b/i;

/** Values sold through the "color" option that aren't colors or metals
 *  (scents, flavors, stone names nobody can paint) are picked from boxes. */
export const isVariety = (values: string[]) => values.length > 0 && (values.some((v) => VARIETY.test(v) && !metalOf(v)) || !values.some((v) => swatchFill(v)));

/** Every value is a metal — the option reads "المعدن", not "اللون". */
export const isMetalOption = (values: string[]) => values.length > 0 && values.every((v) => metalOf(v));

// ─── Budgets ─────────────────────────────────────────────────────────────────

export type Budget = { min: number; max: number };

/** Round to a figure a jeweler would print: 1, 2, 2.5 or 5 × 10ⁿ. */
export function niceRound(v: number) {
  if (v <= 0) return 0;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = n < 1.5 ? 1 : n < 2.25 ? 2 : n < 3.75 ? 2.5 : n < 7.5 ? 5 : 10;
  return step * p;
}

/** Up to three budgets that split the store's real prices into thirds
 *  ("أقل من ٥٠٠", "٥٠٠ – ٢٠٠٠", "أكتر من ٢٠٠٠"). `max: 0` means no ceiling.
 *  Fewer than three distinct prices, or a narrow spread, gives none. */
export function budgetTiers(prices: number[]): Budget[] {
  const sorted = [...new Set(prices.filter((p) => p > 0))].sort((a, b) => a - b);
  if (sorted.length < 3) return [];
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  if (hi < lo * 1.6) return [];
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const a = niceRound(at(1 / 3));
  const b = niceRound(at(2 / 3));
  const cuts = [a, b].filter((c, i, all) => c > lo && c < hi && all.indexOf(c) === i);
  if (cuts.length === 0) return [];
  const tiers: Budget[] = [{ min: 0, max: cuts[0] }];
  if (cuts.length === 2) tiers.push({ min: cuts[0], max: cuts[1] });
  tiers.push({ min: cuts[cuts.length - 1], max: 0 });
  return tiers;
}

export const inBudget = (price: number, b: Budget) => price >= b.min && (b.max === 0 || price <= b.max);

// ─── Ring sizes ──────────────────────────────────────────────────────────────

/** Finger circumference in mm → the standard sizes. ISO 8653 (used across
 *  Europe and the Middle East) is the inner circumference itself; US sizes
 *  follow d = 11.63 + 0.8128·s (mm), to the nearest half. */
export function ringSizeFromCircumference(mm: number) {
  if (!Number.isFinite(mm) || mm < 38 || mm > 80) return null;
  const diameter = mm / Math.PI;
  const us = Math.round(((diameter - 11.63) / 0.8128) * 2) / 2;
  return { diameter: Math.round(diameter * 10) / 10, iso: Math.round(mm), us: Math.max(0, us) };
}

/** Every size is a plain number: a ring, so the sizer makes sense. */
export const isNumericSizes = (sizes: string[]) => sizes.length > 0 && sizes.every((s) => /^\s*\d+(?:[.,]\d+)?\s*$/.test(toLatinDigits(s)));

/** Store sizes on the ISO scale (40–76) or the US scale (1–16), when clear. */
export function sizeScale(sizes: string[]): "iso" | "us" | null {
  if (!isNumericSizes(sizes)) return null;
  const n = sizes.map((s) => Number(toLatinDigits(s).replace(",", ".")));
  if (n.every((v) => v >= 40 && v <= 76)) return "iso";
  if (n.every((v) => v >= 1 && v <= 16)) return "us";
  return null;
}

/** The store size closest to a measured ring size on the store's scale. */
export function nearestSize(sizes: string[], target: number) {
  let best: string | null = null;
  let gap = Infinity;
  for (const s of sizes) {
    const d = Math.abs(Number(toLatinDigits(s).replace(",", ".")) - target);
    if (d < gap) {
      gap = d;
      best = s;
    }
  }
  return best;
}

export function toLatinDigits(s: string) {
  return s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Product weight (stored in kg) in the unit a jeweler quotes: grams under a kilo. */
export function weightLabel(kg: number, fmt: (n: number) => string) {
  if (kg <= 0) return null;
  if (kg < 1) {
    const g = Math.round(kg * 1000 * 100) / 100;
    return `${fmt(g)} جرام`;
  }
  return `${fmt(Math.round(kg * 100) / 100)} كجم`;
}
