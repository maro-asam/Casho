import { Banknote, Building2, Landmark, Smartphone } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ManualPaymentSettings = {
  vodafoneCashNumber?: string | null;
  instapayAddress?: string | null;
  bankTransferDetails?: string | null;
} | null;

type ManualPaymentInstructionsProps = {
  paymentMethod?: string | null;
  settings?: ManualPaymentSettings;
};

function instructionFor(method?: string | null, settings?: ManualPaymentSettings) {
  switch (method) {
    case "vodafone_cash":
      return settings?.vodafoneCashNumber
        ? {
            title: "حول على فودافون كاش",
            description: "بعد التحويل احتفظ بصورة الإيصال للتواصل مع المتجر.",
            value: settings.vodafoneCashNumber,
            icon: Smartphone,
          }
        : null;

    case "instapay":
      return settings?.instapayAddress
        ? {
            title: "حول عن طريق InstaPay",
            description: "استخدم بيانات InstaPay التالية لإتمام التحويل.",
            value: settings.instapayAddress,
            icon: Building2,
          }
        : null;

    case "bank_transfer":
      return settings?.bankTransferDetails
        ? {
            title: "بيانات التحويل البنكي",
            description: "استخدم بيانات الحساب التالية، ثم تواصل مع المتجر بصورة التحويل.",
            value: settings.bankTransferDetails,
            icon: Landmark,
          }
        : null;

    case "cash_on_delivery":
      return {
        title: "الدفع عند الاستلام",
        description: "هتدفع قيمة الطلب لمندوب الشحن عند الاستلام.",
        value: null,
        icon: Banknote,
      };

    default:
      return null;
  }
}

export function ManualPaymentInstructions({
  paymentMethod,
  settings,
}: ManualPaymentInstructionsProps) {
  const instruction = instructionFor(paymentMethod, settings);

  if (!instruction) return null;

  const Icon = instruction.icon;

  return (
    <Card className="border-primary/20 bg-primary/5 text-right">
      <CardHeader>
        <CardTitle className="flex items-center justify-end gap-2">
          {instruction.title}
          <Icon className="size-5 text-primary" />
        </CardTitle>
        <CardDescription>{instruction.description}</CardDescription>
      </CardHeader>

      {instruction.value ? (
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-xl border bg-background p-4 text-sm leading-7">
            {instruction.value}
          </pre>
        </CardContent>
      ) : null}
    </Card>
  );
}
