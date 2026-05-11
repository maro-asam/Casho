export type PaymentRegion = "global" | "egypt" | "saudi";

export type PaymentMethodKey =
  | "paypal"
  | "visa_mastercard"
  | "apple_pay"
  | "google_pay"
  | "fawry"
  | "vodafone_cash"
  | "instapay"
  | "bank_transfer"
  | "cash_on_delivery"
  | "kashier"
  | "mada"
  | "stc_pay"
  | "tabby"
  | "tamara"
  | "saudi_bank_transfer";

export type PaymentMethodKind = "manual" | "online";

export type PaymentMethodConfig = {
  key: PaymentMethodKey;
  label: string;
  description: string;
  region: PaymentRegion;
  logo: string;
  manual: boolean;
  kind: PaymentMethodKind;
};

export const PAYMENT_REGION_LABELS: Record<PaymentRegion, string> = {
  global: "بوابات دفع عالمية",
  egypt: "بوابات دفع مصرية",
  saudi: "بوابات دفع سعودية",
};

export const PAYMENT_REGION_DESCRIPTIONS: Record<PaymentRegion, string> = {
  global:
    "وسائل دفع مناسبة للعملاء من خارج مصر والسعودية أو للمدفوعات الدولية.",
  egypt: "وسائل دفع مناسبة للسوق المصري والتحويلات المحلية.",
  saudi: "وسائل دفع مناسبة للسوق السعودي والتحويلات المحلية.",
};

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    key: "paypal",
    label: "PayPal",
    description: "العميل يدفع أو يحول على حساب PayPal الخاص بالتاجر.",
    region: "global",
    logo: "/payment-logos/paypal.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "visa_mastercard",
    label: "Visa / Mastercard",
    description: "الدفع أو التحويل من خلال بيانات البطاقات البنكية العالمية.",
    region: "global",
    logo: "/payment-logos/visa-mastercard.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "apple_pay",
    label: "Apple Pay",
    description: "الدفع باستخدام Apple Pay، أو عرض تعليمات الدفع الخاصة بها.",
    region: "global",
    logo: "/payment-logos/apple-pay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "google_pay",
    label: "Google Pay",
    description: "الدفع باستخدام Google Pay، أو عرض تعليمات الدفع الخاصة بها.",
    region: "global",
    logo: "/payment-logos/google-pay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "fawry",
    label: "فوري",
    description: "العميل يدفع من خلال فوري ثم يرسل بيانات العملية.",
    region: "egypt",
    logo: "/payment-logos/fawry.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "vodafone_cash",
    label: "فودافون كاش / محفظة الكترونية",
    description: "العميل يحول على رقم فودافون كاش الخاص بالتاجر.",
    region: "egypt",
    logo: "/payment-logos/vodafone-cash.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "instapay",
    label: "انستاباي",
    description: "العميل يحول على عنوان InstaPay أو رقم الحساب.",
    region: "egypt",
    logo: "/payment-logos/instapay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "bank_transfer",
    label: "تحويل بنكي",
    description: "العميل يحول على الحساب البنكي المصري الخاص بالتاجر.",
    region: "egypt",
    logo: "/payment-logos/bank-transfer.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "cash_on_delivery",
    label: "الدفع عند الاستلام",
    description: "العميل يدفع كاش عند استلام الطلب.",
    region: "egypt",
    logo: "/payment-logos/cash-on-delivery.svg",
    manual: false,
    kind: "manual",
  },
  {
    key: "kashier",
    label: "Kashier",
    description: "بوابة دفع مصرية للبطاقات والمحافظ الإلكترونية.",
    region: "egypt",
    logo: "/payment-logos/kashier.svg",
    manual: false,
    kind: "online",
  },
  {
    key: "mada",
    label: "mada",
    description: "الدفع أو التحويل باستخدام بطاقات مدى السعودية.",
    region: "saudi",
    logo: "/payment-logos/mada.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "stc_pay",
    label: "STC Pay",
    description: "العميل يحول على رقم STC Pay الخاص بالتاجر.",
    region: "saudi",
    logo: "/payment-logos/stc-pay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "tabby",
    label: "Tabby",
    description: "اشتر الآن وادفع لاحقًا من خلال Tabby.",
    region: "saudi",
    logo: "/payment-logos/tabby.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "tamara",
    label: "Tamara",
    description: "اشتر الآن وادفع لاحقًا من خلال Tamara.",
    region: "saudi",
    logo: "/payment-logos/tamara.svg",
    manual: true,
    kind: "manual",
  },
];

export const PAYMENT_METHODS_BY_KEY = PAYMENT_METHODS.reduce(
  (acc, method) => {
    acc[method.key] = method;
    return acc;
  },
  {} as Record<PaymentMethodKey, PaymentMethodConfig>,
);

export const MANUAL_PAYMENT_METHOD_KEYS: PaymentMethodKey[] =
  PAYMENT_METHODS.filter((method) => method.manual).map((method) => method.key);

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

export function getPaymentMethodByKey(key: string) {
  return PAYMENT_METHODS.find((method) => method.key === key);
}

export function getPaymentMethodLabel(key: string) {
  return getPaymentMethodByKey(key)?.label ?? key;
}

export function getPaymentMethodsByRegion(region: PaymentRegion) {
  return PAYMENT_METHODS.filter((method) => method.region === region);
}

export function isManualPaymentMethod(key: string) {
  return PAYMENT_METHODS.some((method) => method.key === key && method.manual);
}
