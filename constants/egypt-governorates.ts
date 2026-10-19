// Egypt's 27 governorates. `code` is what we store (ShippingGovernorateRate,
// Order.governorate, the checkout cookie); `name` is what customers see;
// `nameEn` is what courier APIs get.
export const EGYPT_GOVERNORATES = [
  { code: "cairo", name: "القاهرة", nameEn: "Cairo" },
  { code: "giza", name: "الجيزة", nameEn: "Giza" },
  { code: "alexandria", name: "الإسكندرية", nameEn: "Alexandria" },
  { code: "qalyubia", name: "القليوبية", nameEn: "Qalyubia" },
  { code: "sharqia", name: "الشرقية", nameEn: "Sharqia" },
  { code: "dakahlia", name: "الدقهلية", nameEn: "Dakahlia" },
  { code: "gharbia", name: "الغربية", nameEn: "Gharbia" },
  { code: "monufia", name: "المنوفية", nameEn: "Monufia" },
  { code: "beheira", name: "البحيرة", nameEn: "Beheira" },
  { code: "kafr_el_sheikh", name: "كفر الشيخ", nameEn: "Kafr El Sheikh" },
  { code: "damietta", name: "دمياط", nameEn: "Damietta" },
  { code: "port_said", name: "بورسعيد", nameEn: "Port Said" },
  { code: "ismailia", name: "الإسماعيلية", nameEn: "Ismailia" },
  { code: "suez", name: "السويس", nameEn: "Suez" },
  { code: "fayoum", name: "الفيوم", nameEn: "Fayoum" },
  { code: "beni_suef", name: "بني سويف", nameEn: "Beni Suef" },
  { code: "minya", name: "المنيا", nameEn: "Minya" },
  { code: "asyut", name: "أسيوط", nameEn: "Asyut" },
  { code: "sohag", name: "سوهاج", nameEn: "Sohag" },
  { code: "qena", name: "قنا", nameEn: "Qena" },
  { code: "luxor", name: "الأقصر", nameEn: "Luxor" },
  { code: "aswan", name: "أسوان", nameEn: "Aswan" },
  { code: "red_sea", name: "البحر الأحمر", nameEn: "Red Sea" },
  { code: "new_valley", name: "الوادي الجديد", nameEn: "New Valley" },
  { code: "matrouh", name: "مطروح", nameEn: "Matrouh" },
  { code: "north_sinai", name: "شمال سيناء", nameEn: "North Sinai" },
  { code: "south_sinai", name: "جنوب سيناء", nameEn: "South Sinai" },
] as const;

export type GovernorateCode = (typeof EGYPT_GOVERNORATES)[number]["code"];

const NAMES = new Map<string, string>(EGYPT_GOVERNORATES.map((g) => [g.code, g.name]));

export function isGovernorateCode(value: unknown): value is GovernorateCode {
  return typeof value === "string" && NAMES.has(value);
}

/** English name, as courier APIs expect for the receiver city. */
export function governorateNameEn(code: string | null | undefined): string | null {
  return EGYPT_GOVERNORATES.find((g) => g.code === code)?.nameEn ?? null;
}

export function governorateName(code: string | null | undefined): string | null {
  return code ? (NAMES.get(code) ?? null) : null;
}
