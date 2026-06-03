export type EnglishFontId =
  | "inter"
  | "poppins"
  | "montserrat"
  | "raleway"
  | "playfair-display"
  | "dm-sans"
  | "nunito"
  | "lato"
  | "josefin-sans"
  | "cormorant-garamond";

export type EnglishFont = {
  id: EnglishFontId;
  name: string;
  family: string;
  googleUrl: string;
  sample: string;
};

export const ENGLISH_FONTS: Record<EnglishFontId, EnglishFont> = {
  inter: {
    id: "inter",
    name: "Inter",
    family: "'Inter', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  poppins: {
    id: "poppins",
    name: "Poppins",
    family: "'Poppins', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  montserrat: {
    id: "montserrat",
    name: "Montserrat",
    family: "'Montserrat', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  raleway: {
    id: "raleway",
    name: "Raleway",
    family: "'Raleway', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  "playfair-display": {
    id: "playfair-display",
    name: "Playfair Display",
    family: "'Playfair Display', serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  "dm-sans": {
    id: "dm-sans",
    name: "DM Sans",
    family: "'DM Sans', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  nunito: {
    id: "nunito",
    name: "Nunito",
    family: "'Nunito', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  lato: {
    id: "lato",
    name: "Lato",
    family: "'Lato', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
    sample: "Welcome to Our Store",
  },
  "josefin-sans": {
    id: "josefin-sans",
    name: "Josefin Sans",
    family: "'Josefin Sans', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
  "cormorant-garamond": {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    family: "'Cormorant Garamond', serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap",
    sample: "Welcome to Our Store",
  },
};

export const ENGLISH_FONT_LIST = Object.values(ENGLISH_FONTS);

export function getEnglishFont(id?: string | null): EnglishFont {
  return ENGLISH_FONTS[(id as EnglishFontId) ?? "inter"] ?? ENGLISH_FONTS.inter;
}
