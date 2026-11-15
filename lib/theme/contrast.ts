// WCAG contrast helpers — used to keep merchant-picked colors readable.

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function luminance([r, g, b]: [number, number, number]) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(a: string, b: string) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 1;
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Best text color (near-white / near-black) to sit on `bg`. */
export function readableOn(bg: string) {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#0a0a0a") ? "#ffffff" : "#0a0a0a";
}

/** `a` mixed into `b`: weight 1 = all `a`. Null when either isn't a 6-digit hex. */
export function mixHex(a: string, b: string, weight: number): string | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  return rgbToHex(...(ra.map((v, i) => v * weight + rb[i] * (1 - weight)) as [number, number, number]));
}

/**
 * `color` as text on `bg`: the color itself when it already reads, otherwise
 * stepped toward black (light bg) or white (dark bg) until it reaches `min`.
 */
export function inkOn(color: string, bg: string, min = 4.5): string | null {
  if (!hexToRgb(color) || !hexToRgb(bg)) return null;
  const toward = readableOn(bg) === "#ffffff" ? "#ffffff" : "#000000";
  for (let w = 1; w >= 0; w -= 0.05) {
    const candidate = mixHex(color, toward, w)!;
    if (contrastRatio(candidate, bg) >= min) return candidate;
  }
  return toward;
}
