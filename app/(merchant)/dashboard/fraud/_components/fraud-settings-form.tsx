"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderOtpMode } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SaveFraudSettingsAction } from "@/actions/store/fraud.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Settings = { orderOtpMode: OrderOtpMode; blockHighRiskOrders: boolean };

const OTP_OPTIONS: { value: OrderOtpMode; title: string; body: string }[] = [
  { value: "OFF", title: "من غير كود", body: "الطلب بيوصلك على طول. هتشوف سمعة الرقم جنب كل طلب." },
  {
    value: "RISKY",
    title: "للأرقام المشبوهة بس (ننصح بيها)",
    body: "الرقم اللي رفض استلام قبل كده لازم يأكد بكود على واتساب أو SMS. العملاء العاديين مش هيحسوا بحاجة.",
  },
  { value: "ALL", title: "لكل طلبات الدفع عند الاستلام", body: "أقوى حماية — كل طلب كاش لازم يتأكد بكود قبل ما يوصلك." },
];

export function FraudSettingsForm({ storeId, otpAvailable, initial }: { storeId: string; otpAvailable: boolean; initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState<Settings>(initial);
  const [saving, start] = useTransition();
  const dirty = values.orderOtpMode !== initial.orderOtpMode || values.blockHighRiskOrders !== initial.blockHighRiskOrders;

  function save() {
    start(async () => {
      const result = await SaveFraudSettingsAction(storeId, values);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">تأكيد الطلب بكود</h2>
        <p className="text-sm text-muted-foreground">
          العميل بيوصله كود على موبايله ولازم يكتبه عشان الطلب يتأكد. الطلب اللي ماتأكدش بيتلغى لوحده بعد ٦ ساعات والمخزون يرجع.
          الدفع أونلاين مش محتاج كود — البنك بيأكده.
        </p>
      </div>
      <div className="space-y-5 p-4">
        {!otpAvailable && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            تأكيد الطلب بالكود مش متاح حاليًا على كاشو. سمعة الأرقام والحظر شغالين عادي.
          </p>
        )}
        <RadioGroup
          dir="rtl"
          value={values.orderOtpMode}
          onValueChange={(v) => setValues((s) => ({ ...s, orderOtpMode: v as OrderOtpMode }))}
          disabled={!otpAvailable}
          className="gap-2"
        >
          {OTP_OPTIONS.map((option) => (
            <Label
              key={option.value}
              htmlFor={`otp-${option.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal transition-colors",
                values.orderOtpMode === option.value && "border-primary bg-primary/5",
                !otpAvailable && "cursor-not-allowed opacity-60",
              )}
            >
              <RadioGroupItem id={`otp-${option.value}`} value={option.value} className="mt-0.5" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="block text-xs leading-5 text-muted-foreground">{option.body}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="block-high-risk" className="text-sm font-medium">
              ارفض الدفع عند الاستلام للأرقام عالية الخطورة
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              الرقم اللي رفض الاستلام أكتر من مرة مش هيقدر يطلب كاش من متجرك — لازم يدفع أونلاين (لو مفعّل عندك).
            </p>
          </div>
          <Switch
            id="block-high-risk"
            checked={values.blockHighRiskOrders}
            onCheckedChange={(checked) => setValues((s) => ({ ...s, blockHighRiskOrders: checked }))}
          />
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={save} disabled={!dirty || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            حفظ
          </Button>
        </div>
      </div>
    </section>
  );
}
