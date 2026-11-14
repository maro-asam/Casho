/**
 * Text helpers shared by every provider's mappers (pure, no I/O).
 */

export function clean(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  times: "×",
  copy: "©",
  reg: "®",
  trade: "™",
};

/** Decodes HTML entities (named + numeric). WordPress escapes names and titles this way. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Source descriptions are HTML; Casho stores plain text with line breaks. */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = decodeEntities(
    html
      .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\s*\/\s*(p|div|h[1-6]|li|tr)\s*>/gi, "\n")
      .replace(/<\s*li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

/**
 * Casho stores Egyptian numbers in local form (01xxxxxxxxx). Sources store
 * E.164 (+201xxxxxxxxx) or whatever the shopper typed. Other countries keep
 * their international form.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let phone = toLatinDigits(raw).replace(/[\s\-().]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (phone.startsWith("+20")) phone = `0${phone.slice(3)}`;
  else if (/^20(1\d{9})$/.test(phone)) phone = `0${phone.slice(2)}`;
  else if (/^1[0125]\d{8}$/.test(phone)) phone = `0${phone}`;
  if (!/^\+?\d{6,15}$/.test(phone)) return null;
  return phone;
}

/** Arabic-Indic / Persian digits → 0-9 (shoppers type both). */
function toLatinDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

export type AddressParts = {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  zip?: string | null;
} | null;

export function formatAddress(address: AddressParts): string | null {
  if (!address) return null;
  const parts = [address.address1, address.address2, address.city, address.province, address.country, address.zip]
    .map(clean)
    .filter(Boolean);
  return parts.length > 0 ? parts.join("، ") : null;
}
