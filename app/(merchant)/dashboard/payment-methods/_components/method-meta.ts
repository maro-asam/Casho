import type { PaymentMethodKey, PaymentRegion } from "@/constants/welcome/payment-methods";
import { tr } from "@/lib/i18n/dashboard";

/** What the merchant should write for each manual method — shown to the customer after ordering. */
export const INSTRUCTION_HINTS: Partial<Record<PaymentMethodKey, { placeholder: string; hint: string }>> = {
  vodafone_cash: {
    get placeholder() { return tr("حوّل على رقم 01012345678 (باسم أحمد محمد)\nوابعت صورة التحويل واتساب على نفس الرقم"); },
    get hint() { return tr("رقم المحفظة واسم صاحبها — العميل بيطمّن لما يشوف الاسم."); },
  },
  instapay: {
    get placeholder() { return tr("حوّل على ahmed@instapay\nأو رقم 01012345678\nوابعت سكرين شوت التحويل"); },
    get hint() { return tr("عنوان InstaPay (IPA) أو رقم الموبايل المربوط."); },
  },
  bank_transfer: {
    get placeholder() { return tr("بنك مصر — فرع المعادي\nاسم الحساب: أحمد محمد\nرقم الحساب: 1234567890\nIBAN: EG00 0000 0000 0000 0000 0000 0000"); },
    get hint() { return tr("اسم البنك، اسم الحساب، رقم الحساب والـ IBAN."); },
  },
  fawry: {
    get placeholder() { return tr("ادفع من أي منفذ فوري على كود التاجر 12345\nوابعت رقم العملية"); },
    get hint() { return tr("كود التاجر أو رقم الخدمة في فوري."); },
  },
  paypal: {
    get placeholder() { return tr("ابعت المبلغ على paypal.me/ahmed\nأو الإيميل ahmed@example.com"); },
    get hint() { return tr("رابط paypal.me أو الإيميل."); },
  },
  visa_mastercard: {
    get placeholder() { return tr("هنبعتلك لينك دفع آمن على واتساب خلال ساعة من الطلب"); },
    get hint() { return tr("لو بتستخدم لينكات دفع — قول للعميل هيوصله إزاي."); },
  },
  apple_pay: { get placeholder() { return tr("هنبعتلك لينك دفع Apple Pay على واتساب بعد تأكيد الطلب"); }, get hint() { return tr("إزاي العميل هيوصله لينك الدفع."); } },
  google_pay: { get placeholder() { return tr("هنبعتلك لينك دفع Google Pay على واتساب بعد تأكيد الطلب"); }, get hint() { return tr("إزاي العميل هيوصله لينك الدفع."); } },
  mada: { get placeholder() { return tr("هنبعتلك لينك دفع مدى بعد تأكيد الطلب"); }, get hint() { return tr("إزاي العميل هيدفع ببطاقة مدى."); } },
  stc_pay: { get placeholder() { return tr("حوّل على رقم STC Pay‏ 0551234567 وابعت الإيصال"); }, get hint() { return tr("رقم STC Pay واسم صاحبه."); } },
  tabby: { get placeholder() { return tr("هنبعتلك لينك تقسيط Tabby على واتساب"); }, get hint() { return tr("إزاي العميل هيستلم لينك التقسيط."); } },
  tamara: { get placeholder() { return tr("هنبعتلك لينك تقسيط Tamara على واتساب"); }, get hint() { return tr("إزاي العميل هيستلم لينك التقسيط."); } },
};

export const REGIONS: { value: PaymentRegion; label: string }[] = [
  { value: "egypt", get label() { return tr("مصر"); } },
  { value: "saudi", get label() { return tr("السعودية"); } },
  { value: "global", get label() { return tr("دولي"); } },
];

export const PAYMOB_SIGNUP_URL = "https://paymob.com/en";
export const PAYMOB_DASHBOARD_URL = "https://accept.paymob.com/portal2/en/login";
