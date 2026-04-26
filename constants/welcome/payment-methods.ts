export type PaymentMethodKey =
  | "cash_on_delivery"
  | "vodafone_cash"
  | "instapay"
  | "fawry"
  | "bank_transfer"
  | "kashier";

export type PaymentMethodKind = "manual" | "online";

export const PAYMENT_METHODS: {
  key: PaymentMethodKey;
  label: string;
  description: string;
  kind: PaymentMethodKind;
}[] = [
  {
    key: "cash_on_delivery",
    label: "الدفع عند الاستلام",
    description: "العميل يدفع كاش عند وصول الطلب",
    kind: "manual",
  },
  {
    key: "vodafone_cash",
    label: "فودافون كاش",
    description: "تحويل على محفظة فودافون كاش الخاصة بالمتجر",
    kind: "manual",
  },
  {
    key: "instapay",
    label: "إنستا باي",
    description: "تحويل مباشر على InstaPay الخاص بالمتجر",
    kind: "manual",
  },
  {
    key: "fawry",
    label: "فوري",
    description: "وسيلة جاهزة لو حبيت ترجعها لاحقًا",
    kind: "manual",
  },
  {
    key: "bank_transfer",
    label: "تحويل بنكي",
    description: "تحويل على بيانات الحساب البنكي الخاصة بالمتجر",
    kind: "manual",
  },
  {
    key: "kashier",
    label: "دفع أونلاين عبر Kashier",
    description: "بطاقات ومحافظ وتقسيط من خلال بوابة Kashier",
    kind: "online",
  },
];

export const KASHIER_ALLOWED_METHODS = [
  {
    key: "card",
    label: "بطاقات بنكية",
    description: "Visa / Mastercard / Meeza حسب تفعيل حساب Kashier",
  },
  {
    key: "wallet",
    label: "محافظ إلكترونية",
    description: "Vodafone Cash وغيرها من المحافظ المدعومة داخل Kashier",
  },
  {
    key: "bank_installments",
    label: "تقسيط بنكي",
    description: "التقسيط المتاح حسب إعدادات حساب Kashier",
  },
] as const;

export type KashierAllowedMethod =
  (typeof KASHIER_ALLOWED_METHODS)[number]["key"];

export const MANUAL_PAYMENT_METHOD_KEYS: PaymentMethodKey[] = [
  "cash_on_delivery",
  "vodafone_cash",
  "instapay",
  "bank_transfer",
];

export function getPaymentMethodLabel(key: string) {
  return PAYMENT_METHODS.find((method) => method.key === key)?.label ?? key;
}
