export type PaymentMethodKey =
  | "cash_on_delivery"
  | "vodafone_cash"
  | "instapay"
  | "fawry"
  | "bank_transfer";

export const PAYMENT_METHODS: {
  key: PaymentMethodKey;
  label: string;
  description: string;
}[] = [
  {
    key: "cash_on_delivery",
    label: "الدفع عند الاستلام",
    description: "ادفع كاش عند وصول الطلب",
  },
  {
    key: "vodafone_cash",
    label: "فودافون كاش",
    description: "تحويل على محفظة فودافون كاش",
  },
  {
    key: "instapay",
    label: "إنستا باي",
    description: "تحويل مباشر عبر InstaPay",
  },
  {
    key: "fawry",
    label: "فوري",
    description: "تحويل عن طريق فوري",
  },
  {
    key: "bank_transfer",
    label: "تحويل بنكي",
    description: "تحويل بنكي",
  },
];
