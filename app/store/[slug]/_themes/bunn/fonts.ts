import { Fraunces, Noto_Kufi_Arabic } from "next/font/google";

/** Bunn's display faces. Arabic sets in Noto Kufi Arabic — square, sturdy,
 *  the letters of a roastery's stamp and bag label; Latin (and English
 *  stores) in Fraunces, the soft old-style serif of coffee packaging. The
 *  stack lists Fraunces first, so Latin glyphs come from it and Arabic falls
 *  through to the Kufi. Body text keeps the merchant's chosen store font. */
export const bunnArabic = Noto_Kufi_Arabic({
  subsets: ["arabic", "latin"],
  weight: "variable",
  variable: "--font-bunn-arabic",
  display: "swap",
});

/** No metric fallback: next/font would add a local Times-like face right after
 *  Fraunces, and that face has Arabic glyphs — it would take Arabic text away
 *  from the Kufi. While Fraunces loads, Latin falls to the Kufi's own Latin. */
export const bunnLatin = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "SOFT"],
  variable: "--font-bunn-latin",
  display: "swap",
  adjustFontFallback: false,
  fallback: [],
});
