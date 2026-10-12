// Product colors are free text ("أسود", "Navy", "#1f2a44"). Map the common
// names to swatch colors; unknown names render as text chips instead.

const NAMED: Record<string, string> = {
  "أسود": "#111111", "اسود": "#111111", black: "#111111",
  "أبيض": "#ffffff", "ابيض": "#ffffff", white: "#ffffff",
  "رمادي": "#9ca3af", "رصاصي": "#9ca3af", gray: "#9ca3af", grey: "#9ca3af",
  "فضي": "#c0c4c8", silver: "#c0c4c8",
  "ذهبي": "#c9a227", gold: "#c9a227",
  "أحمر": "#c81e1e", "احمر": "#c81e1e", red: "#c81e1e",
  "نبيتي": "#6d1a2a", "عنابي": "#6d1a2a", burgundy: "#6d1a2a", maroon: "#6d1a2a",
  "وردي": "#f4a6c0", "بمبي": "#f4a6c0", pink: "#f4a6c0",
  "فوشيا": "#d61f8c", fuchsia: "#d61f8c",
  "برتقالي": "#ea7a1f", orange: "#ea7a1f",
  "أصفر": "#f2c94c", "اصفر": "#f2c94c", yellow: "#f2c94c",
  "أخضر": "#2f8a4c", "اخضر": "#2f8a4c", green: "#2f8a4c",
  "زيتي": "#5b6b2f", olive: "#5b6b2f",
  "أزرق": "#2563eb", "ازرق": "#2563eb", blue: "#2563eb",
  "كحلي": "#1f2a44", navy: "#1f2a44",
  "لبني": "#9cc7e8", "سماوي": "#9cc7e8", "sky blue": "#9cc7e8",
  "تركواز": "#1aa6a6", turquoise: "#1aa6a6",
  "بنفسجي": "#7c4dbe", "موف": "#9b7bc4", purple: "#7c4dbe",
  "بني": "#7a4b2a", brown: "#7a4b2a",
  "بيج": "#e3d3b8", beige: "#e3d3b8",
  "كريمي": "#f3ead7", "أوف وايت": "#f5f1e8", cream: "#f3ead7", "off white": "#f5f1e8",
  "جملي": "#c19a6b", camel: "#c19a6b",
};

const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;

/** CSS color for a product color label, or null when it isn't recognizable. */
export function swatchColor(label: string): string | null {
  const v = label.trim();
  if (HEX.test(v)) return v;
  return NAMED[v.toLowerCase()] ?? null;
}
