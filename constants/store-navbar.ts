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
] as const;

export type StoreNavbarVariant =
  (typeof STORE_NAVBAR_VARIANTS)[number]["value"];
