import type { Metadata } from "next";

import { GetPaymentMethodsSettingsAction } from "@/actions/payment-methods/payment-methods.actions";

import PaymentMethodsForm from "./_components/PaymentMethodsForm";

export const metadata: Metadata = {
  title: "طرق الدفع",
};

export default async function PaymentMethodsPage() {
  const settings = await GetPaymentMethodsSettingsAction();

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">بوابات وطرق الدفع</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          ظبط طرق الدفع اللي هتظهر في متجرك
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          فعّل الدفع عند الاستلام أو التحويلات اليدوية، واربط Kashier ببيانات
          التاجر عشان العملاء يقدروا يدفعوا أونلاين من صفحة إتمام الطلب.
        </p>
      </div>

      <PaymentMethodsForm initialSettings={settings} />
    </div>
  );
}
