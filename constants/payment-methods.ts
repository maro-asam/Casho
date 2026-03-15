export const PAYMENT_METHODS = [
  { key: "vodafone_cash", label: "Vodafone Cash" },
  { key: "instapay", label: "InstaPay" },
  { key: "fawry", label: "Fawry" },
  { key: "bank_transfer", label: "Bank Transfer" },
  { key: "cash_on_delivery", label: "Cash on Delivery" },
] as const;

export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]["key"];
