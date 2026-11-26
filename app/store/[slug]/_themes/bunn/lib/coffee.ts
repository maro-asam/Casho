// ─────────────────────────────────────────────────────────────────────────────
//  The roaster's sense Casho Bunn adds on top of plain store data
//
//  Everything here is read from what the merchant typed — the product's own
//  details (product form → خصائص مخصصة), "key: value" lines in its
//  description, its name and its options. Nothing invents a claim: a field
//  the merchant didn't give is simply not shown. Pure, no React; tested in
//  coffee.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProductAttribute } from "@/lib/products/attributes";
import { st } from "@/lib/i18n/storefront";

// ─── Text ────────────────────────────────────────────────────────────────────

const [ALEF, HEH, WAW, YEH] = [0x627, 0x647, 0x648, 0x64a].map((c) => String.fromCharCode(c));

/** Folds Arabic spelling variants and case so keywords match however typed. */
export function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, ALEF)
    .replace(/ة/g, HEH)
    .replace(/ى/g, YEH)
    .replace(/ؤ/g, WAW)
    .replace(/ئ/g, YEH)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Where a whole word of the pattern first appears in normalized text, or -1
 *  ("بيرو" doesn't match "بيروت"). The pattern may hold alternatives; Arabic
 *  "ال" / "بال" / "و" prefixes pass. */
function wordAt(text: string, re: RegExp) {
  // i18n-ignore: Arabic prefixes in a pattern, not text
  return text.search(new RegExp(`(?:^|\\s)(?:ال|بال|وال|و|ب)?(?:${re.source})(?=\\s|$)`, "u"));
}

// ─── Fields ──────────────────────────────────────────────────────────────────

export type Field = "origin" | "region" | "farm" | "process" | "altitude" | "variety" | "roast" | "notes" | "brew" | "harvest" | "score" | "weight";

/** Keys a merchant may type for each field (normalized, Arabic and English). */
const FIELD_KEYS: [Field, RegExp][] = [
  ["origin", /^(?:ال)?(?:منشا|بلد المنشا|بلد|دوله|اصل|origin|country|country of origin)$/u],
  ["region", /^(?:ال)?(?:منطقه|اقليم|محافظه|region|area|state)$/u],
  ["farm", /^(?:ال)?(?:مزرعه|منتج|المنتج|تعاونيه|محطه|محطه الغسيل|farm|producer|estate|cooperative|coop|co op|washing station|mill)$/u],
  ["process", /^(?:ال)?(?:معالجه|طريقه المعالجه|process|processing|processing method)$/u],
  ["altitude", /^(?:ال)?(?:ارتفاع|الارتفاع عن سطح البحر|altitude|elevation|masl)$/u],
  ["variety", /^(?:ال)?(?:سلاله|سلالات|صنف|اصناف|variety|varietal|varietals|varieties|cultivar)$/u],
  ["roast", /^(?:ال)?(?:تحميص|درجه التحميص|تحميصه|roast|roast level|roast profile|roast degree)$/u],
  ["notes", /^(?:ال)?(?:نكهات|نكهه|طعم|نوتات|ايحاءات|notes|tasting notes|flavor notes|flavour notes|cupping notes|flavors|flavours|taste)$/u],
  ["brew", /^(?:ال)?(?:تحضير|طريقه التحضير|طرق التحضير|يناسب|مناسب ل|مناسب لل|brew|brew method|brew methods|best for|recommended for)$/u],
  ["harvest", /^(?:ال)?(?:حصاد|موسم الحصاد|harvest|crop|crop year)$/u],
  ["score", /^(?:ال)?(?:تقييم|سكور|تقييم sca|score|sca|sca score|cupping score)$/u],
  ["weight", /^(?:ال)?(?:وزن|الوزن الصافي|وزن صافي|صافي الوزن|net weight|weight|net wt)$/u],
];

export function fieldOf(key: string): Field | null {
  const k = norm(key);
  for (const [field, re] of FIELD_KEYS) if (re.test(k)) return field;
  return null;
}

/** "المنشأ: إثيوبيا" lines in a description become fields; the rest stays the
 *  story. Only short keys that name a known field are taken. */
export function splitDescription(description: string | null | undefined): { rows: ProductAttribute[]; story: string } {
  if (!description?.trim()) return { rows: [], story: "" };
  const rows: ProductAttribute[] = [];
  const kept: string[] = [];
  for (const line of description.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:[-•*·]\s*)?([^:：\n]{1,32})\s*[:：]\s*(.+?)\s*$/);
    if (m && fieldOf(m[1])) rows.push({ key: m[1].trim(), value: m[2].replace(/[.。]\s*$/, "").trim() });
    else kept.push(line);
  }
  const story = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { rows, story };
}

// ─── Roast ───────────────────────────────────────────────────────────────────

export type RoastLevel = 1 | 2 | 3 | 4 | 5;

// Compound words first ("متوسط غامق" before "غامق").
const ROASTS: [RegExp, RoastLevel][] = [
  [/فاتح جدا|فاتحه جدا|very light|extra light|nordic|cinnamon/u, 1],
  [/متوسط غامق|وسط غامق|متوسط الي غامق|متوسطه الي غامقه|medium dark|full city|فل سيتي/u, 4],
  [/متوسط فاتح|وسط فاتح|فاتح الي متوسط|medium light/u, 2],
  [/غامق جدا|very dark|french roast|italian roast|فرنساوي|ايطالي/u, 5],
  [/فاتح|فاتحه|light|blonde|تحميص فلتر|filter roast/u, 2],
  [/غامق|غامقه|dark|تحميص اسبريسو|espresso roast/u, 5],
  [/متوسط|متوسطه|(?<!\p{L})وسط(?!\p{L})|medium|omni|اومني|city/u, 3],
];

/** Roast level from the merchant's words ("متوسط غامق", "Medium-Dark", "٣/٥"). */
export function roastOf(text: string | null | undefined): RoastLevel | null {
  if (!text) return null;
  const digits = text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const scale = digits.match(/([1-5])\s*(?:\/|من|of)\s*5/);
  if (scale) return Number(scale[1]) as RoastLevel;
  const t = norm(text);
  for (const [re, level] of ROASTS) if (re.test(t)) return level;
  return null;
}

/** Bean colors from very light to dark, for the roast meter and swatches. */
export const ROAST_COLORS: Record<RoastLevel, string> = { 1: "#c9a173", 2: "#a9743f", 3: "#7c4c27", 4: "#55321b", 5: "#2e1b10" };

export function roastLabel(level: RoastLevel) {
  return level === 1 ? st("فاتح جدًا") : level === 2 ? st("فاتح") : level === 3 ? st("متوسط") : level === 4 ? st("متوسط غامق") : st("غامق");
}

// ─── Tasting notes ───────────────────────────────────────────────────────────

export type Family = "wine" | "floral" | "tea" | "berry" | "citrus" | "fruit" | "chocolate" | "caramel" | "spice" | "nutty" | "earthy" | "other";

// Order matters: "زهر البرتقال" is floral before citrus, "nutmeg" spice before nut.
const FAMILIES: [Family, RegExp][] = [
  ["wine", /نبيذ|روم|ويسكي|مخمر|تخمير|wine|winey|rum|whisk|boozy|ferment|liqueur/u],
  ["floral", /ياسمين|ورد|زهر|زهور|لافندر|كركديه|بنفسج|jasmine|rose|floral|flower|lavender|hibiscus|violet|honeysuckle|blossom/u],
  ["tea", /شاي|نعناع|اعشاب|عشبي|بابونج|ايرل جراي|\btea\b|mint|herbal|chamomile|earl grey/u],
  ["berry", /توت|فراوله|كرز|عنب|برقوق|رمان|كشمش|فواكه حمرا|berry|berries|cherry|grape|plum|pomegranate|currant|red fruit/u],
  ["citrus", /ليمون|برتقال|يوسفي|جريب فروت|برغموت|(?<!\p{L})ليم(?!\p{L})|لايم|حمضيات|موالح|lemon|lime|orange|citrus|bergamot|grapefruit|mandarin|tangerine|yuzu/u],
  ["fruit", /خوخ|مشمش|مانجو|مانجا|اناناس|باشن|جوافه|بابايا|ليتشي|تفاح|كمثري|شمام|بطيخ|استوائي|فواكه|peach|apricot|nectarine|mango|pineapple|passion|tropical|guava|papaya|lychee|apple|pear|melon|fruit/u],
  ["chocolate", /شوكولاته|شيكولاته|شوكلاته|كاكاو|chocolate|cocoa|cacao/u],
  ["caramel", /كراميل|عسل|سكر|تمر|دبس|فانيليا|توفي|قصب|حلاوه|caramel|honey|toffee|sugar|molasses|\bdates?\b|vanilla|butterscotch|syrup|panela|maple/u],
  ["spice", /قرفه|هيل|حبهان|قرنفل|جوزه الطيب|زنجبيل|فلفل|ينسون|بهارات|cinnamon|cardamom|clove|spice|nutmeg|ginger|pepper|anise/u],
  ["nutty", /بندق|لوز|جوز|عين جمل|سوداني|مكسرات|فستق|كاجو|براليه|hazelnut|almond|walnut|\bnuts?\b|nutty|peanut|pecan|pistachio|cashew|praline|marzipan/u],
  ["earthy", /تبغ|دخان|مدخن|خشب|ارز|تراب|جلد|tobacco|smok|cedar|wood|earth|leather/u],
];

export const FAMILY_COLORS: Record<Family, string> = {
  wine: "#7a2742",
  floral: "#9568b3",
  tea: "#6f7d3c",
  berry: "#b23a48",
  citrus: "#d9a11b",
  fruit: "#e07a35",
  chocolate: "#5b3423",
  caramel: "#bb7a30",
  spice: "#93502e",
  nutty: "#9d7853",
  earthy: "#5a5145",
  other: "var(--accent)",
};

export function familyOf(note: string): Family {
  const t = norm(note);
  for (const [family, re] of FAMILIES) if (re.test(t)) return family;
  return "other";
}

export type Note = { label: string; family: Family };

/** "ياسمين، ليمون، شاي أسود" → three notes with their flavor families. */
export function notesOf(text: string | null | undefined, max = 6): Note[] {
  if (!text) return [];
  const seen = new Set<string>();
  return text
    .split(/\s*(?:[،,;؛/|·•+&]|\s-\s|\sو\s)\s*/)
    .map((s) => s.replace(/[.。]$/, "").trim())
    .filter((s) => s.length > 0 && s.length <= 32 && !seen.has(s) && seen.add(s))
    .slice(0, max)
    .map((label) => ({ label, family: familyOf(label) }));
}

// ─── Brew methods ────────────────────────────────────────────────────────────

export type BrewId = "filter" | "espresso" | "turkish" | "french" | "moka" | "cold";
export const BREW_IDS: BrewId[] = ["filter", "espresso", "turkish", "french", "moka", "cold"];

const BREWS: [BrewId, RegExp][] = [
  ["cold", /كولد برو|cold brew|بارد|ايسد|iced/u],
  ["filter", /فلتر|v60|في ستين|تقطير|كيمكس|chemex|pour over|بور اوفر|drip|كاليتا|kalita|ايروبريس|aeropress/u],
  ["espresso", /اسبريسو|espresso|لاتيه|كابتشينو|latte|cappuccino|flat white/u],
  ["turkish", /تركي|turkish|كنكه|cezve|ibrik|محوج/u],
  // Whole words: "press" and "بريس" also hide inside "espresso" / "إسبريسو".
  ["french", /فرنش|french press|(?<!\p{L})(?:بريس|press)(?!\p{L})/u],
  ["moka", /موكا|moka|بياليتي|bialetti/u],
];

/** Brew methods a text names, in the order it names them. */
export function brewsOf(text: string | null | undefined): BrewId[] {
  if (!text) return [];
  const t = norm(text);
  return BREWS.map(([id, re]) => ({ id, at: t.search(re) }))
    .filter((b) => b.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((b) => b.id);
}

/** What usually brings out a roast, when the merchant didn't say — shown as a
 *  suggestion ("مقترح"), never as the merchant's claim. */
export function brewsForRoast(level: RoastLevel | null): BrewId[] {
  if (!level) return [];
  if (level <= 2) return ["filter", "cold", "french"];
  if (level === 3) return ["filter", "espresso", "moka", "french"];
  return ["espresso", "turkish", "moka", "french"];
}

export type Recipe = {
  id: BrewId;
  /** Water per coffee (1:16). For espresso: drink weight per dose (1:2). */
  ratio: number;
  /** One cup of water (ml); espresso counts shots of 18 g. */
  cupMl: number;
  /** Water temperature range (°C), or null when it doesn't apply. */
  temp: [number, number] | null;
  /** Brew time range in seconds. */
  time: [number, number];
  grind: GrindId;
  maxCups: number;
};

export const RECIPES: Record<BrewId, Recipe> = {
  filter: { id: "filter", ratio: 16, cupMl: 250, temp: [92, 96], time: [150, 180], grind: "filter", maxCups: 6 },
  espresso: { id: "espresso", ratio: 2, cupMl: 0, temp: [92, 94], time: [25, 30], grind: "espresso", maxCups: 4 },
  turkish: { id: "turkish", ratio: 10, cupMl: 70, temp: null, time: [150, 210], grind: "turkish", maxCups: 8 },
  french: { id: "french", ratio: 15, cupMl: 250, temp: [93, 96], time: [240, 240], grind: "french", maxCups: 6 },
  moka: { id: "moka", ratio: 9, cupMl: 50, temp: null, time: [240, 300], grind: "moka", maxCups: 9 },
  cold: { id: "cold", ratio: 8, cupMl: 100, temp: null, time: [12 * 3600, 18 * 3600], grind: "french", maxCups: 10 },
};

export const ESPRESSO_DOSE = 18;

/** Coffee (g) and water (ml) for a number of cups — espresso gives the dose and
 *  the drink weight per shot instead of water. */
export function dose(recipe: Recipe, cups: number): { coffee: number; water: number } {
  const n = Math.max(1, Math.min(recipe.maxCups, Math.round(cups)));
  if (recipe.id === "espresso") return { coffee: ESPRESSO_DOSE * n, water: ESPRESSO_DOSE * recipe.ratio * n };
  const water = recipe.cupMl * n;
  return { coffee: Math.round((water / recipe.ratio) * 2) / 2, water };
}

// ─── Grind ───────────────────────────────────────────────────────────────────

export type GrindId = "whole" | "espresso" | "turkish" | "filter" | "french" | "moka";
export const GRIND_IDS: GrindId[] = ["whole", "espresso", "turkish", "filter", "french", "moka"];

export function grindLabel(id: GrindId) {
  switch (id) {
    case "whole":
      return st("حبوب كاملة");
    case "espresso":
      return st("إسبريسو");
    case "turkish":
      return st("تركي");
    case "filter":
      return st("فلتر / V60");
    case "french":
      return st("فرنش برس");
    case "moka":
      return st("موكا");
  }
}

export function grindHint(id: GrindId) {
  switch (id) {
    case "whole":
      return st("تطحنها بنفسك قبل التحضير");
    case "espresso":
      return st("ناعمة");
    case "turkish":
      return st("ناعمة جدًا زي البودرة");
    case "filter":
      return st("متوسطة");
    case "french":
      return st("خشنة");
    case "moka":
      return st("ناعمة لمتوسطة");
  }
}

export function brewLabel(id: BrewId) {
  switch (id) {
    case "filter":
      return st("فلتر / V60");
    case "espresso":
      return st("إسبريسو");
    case "turkish":
      return st("قهوة تركي");
    case "french":
      return st("فرنش برس");
    case "moka":
      return st("موكا");
    case "cold":
      return st("كولد برو");
  }
}

// ─── Options ─────────────────────────────────────────────────────────────────

export type OptionKind = "grind" | "roast" | "weight" | "spice" | "plain";

const OPT_ROAST = /^(?:تحميص\s)?(?:فاتح|فاتحه|وسط|متوسط|متوسطه|غامق|غامقه|فاتح جدا|غامق جدا|متوسط غامق|وسط غامق|متوسط فاتح|light|medium|dark|medium dark|medium light|very dark|very light|blonde)(?:\sroast)?$/u;
const OPT_GRIND = /حبوب|حبه|مطحون|طحن|ناعم|خشن|تركي|اسبريسو|فلتر|فرنش|موكا|v60|whole|bean|ground|grind|fine|coarse|espresso|turkish|filter|french|moka|drip|سادة الطحن/u;
const OPT_WEIGHT = /^(?:[\d.,]+\s*(?:جم|جرام|غ|غرام|g|gm|gr|grams?|كجم|كج|كيلو|كيلوجرام|kg|ك|اونصه|oz|lb)|ربع كيلو|نص كيلو|نصف كيلو|كيلو|ربع|نص)$/u;
const OPT_SPICE = /سادة|ساده|محوج|محوجه|هيل|حبهان|plain|cardamom|spiced|with cardamom/u;

/** What a product's sizes / colors really are on a coffee store, so their
 *  picker reads "التحميص", "الطحنة", "الوزن" or "النوع" instead of size/color. */
export function optionKind(values: string[]): OptionKind {
  if (values.length === 0) return "plain";
  const n = values.map((v) => norm(v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))));
  if (n.every((v) => OPT_ROAST.test(v))) return "roast";
  if (n.every((v) => OPT_WEIGHT.test(v))) return "weight";
  if (n.every((v) => OPT_SPICE.test(v))) return "spice";
  if (n.every((v) => OPT_GRIND.test(v) || OPT_ROAST.test(v))) return "grind";
  return "plain";
}

// ─── Is it coffee? ──────────────────────────────────────────────────────────

const COFFEE_WORDS = /قهوه|(?<!\p{L})بن(?!\p{L})|coffee|espresso|اسبريسو|blend|بلند|single origin|سينجل اوريجن|محصول|حبوب|beans?|arabica|ارابيكا|روبوستا|robusta|geisha|جيشا|decaf|ديكاف/u;
/** What a coffee shop sells that isn't coffee: gear, drinkware, syrups. */
const GEAR = /ماكينه|machine|مطحنه|grinder|غلايه|kettle|ابريق|ميزان|scale|كوبايه|(?<!\p{L})(?:كوب|مج|مجات|اكواب)(?!\p{L})|mug|(?<!\p{L})cups?(?!\p{L})|فنجان|فناجين|كنكه|cezve|دله|قمع|dripper|v60|chemex|كيمكس|french press|فرنش برس|moka pot|موكا بوت|aeropress|ايروبريس|tumbler|ترمس|thermos|فلتر ورق|فلاتر|filters|papers|سيروب|syrup|كريمر|creamer|شوكولاته|chocolate|مبشور|طقم/u;
/** Coffee that can't be ground again: already ground, capsules, instant, boxes. */
const NO_GRIND = /مطحون|ground|تركي|turkish|محوج|كبسول|capsule|(?<!\p{L})pods?(?!\p{L})|drip ?bag|درب باج|instant|سريعه الذوبان|نسكافيه|3 ?in ?1|ثري ان ون|جاهز|ready|بوكس|(?<!\p{L})box(?!\p{L})|هديه|gift/u;

export type CoffeeInput = {
  name: string;
  categoryName?: string | null;
  attributes: ProductAttribute[];
  sizes: string[];
  colors: string[];
  description?: string | null;
};

export type Origin = { id: string; label: string; ll: [number, number] | null };

export type CoffeeProfile = {
  /** The origin as the merchant gave it: one known country, or their own
   *  words for a blend ("البرازيل، إثيوبيا") or a place the map doesn't know. */
  origin: Origin | null;
  /** Every known country it comes from, in the merchant's order (map pins). */
  origins: Origin[];
  region: string | null;
  farm: string | null;
  process: string | null;
  altitude: string | null;
  variety: string | null;
  harvest: string | null;
  score: string | null;
  /** The merchant's roast words, and the level they mean. */
  roast: { level: RoastLevel; text: string } | null;
  notes: Note[];
  /** Brew methods the merchant named. */
  brew: BrewId[];
  /** Net weight in grams, when the merchant stated it (details or name). */
  grams: number | null;
  /** Details that aren't coffee fields, shown as plain specs. */
  rest: ProductAttribute[];
  /** Anything coffee-specific was found. */
  isCoffee: boolean;
};

/** Grams from "250 جم", "١ كيلو", "نص كيلو", "12oz". */
export function gramsOf(text: string | null | undefined): number | null {
  if (!text) return null;
  const t = norm(text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/٫/g, "."));
  if (/(?:^|\s)ربع كيلو(?:\s|$)/u.test(t)) return 250;
  if (/(?:^|\s)(?:نص|نصف) كيلو(?:\s|$)/u.test(t)) return 500;
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(كجم|كج|كيلو|كيلوجرام|kg|جم|جرام|غرام|غ|g|gm|gr|grams?|oz)(?=\s|$)/u);
  if (!m) return null;
  const v = Number(m[1].replace(",", "."));
  if (!Number.isFinite(v) || v <= 0) return null;
  const unit = m[2];
  const g = /كجم|كج|كيلو|kg/u.test(unit) ? v * 1000 : unit === "oz" ? v * 28.35 : v;
  return g >= 20 && g <= 5000 ? Math.round(g) : null;
}

export function readProfile(input: CoffeeInput): CoffeeProfile {
  const fromText = splitDescription(input.description).rows;
  const fields = new Map<Field, string>();
  const rest: ProductAttribute[] = [];
  for (const row of [...input.attributes, ...fromText]) {
    const f = fieldOf(row.key);
    if (!f) rest.push(row);
    else if (!fields.has(f)) fields.set(f, row.value);
  }
  const get = (f: Field) => fields.get(f) ?? null;

  const name = norm(input.name);
  const roastText = get("roast");
  const nameLooksCoffee = COFFEE_WORDS.test(name) || COFFEE_WORDS.test(norm(input.categoryName ?? ""));
  let roast = roastText ? roastOf(roastText) : null;
  // A roast word in the name ("بن برازيلي غامق") counts only on coffee.
  if (!roast && nameLooksCoffee) roast = roastOf(input.name);

  const originText = get("origin");
  const listed = originsIn(originText);
  const origins = listed.length ? listed : [originOf(get("region")) ?? originOf(input.name)].filter((o): o is Origin => !!o);
  const origin = originText ? (listed.length === 1 ? listed[0] : { id: norm(originText), label: originText, ll: null }) : (origins[0] ?? null);

  const notes = notesOf(get("notes"));
  const brew = brewsOf(get("brew"));
  // "بلد المنشأ: الصين" on a mug isn't coffee; a process, roast or notes are.
  const coffeeFields = !!(get("process") || get("altitude") || get("variety") || roastText || notes.length || get("farm") || get("score"));
  const isCoffee = coffeeFields || (!GEAR.test(name) && (nameLooksCoffee || !!(originText && origin?.ll)));

  return {
    origin,
    origins,
    region: get("region"),
    farm: get("farm"),
    process: get("process"),
    altitude: get("altitude"),
    variety: get("variety"),
    harvest: get("harvest"),
    score: get("score"),
    roast: roast ? { level: roast, text: roastText ?? roastLabel(roast) } : null,
    notes,
    brew,
    grams: gramsOf(get("weight")) ?? gramsOf(input.name),
    rest,
    isCoffee,
  };
}

/** Coffee sold as beans asks how to grind it — unless the store turned that
 *  off, the product is gear / already ground, or its own options are grinds. */
export function needsGrind(input: CoffeeInput, enabled: boolean, profile = readProfile(input)) {
  if (!enabled || !profile.isCoffee) return false;
  const name = norm(input.name);
  if (GEAR.test(name) || NO_GRIND.test(name)) return false;
  if (optionKind(input.colors) === "grind" || optionKind(input.sizes) === "grind") return false;
  return true;
}

/** The grind to suggest first: the one for the first brew method named (or
 *  suggested for the roast). */
export function suggestedGrind(profile: CoffeeProfile): GrindId | null {
  const first = profile.brew[0] ?? brewsForRoast(profile.roast?.level ?? null)[0];
  return first ? RECIPES[first].grind : null;
}

/** "إثيوبيا · مغسولة" — the card's kicker for a coffee. */
export function coffeeLine(p: CoffeeProfile) {
  return [p.origin?.label, p.process].filter(Boolean).join(" · ");
}

// ─── Origins ─────────────────────────────────────────────────────────────────

type OriginDef = { id: string; ll: [number, number]; re: RegExp; label: () => string };

// Most specific first (Sumatra before Indonesia). Regions and famous names
// point to their country ("يرجاتشيفي" → Ethiopia, "Kona" → Hawaii).
const ORIGINS: OriginDef[] = [
  { id: "ethiopia", ll: [8.2, 38.8], re: /اثيوبيا|اثيوبي|حبشه|حبشي|ethiopia|ethiopian|يرجاتشيفي|يرغاتشيفي|yirgacheffe|سيدامو|sidamo|هراري|هرر|harrar|harar|guji|جوجي|جيما|jimma|limu|ليمو/u, label: () => st("إثيوبيا") },
  { id: "kenya", ll: [-0.4, 36.9], re: /كينيا|كيني|kenya|kenyan|nyeri|نيري|kirinyaga/u, label: () => st("كينيا") },
  { id: "yemen", ll: [15.3, 43.9], re: /يمن|يمني|yemen|yemeni|mocha|mokha|مخا|حرازي|haraz|مطري|matari|بني مطر/u, label: () => st("اليمن") },
  { id: "colombia", ll: [2.2, -75.9], re: /كولومبيا|كولومبي|colombia|colombian|huila|هويلا|narino|نارينو|cauca|كاوكا|supremo|سوبريمو/u, label: () => st("كولومبيا") },
  { id: "brazil", ll: [-20.6, -45.4], re: /برازيل|برازيلي|brazil|brazilian|santos|سانتوس|cerrado|سيرادو|minas|ميناس|mogiana/u, label: () => st("البرازيل") },
  { id: "guatemala", ll: [15.3, -91.5], re: /جواتيمالا|غواتيمالا|جواتيمالي|guatemala|antigua|انتيجوا|huehuetenango/u, label: () => st("جواتيمالا") },
  { id: "costa-rica", ll: [9.7, -84.0], re: /كوستاريكا|كوستا ريكا|costa rica|tarrazu|تارازو/u, label: () => st("كوستاريكا") },
  { id: "honduras", ll: [14.6, -88.2], re: /هندوراس|honduras/u, label: () => st("هندوراس") },
  { id: "el-salvador", ll: [13.8, -89.4], re: /سلفادور|salvador/u, label: () => st("السلفادور") },
  { id: "nicaragua", ll: [13.1, -86.0], re: /نيكاراجوا|نيكاراغوا|nicaragua/u, label: () => st("نيكاراجوا") },
  { id: "panama", ll: [8.8, -82.4], re: /بنما|panama|boquete|بوكيتي/u, label: () => st("بنما") },
  { id: "mexico", ll: [16.2, -92.6], re: /مكسيك|مكسيكي|mexico|mexican|chiapas|تشياباس|veracruz/u, label: () => st("المكسيك") },
  { id: "peru", ll: [-5.9, -78.4], re: /بيرو|peru|peruvian|cajamarca/u, label: () => st("بيرو") },
  { id: "bolivia", ll: [-16.2, -67.7], re: /بوليفيا|bolivia/u, label: () => st("بوليفيا") },
  { id: "ecuador", ll: [-4.0, -79.2], re: /اكوادور|ecuador/u, label: () => st("الإكوادور") },
  { id: "jamaica", ll: [18.1, -76.6], re: /جامايكا|jamaica|blue mountain|بلو ماونتن/u, label: () => st("جامايكا") },
  { id: "hawaii", ll: [19.6, -155.9], re: /هاواي|hawaii|kona|كونا/u, label: () => st("هاواي") },
  { id: "rwanda", ll: [-2.0, 29.6], re: /رواندا|rwanda/u, label: () => st("رواندا") },
  { id: "burundi", ll: [-3.2, 29.9], re: /بوروندي|burundi/u, label: () => st("بوروندي") },
  { id: "tanzania", ll: [-3.3, 37.3], re: /تنزانيا|tanzania|kilimanjaro|كليمنجارو/u, label: () => st("تنزانيا") },
  { id: "uganda", ll: [1.1, 34.4], re: /اوغندا|uganda/u, label: () => st("أوغندا") },
  { id: "congo", ll: [-2.0, 28.9], re: /كونغو|كونجو|congo|kivu|كيفو/u, label: () => st("الكونغو") },
  { id: "india", ll: [12.4, 75.7], re: /الهند|هندي|india|indian|malabar|مالابار|chikmagalur|coorg/u, label: () => st("الهند") },
  { id: "sumatra", ll: [3.0, 98.6], re: /سومطره|sumatra|mandheling|ماندهيلنج|gayo|جايو|aceh/u, label: () => st("سومطرة") },
  { id: "java", ll: [-7.6, 110.4], re: /جاوه|java/u, label: () => st("جاوة") },
  { id: "sulawesi", ll: [-3.0, 119.9], re: /سولاويزي|sulawesi|toraja|توراجا/u, label: () => st("سولاويزي") },
  { id: "indonesia", ll: [-2.5, 113.5], re: /اندونيسيا|اندونيسي|indonesia|indonesian/u, label: () => st("إندونيسيا") },
  { id: "png", ll: [-6.1, 145.4], re: /بابوا|papua|غينيا الجديده/u, label: () => st("بابوا غينيا الجديدة") },
  { id: "vietnam", ll: [12.7, 108.0], re: /فيتنام|vietnam|vietnamese/u, label: () => st("فيتنام") },
  { id: "yunnan", ll: [22.8, 100.9], re: /يونان|yunnan|الصين|china|chinese/u, label: () => st("يونان، الصين") },
  { id: "thailand", ll: [19.9, 99.8], re: /تايلاند|thailand|thai/u, label: () => st("تايلاند") },
  { id: "laos", ll: [15.2, 106.5], re: /لاوس|laos/u, label: () => st("لاوس") },
  { id: "myanmar", ll: [21.0, 96.5], re: /ميانمار|myanmar|burma/u, label: () => st("ميانمار") },
  { id: "philippines", ll: [16.4, 120.6], re: /فلبين|philippines/u, label: () => st("الفلبين") },
  { id: "timor", ll: [-8.8, 125.6], re: /تيمور|timor/u, label: () => st("تيمور الشرقية") },
  { id: "cuba", ll: [20.1, -76.0], re: /كوبا|cuba|cuban/u, label: () => st("كوبا") },
  { id: "dominican", ll: [18.9, -70.4], re: /دومينيكان|dominican/u, label: () => st("الدومينيكان") },
  { id: "puerto-rico", ll: [18.2, -66.6], re: /بورتوريكو|puerto rico/u, label: () => st("بورتوريكو") },
  { id: "haiti", ll: [18.6, -72.5], re: /هايتي|haiti/u, label: () => st("هايتي") },
];

/** The coffee origin a text names, if it's one the map knows. */
/** Every known coffee origin a text names, in the order it names them. A
 *  region of a country (Sumatra) stands in for the country itself. */
export function originsIn(text: string | null | undefined): Origin[] {
  if (!text) return [];
  const t = norm(text);
  const found = ORIGINS.map((o) => ({ o, at: wordAt(t, o.re) })).filter((x) => x.at >= 0);
  const islands = found.some((x) => ["sumatra", "java", "sulawesi"].includes(x.o.id));
  return found
    .filter((x) => !(islands && x.o.id === "indonesia"))
    .sort((a, b) => a.at - b.at)
    .map(({ o }) => ({ id: o.id, label: o.label(), ll: o.ll }));
}

/** The first coffee origin a text names, if it's one the map knows. */
export function originOf(text: string | null | undefined): Origin | null {
  return originsIn(text)[0] ?? null;
}

// ─── The coffee belt (dot map) ───────────────────────────────────────────────
// Coarse land outlines (lon, lat) inside 32°N–32°S, enough for a dot map.
// The map spans lon −165…165; latitude is drawn 1.5× taller so the belt reads
// as a band, not a sliver, with the dot grid kept square (3° × 2°).

export const MAP = { west: -165, east: 165, north: 32, south: -32, lonStep: 3, latStep: 2, yScale: 15 };

const LAND: [number, number][][] = [
  // Mexico, Central America, the US Gulf coast
  [[-117, 32], [-114.5, 30], [-112, 27], [-109.8, 23], [-105.5, 22.5], [-105, 19.5], [-102.5, 18], [-98, 16], [-94, 16.2], [-92, 14.5], [-88, 13.2], [-87, 12.6], [-85.8, 11], [-85.5, 10], [-83.6, 8.5], [-81.5, 7.4], [-79.5, 8.2], [-77.5, 8.4], [-77.4, 8.9], [-79.5, 9.6], [-81.8, 8.9], [-83.6, 10.6], [-83.5, 14], [-83.2, 15.1], [-86, 15.9], [-88.4, 15.9], [-88.1, 18.5], [-87.4, 21.5], [-90.4, 21.1], [-91.5, 18.5], [-94.3, 18.2], [-96.2, 19.6], [-97.6, 22.2], [-97.4, 26], [-97, 28], [-94.8, 29.5], [-93, 29.8], [-90, 29.2], [-89, 30.3], [-85, 29.7], [-83, 29], [-82.6, 27.4], [-81.4, 25.3], [-80.2, 25.4], [-80, 27.2], [-81, 30.4], [-81.3, 32]],
  // Cuba, Hispaniola
  [[-85, 21.9], [-82, 22.8], [-77.5, 21.9], [-74.1, 20.2], [-77.6, 19.9], [-81.5, 21.4]],
  [[-74.5, 18.4], [-72.6, 19.9], [-68.4, 18.6], [-71.2, 17.7]],
  // South America
  [[-77.4, 8.6], [-75.5, 10.8], [-72, 12.3], [-71, 11], [-68, 10.6], [-63, 10.7], [-61, 9], [-58, 6.8], [-55, 5.9], [-52, 5], [-50, 1.8], [-49.5, -0.5], [-44.5, -2.5], [-40, -2.9], [-35, -5.3], [-35, -9], [-37, -11], [-38.9, -13.5], [-39, -17.8], [-40.8, -22], [-44.5, -23.3], [-48.6, -26], [-49.5, -29], [-51.2, -32], [-71.6, -32], [-71.5, -28], [-70.4, -23.6], [-70.3, -18.4], [-75, -15.3], [-77, -12], [-79.3, -7.5], [-81.3, -4.6], [-80, -2.5], [-80.1, 0], [-78.8, 1.5], [-77.4, 4], [-77.4, 6.8]],
  // Africa
  [[-9.6, 32], [-9.7, 30], [-12, 28], [-13.5, 27], [-16, 23.7], [-17, 21], [-16.2, 19], [-16.5, 16], [-17.4, 14.7], [-16.7, 12.5], [-15, 11], [-13.3, 9.5], [-11.5, 7], [-9, 5], [-7.5, 4.4], [-4, 5.2], [-2, 4.8], [1, 6], [4, 6.3], [6, 4.4], [8.5, 4.5], [9.7, 3.5], [9.5, 1], [9, -1], [11.8, -4.5], [12.3, -6], [13.2, -8.8], [13.7, -11.5], [12, -14.5], [11.8, -17.2], [14.5, -22.5], [15.3, -27], [16.5, -28.6], [18, -32], [29, -32], [32.6, -26], [35.5, -24], [35.4, -22], [34.6, -19.8], [36.5, -18], [40.5, -15], [40.6, -10.5], [39.3, -7], [39.2, -4.7], [40.8, -2], [43.5, 1], [46, 3], [48, 5], [49.5, 8], [51.3, 11.5], [51, 12], [48, 11.2], [44.8, 10.4], [43.3, 11.7], [42.6, 13], [41, 15], [39.5, 15.5], [38.5, 18], [37.3, 21], [36.9, 22], [35.6, 24], [34.7, 26.5], [33.8, 27.8], [32.6, 29.9], [32.3, 32]],
  // Madagascar
  [[49.3, -12], [50.5, -15.5], [49.4, -17.8], [47.3, -24.8], [45.2, -25.5], [43.6, -23.5], [44.3, -20], [44, -17], [46.5, -15.5], [48, -13.4]],
  // Sinai, the Levant, Arabia
  [[32.3, 32], [34.2, 31.3], [34.9, 29.4], [36.5, 26.5], [38.3, 24], [39.2, 21.5], [40.8, 19], [42.6, 16.5], [43.3, 13], [45, 12.8], [48.5, 14], [52.2, 15.6], [55.5, 17.5], [57.6, 18.8], [59.8, 22.4], [58.5, 23.7], [56.4, 24.9], [56.3, 26.2], [55, 25], [52, 24], [51.6, 25.9], [50.8, 24.7], [50.2, 26.5], [48.5, 28.5], [48, 30], [48.6, 32]],
  // Iran → India → Indochina → south China
  [[48.6, 32], [50.3, 29.6], [51.5, 27.9], [54, 26.6], [56.8, 27], [57.4, 25.7], [61.6, 25.2], [66.5, 25.4], [67.4, 24], [68.7, 23.6], [70, 22.5], [69.2, 22.3], [70.4, 20.9], [72.8, 21.2], [72.8, 19], [73.3, 16.5], [74.2, 14.7], [74.9, 12.7], [76.3, 9.5], [77.5, 8.1], [78.2, 8.9], [79.3, 10.3], [80.3, 13.5], [80.2, 15.5], [82.3, 17], [84.9, 19.3], [86.9, 20.8], [88.1, 21.8], [89, 21.7], [90.6, 22.5], [91.8, 22.3], [92.3, 20.7], [94.2, 18.8], [94.5, 16], [96, 16.6], [97.6, 16.5], [98.3, 13], [98.7, 10.4], [98.3, 8], [100.3, 6.4], [100.4, 4], [101.3, 2.8], [103.5, 1.3], [104.2, 1.5], [103.4, 4.2], [102.2, 6.2], [101, 6.9], [100.3, 8.4], [99.2, 9.2], [99.9, 12.5], [101, 12.7], [102.3, 12.2], [103, 11], [104.8, 8.6], [105.1, 9.9], [106.7, 10.4], [109.2, 11.6], [109.3, 13.4], [108.8, 15.4], [106.6, 17.5], [105.6, 18.9], [106.6, 20.5], [108, 21.6], [109.8, 21.5], [110.5, 20.3], [111.6, 21.6], [113.6, 22.2], [116.6, 22.9], [119.5, 25.5], [120.8, 28], [122, 30], [121.4, 32]],
  // Sri Lanka, Hainan, Taiwan
  [[79.9, 9.8], [81.3, 8.5], [81.8, 7], [81.2, 6.2], [80.1, 6], [79.8, 7.5]],
  [[108.7, 19.3], [110, 20.1], [111, 19.6], [110.2, 18.2], [109.1, 18.4]],
  [[121, 25.2], [122, 25], [121.4, 23], [120.8, 22], [120.1, 23]],
  // Sumatra, Java, Borneo, Sulawesi, the Philippines, New Guinea
  [[95.3, 5.6], [97.5, 5.2], [100.4, 2.2], [103.8, -1], [106, -3.1], [105.8, -5.8], [104.5, -5.9], [102.3, -4], [100.4, -1.1], [98.7, 1.7], [95.9, 3.8]],
  [[105.2, -6.8], [108.3, -6.2], [111, -6.4], [114.4, -7.7], [112.6, -8.4], [108.7, -7.8], [106.4, -7.4]],
  [[109, 1.5], [109.6, -1], [110.2, -2.9], [114.6, -4], [116.5, -3], [117.6, 0], [119, 1], [117.9, 4.1], [119.2, 5.4], [117, 7], [115.4, 5], [113.9, 4.6], [111.2, 2.5], [109.6, 2]],
  [[118.8, -3], [119.5, 0.2], [120.8, 1.2], [124.9, 1.5], [121, 0.5], [120.2, -1.3], [121.6, -1.9], [123.3, -4.6], [122, -4.8], [121, -2.7], [120.4, -5.5], [119.5, -5.5]],
  [[120.6, 18.5], [122.2, 18.5], [122, 16.4], [124, 13.9], [121.8, 13.8], [120.6, 14.4], [119.8, 16.3]],
  [[122, 8], [123.6, 8.7], [125.5, 9.8], [126.6, 7.3], [125.4, 5.6], [123.8, 7.4], [122.1, 6.9]],
  [[131, -1.2], [134, -0.9], [137.5, -1.5], [141, -2.6], [145, -4.3], [147.5, -6], [150, -10.3], [146.6, -8.9], [144, -7.8], [142.7, -9.3], [141, -9.1], [138, -8.4], [137.9, -5.3], [135.5, -4.4], [133.7, -3.7], [132, -2.9]],
  // Northern Australia
  [[113.5, -22], [114.2, -26.3], [115, -29.5], [115.3, -32], [152.6, -32], [153.2, -28], [153, -25.3], [150.8, -22.5], [149.5, -21.6], [146.3, -18.9], [145.4, -15], [143.7, -14], [142.5, -10.7], [141.6, -12.8], [141.5, -17.6], [139.6, -17.5], [136.5, -15.9], [135.9, -15], [137, -12.5], [136.6, -11.9], [132.6, -11.5], [131, -12.2], [129.6, -14.9], [127.1, -13.8], [125.1, -15.2], [122.3, -17], [121.1, -19.5], [117.4, -20.7], [114.6, -21.8]],
];

function inside(lon: number, lat: number, poly: [number, number][]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Map coordinates (viewBox units: 1° = 10) for a latitude / longitude. */
export function project([lat, lon]: [number, number]) {
  return { x: Math.round((lon - MAP.west) * 10), y: Math.round((MAP.north - lat) * MAP.yScale) };
}

export const MAP_SIZE = { w: (MAP.east - MAP.west) * 10, h: (MAP.north - MAP.south) * MAP.yScale };

let landCache: string | null = null;

/** Every land point of the grid as one path of zero-length strokes (drawn as
 *  round dots by `stroke-linecap: round`). Computed once. */
export function landDots(): string {
  if (landCache) return landCache;
  const parts: string[] = [];
  for (let lat = MAP.north - MAP.latStep / 2; lat > MAP.south; lat -= MAP.latStep) {
    for (let lon = MAP.west + MAP.lonStep / 2; lon < MAP.east; lon += MAP.lonStep) {
      if (LAND.some((poly) => inside(lon, lat, poly))) {
        const { x, y } = project([lat, lon]);
        parts.push(`M${x} ${y}h0`);
      }
    }
  }
  landCache = parts.join("");
  return landCache;
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────

export function waWith(href: string, text: string) {
  return `${href}?text=${encodeURIComponent(text)}`;
}

export function askAboutMessage(productName: string) {
  return st("السلام عليكم، عندي سؤال عن: {0}", productName);
}

export function joinMessage(storeName: string) {
  return st("السلام عليكم، عايز أعرف كل جديد {0} أول بأول.", storeName);
}

export function brewHelpMessage(storeName: string, method: string) {
  return st("السلام عليكم، عايز ترشيح بن من {0} يناسب {1}.", storeName, method);
}
