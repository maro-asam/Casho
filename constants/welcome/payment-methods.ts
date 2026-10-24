import { tr } from "@/lib/i18n/dashboard";
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
  | "paymob"
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
  /** No longer offered — kept so old orders still show a name. */
  retired?: boolean;
};

export const PAYMENT_REGION_LABELS: Record<PaymentRegion, string> = {
  get global() { return tr("بوابات دفع عالمية"); },
  get egypt() { return tr("بوابات دفع مصرية"); },
  get saudi() { return tr("بوابات دفع سعودية"); },
};

export const PAYMENT_REGION_DESCRIPTIONS: Record<PaymentRegion, string> = {
  get global() { return tr("وسائل دفع مناسبة للعملاء من خارج مصر والسعودية أو للمدفوعات الدولية."); },
  get egypt() { return tr("وسائل دفع مناسبة للسوق المصري والتحويلات المحلية."); },
  get saudi() { return tr("وسائل دفع مناسبة للسوق السعودي والتحويلات المحلية."); },
};

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    key: "paypal",
    label: "PayPal",
    get description() { return tr("العميل يدفع أو يحول على حساب PayPal الخاص بالتاجر."); },
    region: "global",
    logo: "/payment-logos/paypal.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "visa_mastercard",
    label: "Visa / Mastercard",
    get description() { return tr("الدفع أو التحويل من خلال بيانات البطاقات البنكية العالمية."); },
    region: "global",
    logo: "/payment-logos/visa-mastercard.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "apple_pay",
    label: "Apple Pay",
    get description() { return tr("الدفع باستخدام Apple Pay، أو عرض تعليمات الدفع الخاصة بها."); },
    region: "global",
    logo: "/payment-logos/apple-pay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "google_pay",
    label: "Google Pay",
    get description() { return tr("الدفع باستخدام Google Pay، أو عرض تعليمات الدفع الخاصة بها."); },
    region: "global",
    logo: "/payment-logos/google-pay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "fawry",
    get label() { return tr("فوري"); },
    get description() { return tr("العميل يدفع من خلال فوري ثم يرسل بيانات العملية."); },
    region: "egypt",
    logo: "/payment-logos/fawry.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "vodafone_cash",
    get label() { return tr("فودافون كاش / محفظة الكترونية"); },
    get description() { return tr("العميل يحول على رقم فودافون كاش الخاص بالتاجر."); },
    region: "egypt",
    logo: "/payment-logos/vodafone-cash.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "instapay",
    get label() { return tr("انستاباي"); },
    get description() { return tr("العميل يحول على عنوان InstaPay أو رقم الحساب."); },
    region: "egypt",
    logo: "/payment-logos/instapay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "bank_transfer",
    get label() { return tr("تحويل بنكي"); },
    get description() { return tr("العميل يحول على الحساب البنكي المصري الخاص بالتاجر."); },
    region: "egypt",
    logo: "/payment-logos/bank-transfer.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "cash_on_delivery",
    get label() { return tr("الدفع عند الاستلام"); },
    get description() { return tr("العميل يدفع كاش عند استلام الطلب."); },
    region: "egypt",
    logo: "/payment-logos/cash-on-delivery.svg",
    manual: false,
    kind: "manual",
  },
  {
    key: "paymob",
    // Named for what the customer does, not the gateway — shown at checkout.
    get label() { return tr("كارت أو محفظة إلكترونية"); },
    get description() { return tr("فيزا، ماستركارد، ميزة، فودافون كاش، أورنج كاش، اتصالات كاش وWE Pay — دفع آمن عن طريق Paymob."); },
    region: "egypt",
    logo: "/payment-logos/paymob.svg",
    manual: false,
    kind: "online",
  },
  {
    key: "kashier",
    label: "Kashier",
    get description() { return tr("بوابة دفع مصرية للبطاقات والمحافظ الإلكترونية."); },
    region: "egypt",
    logo: "/payment-logos/kashier.svg",
    manual: false,
    kind: "online",
    retired: true,
  },
  {
    key: "mada",
    label: "mada",
    get description() { return tr("الدفع أو التحويل باستخدام بطاقات مدى السعودية."); },
    region: "saudi",
    logo: "/payment-logos/mada.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "stc_pay",
    label: "STC Pay",
    get description() { return tr("العميل يحول على رقم STC Pay الخاص بالتاجر."); },
    region: "saudi",
    logo: "/payment-logos/stc-pay.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "tabby",
    label: "Tabby",
    get description() { return tr("اشتر الآن وادفع لاحقًا من خلال Tabby."); },
    region: "saudi",
    logo: "/payment-logos/tabby.svg",
    manual: true,
    kind: "manual",
  },
  {
    key: "tamara",
    label: "Tamara",
    get description() { return tr("اشتر الآن وادفع لاحقًا من خلال Tamara."); },
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

/** Methods a merchant can still turn on (retired ones only label old orders). */
export function isAvailablePaymentMethod(key: string): key is PaymentMethodKey {
  return PAYMENT_METHODS.some((method) => method.key === key && !method.retired);
}

/** Paid on a gateway's hosted checkout rather than cash / transfer. */
export function isOnlinePaymentMethod(key: string) {
  return PAYMENT_METHODS.some((method) => method.key === key && method.kind === "online");
}

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
