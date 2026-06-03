export type ArabicFontId =
  | "cairo"
  | "alexandria"
  | "tajawal"
  | "almarai"
  | "amiri"
  | "ibm-plex-sans-arabic"
  | "readex-pro"
  | "noto-sans-arabic"
  | "el-messiri"
  | "mada"
  | "reem-kufi";

export type ArabicFont = {
  id: ArabicFontId;
  name: string;
  family: string;
  googleUrl: string;
  sample: string;
};

export const ARABIC_FONTS: Record<ArabicFontId, ArabicFont> = {
  cairo: {
    id: "cairo",
    name: "Cairo",
    family: "'Cairo', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  alexandria: {
    id: "alexandria",
    name: "Alexandria",
    family: "'Alexandria', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  tajawal: {
    id: "tajawal",
    name: "Tajawal",
    family: "'Tajawal', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  almarai: {
    id: "almarai",
    name: "Almarai",
    family: "'Almarai', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  amiri: {
    id: "amiri",
    name: "Amiri",
    family: "'Amiri', serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  "ibm-plex-sans-arabic": {
    id: "ibm-plex-sans-arabic",
    name: "IBM Plex Sans Arabic",
    family: "'IBM Plex Sans Arabic', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  "readex-pro": {
    id: "readex-pro",
    name: "Readex Pro",
    family: "'Readex Pro', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  "noto-sans-arabic": {
    id: "noto-sans-arabic",
    name: "Noto Sans Arabic",
    family: "'Noto Sans Arabic', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  "el-messiri": {
    id: "el-messiri",
    name: "El Messiri",
    family: "'El Messiri', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  mada: {
    id: "mada",
    name: "Mada",
    family: "'Mada', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Mada:wght@400;500;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
  "reem-kufi": {
    id: "reem-kufi",
    name: "Reem Kufi",
    family: "'Reem Kufi', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;700&display=swap",
    sample: "أهلاً بك في متجرنا",
  },
};

export const ARABIC_FONT_LIST = Object.values(ARABIC_FONTS);

export function getArabicFont(id?: string | null): ArabicFont {
  return ARABIC_FONTS[(id as ArabicFontId) ?? "cairo"] ?? ARABIC_FONTS.cairo;
}

export const GOOGLE_FONTS_PRECONNECT_URLS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

// ─── Unified helper ──────────────────────────────────────────────────────────
// Returns the correct font object regardless of whether it's Arabic or English.
// Falls back to Cairo if the id is unknown.

import { ENGLISH_FONTS, type EnglishFont } from "./english-fonts";

export function getStoreFont(id?: string | null): ArabicFont | EnglishFont {
  if (!id) return ARABIC_FONTS.cairo;
  if (id in ARABIC_FONTS) return ARABIC_FONTS[id as ArabicFontId];
  if (id in ENGLISH_FONTS) return ENGLISH_FONTS[id as keyof typeof ENGLISH_FONTS];
  return ARABIC_FONTS.cairo;
}
