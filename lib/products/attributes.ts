// ─────────────────────────────────────────────────────────────────────────────
//  Product attributes — the merchant's own "key: value" details
//
//  The product form's «خصائص مخصصة» saves `Product.attributes` as a JSON list
//  of { key, value } (origin, material, roast…). The storefront reads it only
//  through here: plain trimmed strings, empty rows dropped, capped, so a theme
//  can render them without guarding against whatever the column holds.
// ─────────────────────────────────────────────────────────────────────────────

export type ProductAttribute = { key: string; value: string };

const MAX_ROWS = 16;
const MAX_KEY = 40;
const MAX_VALUE = 200;

/** `Product.attributes` (JSON) → clean { key, value } rows, in the merchant's order. */
export function readProductAttributes(raw: unknown): ProductAttribute[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductAttribute[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (out.length >= MAX_ROWS) break;
    if (!row || typeof row !== "object") continue;
    const { key, value } = row as Record<string, unknown>;
    if (typeof key !== "string" || typeof value !== "string") continue;
    const k = key.replace(/\s+/g, " ").trim().slice(0, MAX_KEY);
    const v = value.replace(/[^\S\n]+/g, " ").trim().slice(0, MAX_VALUE);
    if (!k || !v || seen.has(k)) continue;
    seen.add(k);
    out.push({ key: k, value: v });
  }
  return out;
}
