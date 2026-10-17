// One canonical form per phone number, so "+20 101 234 5678", "00201012345678"
// and "01012345678" are the same customer for reputation and the blocklist.

/** Egyptian mobiles → local "01XXXXXXXXX"; anything else → its digits (with "+" if it had one). */
export function canonicalPhone(raw: string) {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^201\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^01\d{9}$/.test(digits)) return digits;
  return trimmed.startsWith("+") || trimmed.startsWith("00") ? `+${digits}` : digits;
}

/** Spellings older orders may have stored for the same number (before canonicalisation). */
export function phoneVariants(raw: string) {
  const canonical = canonicalPhone(raw);
  if (!/^01\d{9}$/.test(canonical)) return [canonical];
  const intl = `20${canonical.slice(1)}`;
  return [canonical, intl, `+${intl}`, `00${intl}`];
}

/** "010•••••678" — enough for a customer to recognise their number. */
export function maskPhone(raw: string) {
  const digits = canonicalPhone(raw).replace(/\D/g, "");
  if (digits.length < 6) return digits;
  return `${digits.slice(0, 3)}${"•".repeat(digits.length - 6)}${digits.slice(-3)}`;
}

/** E.164 for SMS / WhatsApp providers. */
export function toE164(raw: string) {
  const canonical = canonicalPhone(raw);
  if (/^01\d{9}$/.test(canonical)) return `+20${canonical.slice(1)}`;
  return canonical.startsWith("+") ? canonical : `+${canonical}`;
}
