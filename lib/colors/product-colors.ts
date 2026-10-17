// Product colors are free text ("أسود", "كحلي غامق", "Navy", "#1f2a44",
// "أسود × أبيض"). This turns a label into a CSS `background` for a swatch, so
// every theme can show the real color instead of the word. Pure — shared by
// the storefront themes and the dashboard color input.
//
// Labels stay labels everywhere else (cart, orders, variants); only the swatch
// is derived, so nothing stored changes.

/** Canonical colors offered in the dashboard picker, in display order. */
export const PRODUCT_COLOR_PALETTE = [
  { name: "أسود", hex: "#111111" },
  { name: "أبيض", hex: "#ffffff" },
  { name: "أوف وايت", hex: "#f5f1e8" },
  { name: "رمادي", hex: "#9ca3af" },
  { name: "فضي", hex: "#c0c4c8" },
  { name: "بيج", hex: "#e3d3b8" },
  { name: "جملي", hex: "#c19a6b" },
  { name: "بني", hex: "#7a4b2a" },
  { name: "كافيه", hex: "#a47551" },
  { name: "أحمر", hex: "#c81e1e" },
  { name: "نبيتي", hex: "#6d1a2a" },
  { name: "سيمون", hex: "#f4a38c" },
  { name: "وردي", hex: "#f4a6c0" },
  { name: "فوشيا", hex: "#d61f8c" },
  { name: "برتقالي", hex: "#ea7a1f" },
  { name: "مشمشي", hex: "#f6b26b" },
  { name: "أصفر", hex: "#f2c94c" },
  { name: "مستردة", hex: "#d4a017" },
  { name: "ذهبي", hex: "#c9a227" },
  { name: "أخضر", hex: "#2f8a4c" },
  { name: "زيتي", hex: "#5b6b2f" },
  { name: "منت", hex: "#a8e6cf" },
  { name: "تركواز", hex: "#1aa6a6" },
  { name: "بترولي", hex: "#1f5f6b" },
  { name: "لبني", hex: "#9cc7e8" },
  { name: "أزرق", hex: "#2563eb" },
  { name: "كحلي", hex: "#1f2a44" },
  { name: "موف", hex: "#9b7bc4" },
  { name: "بنفسجي", hex: "#7c4dbe" },
  { name: "ليلكي", hex: "#c8a2c8" },
] as const;

/** Extra spellings (Arabic dialect + English) → hex. Keys are normalized. */
const ALIASES: Record<string, string> = {
  // black / white / greys
  black: "#111111", "فحمي": "#2b2b2b", charcoal: "#36454f",
  white: "#ffffff", "اوف وايت": "#f5f1e8", "off-white": "#f5f1e8", "اوفوايت": "#f5f1e8", "off white": "#f5f1e8", offwhite: "#f5f1e8", ivory: "#fffff0", "عاجي": "#fffff0",
  "كريمي": "#f3ead7", "كريم": "#f3ead7", cream: "#f3ead7",
  "رصاصي": "#9ca3af", "سنجابي": "#8e8e8e", gray: "#9ca3af", grey: "#9ca3af",
  silver: "#c0c4c8",
  // browns / neutrals
  beige: "#e3d3b8", "نود": "#e3bc9a", nude: "#e3bc9a",
  camel: "#c19a6b", "هافان": "#c8a27a", "كشمير": "#d8c3a5", "رملي": "#d6c29a", sand: "#d6c29a", khaki: "#c3b091", "كاكي": "#c3b091", taupe: "#8b7d6b",
  brown: "#7a4b2a", "شوكولاته": "#4e2a1e", "شيكولاته": "#4e2a1e", chocolate: "#4e2a1e", "قهوه": "#6f4e37", coffee: "#6f4e37", "كافي": "#a47551", mocha: "#967259", "موكا": "#967259",
  // reds / pinks
  red: "#c81e1e", "خمري": "#7b1e2b", "عنابي": "#6d1a2a", burgundy: "#6d1a2a", maroon: "#6d1a2a", wine: "#722f37", "روج": "#c81e1e",
  "بينك": "#f4a6c0", "بمبي": "#f4a6c0", pink: "#f4a6c0", "روز": "#e8a0a8", rose: "#e8a0a8", "بيبي بينك": "#f8c8dc", "baby pink": "#f8c8dc",
  salmon: "#f4a38c", "سلمون": "#f4a38c", coral: "#f2786b", "كورال": "#f2786b", "مرجاني": "#f2786b",
  fuchsia: "#d61f8c", magenta: "#d61f8c", "ماجنتا": "#d61f8c",
  // oranges / yellows
  orange: "#ea7a1f", "اورانج": "#ea7a1f", "طوبي": "#b5523b", "قرميدي": "#b5523b", brick: "#b5523b", "نحاسي": "#b87333", copper: "#b87333",
  apricot: "#f6b26b", peach: "#f8c3a0", "خوخي": "#f8c3a0",
  yellow: "#f2c94c", "ليموني": "#e8e337", mustard: "#d4a017", "مسترده": "#d4a017", "مستارد": "#d4a017",
  gold: "#c9a227", "دهبي": "#c9a227", "روز جولد": "#b76e79", "rose gold": "#b76e79", "rose-gold": "#b76e79",
  // greens
  green: "#2f8a4c", "زرعي": "#2f8a4c", "فسدقي": "#93c572", "فستقي": "#93c572", pistachio: "#93c572",
  olive: "#5b6b2f", "زيتوني": "#5b6b2f", "كاكي اخضر": "#6b6b3a", "عشبي": "#4caf50",
  mint: "#a8e6cf", "نعناعي": "#a8e6cf", "مينت": "#a8e6cf", "زمردي": "#047857", emerald: "#047857", "جنزاري": "#43b3ae",
  "اخضر زيتي": "#5b6b2f", "كحلي اخضر": "#1f3b2e",
  // blues
  blue: "#2563eb", "ازرق ملكي": "#1d4ed8", "رويال": "#1d4ed8", royal: "#1d4ed8", "royal blue": "#1d4ed8",
  navy: "#1f2a44", "نيفي": "#1f2a44", "نيلي": "#3b3f8f", indigo: "#3b3f8f",
  "سماوي": "#9cc7e8", "sky blue": "#9cc7e8", "بيبي بلو": "#bcd8f0", "baby blue": "#bcd8f0", "جينز": "#4a6a8a", denim: "#4a6a8a",
  turquoise: "#1aa6a6", "فيروزي": "#1aa6a6", teal: "#1f5f6b", petrol: "#1f5f6b", "بتروني": "#1f5f6b", cyan: "#22c3d6",
  // purples
  purple: "#7c4dbe", violet: "#7c4dbe", "مووف": "#9b7bc4", mauve: "#9b7bc4", lavender: "#c8a2c8", lilac: "#c8a2c8", "لافندر": "#c8a2c8", "باذنجاني": "#4b1f4f", plum: "#4b1f4f",
};

/** Words that lighten / darken the base color ("كحلي غامق", "light blue"). */
const LIGHTER = new Set(["فاتح", "light", "pale", "baby"]);
const DARKER = new Set(["غامق", "داكن", "dark", "deep"]);
/** Prefix/suffix words that carry no color ("لون أحمر", "أحمر سادة"). */
const NOISE = new Set(["لون", "سادة", "سادا", "color", "colour", "ساده"]);

/** Labels that mean "many colors" — shown as a rainbow swatch. */
const MULTI = new Set(["ملون", "الوان", "مشكل", "متعدد الالوان", "مشجر", "منقوش", "multicolor", "multi", "multi color", "colorful", "printed", "رينبو", "rainbow"]);
const RAINBOW = "conic-gradient(#e74c3c, #f1c40f, #2ecc71, #3498db, #9b59b6, #e74c3c)";

const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;
/** "أسود × أبيض", "black/white", "أسود و أبيض", "أسود - أبيض" */
const SPLIT = /\s*(?:[×x/|+&,،\-–]|\s(?:و|with|and)\s)\s*/i;

/** Arabic/English spelling-insensitive key: أإآ→ا, ة→ه, ى→ي, no tashkeel/tatweel. */
export function normalizeColorKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

const BASE = new Map<string, string>();
for (const { name, hex } of PRODUCT_COLOR_PALETTE) BASE.set(normalizeColorKey(name), hex);
for (const [name, hex] of Object.entries(ALIASES)) BASE.set(normalizeColorKey(name), hex);

/** "الاسود" → "اسود"; "اسود" stays. */
const stripArticle = (w: string) => (w.startsWith("ال") && w.length > 4 ? w.slice(2) : w);

/** `amount` > 0 mixes toward white, < 0 toward black. */
function shade(hex: string, amount: number) {
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
  const n = parseInt(full.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** One color word/phrase → hex, honoring فاتح/غامق. */
function solid(label: string): string | null {
  const key = normalizeColorKey(label);
  if (HEX.test(key)) return key;
  if (BASE.has(key)) return BASE.get(key)!;

  const words = key.split(" ").map(stripArticle).filter((w) => !NOISE.has(w));
  let amount = 0;
  const rest: string[] = [];
  for (const w of words) {
    if (LIGHTER.has(w) || LIGHTER.has(w.replace(/ه$/, ""))) amount = 0.4;
    else if (DARKER.has(w) || DARKER.has(w.replace(/ه$/, ""))) amount = -0.35;
    else rest.push(w);
  }
  if (rest.length === 0) return null;

  // Exact phrase first ("بيبي بينك"), then the first word that's a color ("أزرق سماوي" → أزرق).
  const phrase = rest.join(" ");
  const hex = BASE.get(phrase) ?? rest.map((w) => BASE.get(w)).find(Boolean) ?? null;
  return hex && amount ? shade(hex, amount) : hex;
}

/**
 * CSS `background` for a product color label, or null when it isn't
 * recognizable (themes then fall back to a text chip). Two-tone labels give a
 * split swatch, "ملون"/"multicolor" a rainbow.
 */
export function swatchColor(label: string): string | null {
  const key = normalizeColorKey(label);
  if (!key) return null;
  if (MULTI.has(key) || MULTI.has(stripArticle(key))) return RAINBOW;
  if (HEX.test(key)) return key;
  if (BASE.has(key)) return BASE.get(key)!;

  // Two-tone before the single-color fallback, which would read "أسود وأبيض" as black.
  const parts = twoTone(key);
  if (parts) {
    const step = 100 / parts.length;
    const stops = parts.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ");
    return `linear-gradient(135deg, ${stops})`;
  }
  return solid(key);
}

/** Hexes of a multi-color label ("أسود × أبيض", "black/white", "أسود وأبيض"), or null. */
function twoTone(key: string): string[] | null {
  const bySeparator = key.split(SPLIT).filter(Boolean);
  if (bySeparator.length >= 2) {
    const colors = bySeparator.map(solid);
    if (colors.every(Boolean)) return colors as string[];
  }
  // Arabic "و" glued to the next word: "اسود وابيض".
  const words = key.split(" ");
  for (let i = 1; i < words.length; i++) {
    if (!words[i].startsWith("و")) continue;
    const before = solid(words.slice(0, i).join(" "));
    const after = solid([words[i].slice(1), ...words.slice(i + 1)].join(" "));
    // "وردي" is a color itself, so only split when the glued word isn't one.
    if (before && after && !BASE.has(words[i])) return [before, after];
  }
  return null;
}

/** True when the swatch is light enough to need a border / dark check mark. */
export function isLightSwatch(background: string) {
  const hex = background.match(/#[0-9a-f]{6}|#[0-9a-f]{3}\b/i)?.[0];
  if (!hex) return false;
  const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
  const n = parseInt(full.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
}
