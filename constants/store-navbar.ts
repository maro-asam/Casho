export const STORE_NAVBAR_VARIANTS = [
  {
    value: "default",
    label: "الافتراضي",
    description: "الشكل الأساسي الحالي للمتجر",
  },
  {
    value: "centered",
    label: "منتصف أنيق",
    description: "اللوجو في النص والروابط موزعة بشكل مرتب",
  },
  {
    value: "compact",
    label: "مضغوط احترافي",
    description: "هيدر خفيف وسريع ويركز على البحث والعربة",
  },
  {
    value: "allaia",
    label: "إيديتوريال",
    description: "لوجو في المنتصف، روابط على الجانبين — مثالي لمتاجر الموضة",
  },
] as const;

export type StoreNavbarVariant =
  (typeof STORE_NAVBAR_VARIANTS)[number]["value"];
