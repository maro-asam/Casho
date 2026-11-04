import { Amiri, Cormorant_Garamond } from "next/font/google";

/** Qirat's display faces. Arabic sets in Amiri, a classic book naskh; Latin
 *  (store names, brand words) in Cormorant Garamond, the jeweler's serif. The
 *  stack lists Cormorant first, so Latin glyphs come from it and Arabic ones
 *  fall through to Amiri. Body text keeps the merchant's chosen store font. */
export const qiratArabic = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-qirat-arabic",
  display: "swap",
});

/** No metric fallback: next/font would add a local Times-like face right after
 *  Cormorant, and that face has Arabic glyphs — it would take Arabic text away
 *  from Amiri. While Cormorant loads, Latin falls to Amiri's own Latin. */
export const qiratLatin = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-qirat-latin",
  display: "swap",
  adjustFontFallback: false,
  fallback: [],
});
