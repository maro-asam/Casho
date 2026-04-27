import type { Metadata } from "next";
import {
  Banknote,
  CreditCard,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { GetPaymentMethodsSettingsAction } from "@/actions/payment-methods/payment-methods.actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

import PaymentMethodsForm from "./_components/PaymentMethodsForm";

export const metadata: Metadata = {
  title: "طرق الدفع",
};

export default async function PaymentMethodsPage() {
  const settings = await GetPaymentMethodsSettingsAction();

  const activeManualMethods = [
    settings.cashOnDeliveryEnabled,
    settings.vodafoneCashEnabled,
    settings.instapayEnabled,
    settings.bankTransferEnabled,
  ].filter(Boolean).length;

  return (
    <div className="min-h-[calc(100vh-120px)]" dir="rtl">
      <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-xl px-3 py-1">
                  طرق الدفع
                </Badge>

                <Badge
                  variant={settings.kashierEnabled ? "secondary" : "outline"}
                  className="rounded-xl px-3 py-1"
                >
                  {settings.kashierEnabled ? "Kashier مفعل" : "Kashier متوقف"}
                </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  ظبط طرق الدفع اللي هتظهر في متجرك
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  فعّل الدفع عند الاستلام أو التحويلات اليدوية، واربط Kashier
                  عشان العملاء يقدروا يدفعوا أونلاين من صفحة إتمام الطلب.
                </p>
              </div>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <WalletCards className="size-6" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">الطرق اليدوية</p>
                <h2 className="text-2xl font-semibold">
                  {activeManualMethods}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  طرق مفعلة في checkout.
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Banknote className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">الدفع الأونلاين</p>
                <h2 className="text-2xl font-semibold">
                  {settings.kashierEnabled ? "مفعل" : "متوقف"}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  ربط Kashier مع صفحة الدفع.
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">وضع Kashier</p>
                <h2 className="text-2xl font-semibold">
                  {settings.kashierMode}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  بيانات التاجر محفوظة بشكل آمن.
                </p>
              </div>

              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <PaymentMethodsForm initialSettings={settings} />
      </div>
    </div>
  );
}