/**
 * Shared core of Casho's gettext-style translations (dashboard + storefront).
 *
 * The Arabic source text IS the message key. A catalog holds one English
 * dictionary and resolves a source string to its English text:
 *   - exact match, then the whitespace-normalized key;
 *   - keys with positional slots ("{0} منتج") also match fully formed runtime
 *     strings ("12 منتج"), so text built before it reached the UI still finds
 *     its translation.
 */

export type Dictionary = Record<string, string>;

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type Pattern = { re: RegExp; template: string; slots: number[]; weight: number };

function buildPatterns(dict: Dictionary) {
  const out: Pattern[] = [];
  for (const [key, template] of Object.entries(dict)) {
    if (!/\{\d+\}/.test(key)) continue;
    // Require real fixed text, so "{0}" alone never swallows arbitrary data.
    const fixed = key.replace(/\{\d+\}/g, "");
    if (fixed.replace(/[\s\p{P}]/gu, "").length < 2) continue;
    const slots: number[] = [];
    const source = key
      .split(/(\{\d+\})/)
      .map((part) => {
        const m = part.match(/^\{(\d+)\}$/);
        if (m) {
          slots.push(Number(m[1]));
          return "(.+?)";
        }
        return escapeRe(part);
      })
      .join("");
    out.push({ re: new RegExp(`^${source}$`, "s"), template, slots, weight: fixed.length });
  }
  // Most specific first: "طلبك مع {0}. تقدر…" must win over a short "طلب {0}".
  return out.sort((a, b) => b.weight - a.weight);
}

/** The number in a slot value — also when it arrives formatted ("1,250", "١٢"). */
function countOf(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const digits = value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[^\d.]/g, "");
  return digits ? Number(digits) : null;
}

/**
 * Fill `{0}`, `{1}`… with the given values; unknown slots stay as written.
 * Translations can pick a word by count: `{0} {0|item|items}` → "1 item", "3 items".
 */
export function interpolate(template: string, args: readonly unknown[]) {
  if (args.length === 0) return template;
  return template
    .replace(/\{(\d+)\|([^|{}]*)\|([^|{}]*)\}/g, (match, i, one, other) => {
      const n = countOf(args[Number(i)]);
      return n === null ? match : n === 1 ? one : other;
    })
    .replace(/\{(\d+)\}/g, (match, i) => {
      const value = args[Number(i)];
      return value === undefined || value === null ? match : String(value);
    });
}

export type Catalog = {
  register(dict: Dictionary): void;
  has(): boolean;
  /** English text for an Arabic source string, or null when there is none. */
  lookup(source: string): string | null;
};

export function createCatalog(): Catalog {
  let english: Dictionary | null = null;
  let patterns: Pattern[] | null = null;

  function lookup(source: string, depth = 0): string | null {
    if (!english) return null;
    const direct = english[source];
    if (direct !== undefined) return direct;
    const normalized = normalize(source);
    if (normalized !== source && english[normalized] !== undefined) return english[normalized];
    patterns ??= buildPatterns(english);
    for (const p of patterns) {
      const m = normalized.match(p.re);
      if (!m) continue;
      const values: string[] = [];
      // Captured values can themselves be known text ("باقة سيلفر (شهري)").
      p.slots.forEach((slot, idx) => (values[slot] = (depth < 2 && lookup(m[idx + 1], depth + 1)) || m[idx + 1]));
      return interpolate(p.template, values);
    }
    return null;
  }

  return {
    register(dict) {
      if (english === dict) return;
      english = dict;
      patterns = null;
    },
    has: () => english !== null,
    lookup: (source) => lookup(source),
  };
}
