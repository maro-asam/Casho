// ─────────────────────────────────────────────────────────────────────────────
//  Store currency — what a storefront shows its prices in
//
//  `StoreSettings.storeCurrency` (ISO 4217). It only changes how amounts are
//  written (the storefront, order tracking and order emails); the numbers are
//  stored the same way in every currency — product prices in whole units,
//  shipping and order totals in hundredths. Online payment (Paymob) settles in
//  EGP, so a store in any other currency can't offer it.
// ─────────────────────────────────────────────────────────────────────────────

export const STORE_CURRENCIES = ["EGP", "SDG", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "JOD", "IQD", "LYD", "USD"] as const;

export type StoreCurrency = (typeof STORE_CURRENCIES)[number];

export const DEFAULT_STORE_CURRENCY: StoreCurrency = "EGP";

export function isStoreCurrency(value: unknown): value is StoreCurrency {
  return STORE_CURRENCIES.includes(value as StoreCurrency);
}

/** Normalize a stored `storeCurrency` value (anything unknown → EGP). */
export function toStoreCurrency(value: unknown): StoreCurrency {
  return isStoreCurrency(value) ? value : DEFAULT_STORE_CURRENCY;
}

/** Names in Arabic (the source text) and English — for the settings picker. */
export const STORE_CURRENCY_NAMES: Record<StoreCurrency, { ar: string; en: string }> = {
  EGP: { ar: "جنيه مصري", en: "Egyptian pound" },
  SDG: { ar: "جنيه سوداني", en: "Sudanese pound" },
  SAR: { ar: "ريال سعودي", en: "Saudi riyal" },
  AED: { ar: "درهم إماراتي", en: "UAE dirham" },
  KWD: { ar: "دينار كويتي", en: "Kuwaiti dinar" },
  QAR: { ar: "ريال قطري", en: "Qatari riyal" },
  BHD: { ar: "دينار بحريني", en: "Bahraini dinar" },
  OMR: { ar: "ريال عماني", en: "Omani rial" },
  JOD: { ar: "دينار أردني", en: "Jordanian dinar" },
  IQD: { ar: "دينار عراقي", en: "Iraqi dinar" },
  LYD: { ar: "دينار ليبي", en: "Libyan dinar" },
  USD: { ar: "دولار أمريكي", en: "US dollar" },
};

/** Paymob charges in EGP: a store priced in anything else can't take online payment. */
export function supportsOnlinePayment(currency: unknown): boolean {
  return toStoreCurrency(currency) === "EGP";
}
