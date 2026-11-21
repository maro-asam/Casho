/**
 * Cleaning and normalizing lead contact data (pure). `normalizedPhone` is the
 * key for duplicate detection and for matching a paying merchant to a lead,
 * so it must produce the exact form signup stores: Egyptian numbers as
 * 01xxxxxxxxx (validations/auth.schema.ts), anything else as +<digits>.
 */
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import { BUSINESS_CATEGORIES } from "./constants";

/** Arabic-Indic / Persian digits → 0-9. */
export function toLatinDigits(value: string) {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Drops control characters and bidi/zero-width marks, collapses whitespace. */
export function cleanText(value: string | null | undefined, max = 500): string | null {
  if (value == null) return null;
  const v = String(value)
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return v ? v.slice(0, max) : null;
}

/** Multi-line notes: keep line breaks, drop other control characters. */
export function cleanNote(value: string | null | undefined, max = 2000): string | null {
  if (value == null) return null;
  const v = String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return v ? v.slice(0, max) : null;
}

/**
 * "+20 100 123 4567", "00201001234567", "٠١٠٠١٢٣٤٥٦٧", "1001234567" → "01001234567".
 * Egyptian landlines (02…, 03…) stay local; other countries become "+<digits>".
 * Null when it can't be a phone number.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let p = toLatinDigits(String(raw)).replace(/[\s\-().\u00a0/]/g, "");
  if (!p) return null;
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  if (p.startsWith("+20")) p = `0${p.slice(3)}`;
  else if (/^20(1[0125]\d{8})$/.test(p)) p = `0${p.slice(2)}`;
  else if (/^1[0125]\d{8}$/.test(p)) p = `0${p}`;

  if (/^01[0125]\d{8}$/.test(p)) return p; // Egyptian mobile
  if (/^0[2-9]\d{7,9}$/.test(p)) return p; // Egyptian landline
  if (/^\+[1-9]\d{6,14}$/.test(p) && !p.startsWith("+20")) return p; // international (E.164)
  return null;
}

export const isEgyptianMobile = (normalized: string | null | undefined) => !!normalized && /^01[0125]\d{8}$/.test(normalized);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string | null | undefined): string | null {
  const v = cleanText(raw, 254)?.toLowerCase().replace(/^mailto:/, "");
  return v && EMAIL_RE.test(v) ? v : null;
}

/** "example.com" → "https://example.com"; anything that isn't http(s) is rejected. */
export function normalizeWebsite(raw: string | null | undefined): string | null {
  const v = cleanText(raw, 300);
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** "@handle", "handle", "instagram.com/handle", full URL → "handle" (instagram) or a URL/handle (facebook). */
export function normalizeHandle(raw: string | null | undefined, host: "instagram.com" | "facebook.com"): string | null {
  const v = cleanText(raw, 300);
  if (!v) return null;
  const m = v.match(new RegExp(`(?:https?://)?(?:www\\.|m\\.)?${host.replace(".", "\\.")}/([^/?#\\s]+(?:/[^/?#\\s]+)?)`, "i"));
  const handle = (m ? m[1] : v).replace(/^@/, "").replace(/\/$/, "");
  return /^[\p{L}\p{N}._\-/]{1,100}$/u.test(handle) ? handle : null;
}

export function socialUrl(kind: "instagram" | "facebook", handle: string) {
  if (/^https?:\/\//i.test(handle)) return handle;
  return kind === "instagram" ? `https://instagram.com/${handle}` : `https://facebook.com/${handle}`;
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\s_\-]+/g, "");

/** A governorate typed any way ("cairo", "القاهره", "cairo ") → its Arabic name; anything else kept as typed. */
export function normalizeCity(raw: string | null | undefined): string | null {
  const v = cleanText(raw, 80);
  if (!v) return null;
  const f = fold(v);
  const hit = EGYPT_GOVERNORATES.find((g) => fold(g.name) === f || fold(g.nameEn) === f || fold(g.code) === f);
  return hit ? hit.name : v;
}

/** A category typed loosely → the signup list's spelling; anything else kept as typed. */
export function normalizeCategory(raw: string | null | undefined): string | null {
  const v = cleanText(raw, 80);
  if (!v) return null;
  const f = fold(v);
  return BUSINESS_CATEGORIES.find((c) => fold(c) === f) ?? v;
}
