// Fields a Casho example can belong to. Keys are stored on ShowcaseSite.category;
// labels come from here so the landing can show them in Arabic and English.

export const SHOWCASE_CATEGORIES = {
  fashion: { ar: "ملابس وأزياء", en: "Fashion" },
  beauty: { ar: "تجميل وعناية", en: "Beauty" },
  jewelry: { ar: "مجوهرات وإكسسوارات", en: "Jewelry" },
  electronics: { ar: "إلكترونيات", en: "Electronics" },
  home: { ar: "بيت وديكور", en: "Home & decor" },
  food: { ar: "أكل ومشروبات", en: "Food & drinks" },
  grocery: { ar: "سوبر ماركت", en: "Grocery" },
  pharmacy: { ar: "صيدلية وصحة", en: "Pharmacy" },
  sports: { ar: "رياضة ومكملات", en: "Sports" },
  kids: { ar: "أطفال ولعب", en: "Kids & toys" },
  books: { ar: "كتب ومكتبة", en: "Books" },
  digital: { ar: "منتجات رقمية", en: "Digital" },
  other: { ar: "مجالات تانية", en: "Other" },
} as const;

export type ShowcaseCategory = keyof typeof SHOWCASE_CATEGORIES;

export const SHOWCASE_CATEGORY_KEYS = Object.keys(SHOWCASE_CATEGORIES) as ShowcaseCategory[];

export function isShowcaseCategory(value: string): value is ShowcaseCategory {
  return Object.hasOwn(SHOWCASE_CATEGORIES, value);
}

/** Unknown keys (a category removed from the list later) fall back to "other". */
export function showcaseCategory(value: string): ShowcaseCategory {
  return isShowcaseCategory(value) ? value : "other";
}
