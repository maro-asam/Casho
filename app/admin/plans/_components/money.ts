/** "299.5" (EGP) → 29950 piasters; null when empty/invalid. */
export function egpToPiasters(value: string): number | null {
  const v = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v) * 100);
}

/** 29950 → "299.5" for an input's initial value. */
export function piastersToEgpInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value / 100);
}
