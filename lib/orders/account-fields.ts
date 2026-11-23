// ─────────────────────────────────────────────────────────────────────────────
//  Account fields — what a game/app top-up is sent to
//
//  A top-up store (the Arena theme) asks for the player's ID and, optionally,
//  their in-game name. They ride on the cart line's `selectedFeatures` next to
//  size / color, so they reach the order page, the invoice, the order emails
//  and order tracking (each labels the keys) with no extra column. Two
//  packages for two players are two cart lines.
// ─────────────────────────────────────────────────────────────────────────────

export const PLAYER_ID_KEY = "playerId";
export const PLAYER_NAME_KEY = "playerName";

const MAX_KEYS = 6;
const MAX_VALUE = 80;
const KEY_PATTERN = /^[A-Za-z][\w-]{0,31}$/;
// Control characters and bidi overrides would garble the merchant's order page.
const UNPRINTABLE = /[\u0000-\u001f\u007f‪-‮⁦-⁩]/g;

/**
 * The options a shopper sends with an add-to-cart, cleaned: plain keys, short
 * trimmed text values, empty ones dropped. Null when nothing is left.
 */
export function cleanSelectedFeatures(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_KEYS) break;
    if (typeof raw !== "string" || !KEY_PATTERN.test(key)) continue;
    const value = raw.replace(UNPRINTABLE, "").replace(/\s+/g, " ").trim().slice(0, MAX_VALUE);
    if (value) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** A player ID as games print them: letters, digits and a few separators, 3–40 long. */
export function isPlausiblePlayerId(value: string): boolean {
  return /^[\p{L}\p{N}_.#@:-]{3,40}$/u.test(value.trim());
}
