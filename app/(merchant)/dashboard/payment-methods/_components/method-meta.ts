import type { PaymentMethodKey, PaymentRegion } from "@/constants/welcome/payment-methods";

/** What the merchant should write for each manual method — shown to the customer after ordering. */
export const INSTRUCTION_HINTS: Partial<Record<PaymentMethodKey, { placeholder: string; hint: string }>> = {
  vodafone_cash: {
    placeholder: "حوّل على رقم 01012345678 (باسم أحمد محمد)\nوابعت صورة التحويل واتساب على نفس الرقم",
    hint: "رقم المحفظة واسم صاحبها — العميل بيطمّن لما يشوف الاسم.",
  },
  instapay: {
    placeholder: "حوّل على ahmed@instapay\nأو رقم 01012345678\nوابعت سكرين شوت التحويل",
    hint: "عنوان InstaPay (IPA) أو رقم الموبايل المربوط.",
  },
  bank_transfer: {
    placeholder: "بنك مصر — فرع المعادي\nاسم الحساب: أحمد محمد\nرقم الحساب: 1234567890\nIBAN: EG00 0000 0000 0000 0000 0000 0000",
    hint: "اسم البنك، اسم الحساب، رقم الحساب والـ IBAN.",
  },
  fawry: {
    placeholder: "ادفع من أي منفذ فوري على كود التاجر 12345\nوابعت رقم العملية",
    hint: "كود التاجر أو رقم الخدمة في فوري.",
  },
  paypal: {
    placeholder: "ابعت المبلغ على paypal.me/ahmed\nأو الإيميل ahmed@example.com",
    hint: "رابط paypal.me أو الإيميل.",
  },
  visa_mastercard: {
    placeholder: "هنبعتلك لينك دفع آمن على واتساب خلال ساعة من الطلب",
    hint: "لو بتستخدم لينكات دفع — قول للعميل هيوصله إزاي.",
  },
  apple_pay: { placeholder: "هنبعتلك لينك دفع Apple Pay على واتساب بعد تأكيد الطلب", hint: "إزاي العميل هيوصله لينك الدفع." },
  google_pay: { placeholder: "هنبعتلك لينك دفع Google Pay على واتساب بعد تأكيد الطلب", hint: "إزاي العميل هيوصله لينك الدفع." },
  mada: { placeholder: "هنبعتلك لينك دفع مدى بعد تأكيد الطلب", hint: "إزاي العميل هيدفع ببطاقة مدى." },
  stc_pay: { placeholder: "حوّل على رقم STC Pay‏ 0551234567 وابعت الإيصال", hint: "رقم STC Pay واسم صاحبه." },
  tabby: { placeholder: "هنبعتلك لينك تقسيط Tabby على واتساب", hint: "إزاي العميل هيستلم لينك التقسيط." },
  tamara: { placeholder: "هنبعتلك لينك تقسيط Tamara على واتساب", hint: "إزاي العميل هيستلم لينك التقسيط." },
};

export const REGIONS: { value: PaymentRegion; label: string }[] = [
  { value: "egypt", label: "مصر" },
  { value: "saudi", label: "السعودية" },
  { value: "global", label: "دولي" },
];

export const KASHIER_SIGNUP_URL = "https://merchant.kashier.io/signup";
export const KASHIER_DASHBOARD_URL = "https://merchant.kashier.io";
