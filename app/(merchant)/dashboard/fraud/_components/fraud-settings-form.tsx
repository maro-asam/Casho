"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderOtpMode } from "@prisma/client";
import { Check, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { SaveFraudSettingsAction } from "@/actions/store/fraud.actions";
import { appleButton } from "@/components/saas-page";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "../../settings/_components/settings-ui";

type Settings = { orderOtpMode: OrderOtpMode; blockHighRiskOrders: boolean };

function otpOptions(): { value: OrderOtpMode; title: string; body: string }[] {
  return [
    { value: "OFF", title: tr("من غير كود"), body: tr("الطلب بيوصلك على طول. هتشوف سمعة الرقم جنب كل طلب.") },
    {
      value: "RISKY",
      title: tr("للأرقام المشبوهة بس (ننصح بيها)"),
      body: tr("الرقم اللي رفض استلام قبل كده لازم يأكد بكود على واتساب أو SMS. العملاء العاديين مش هيحسوا بحاجة."),
    },
    { value: "ALL", title: tr("لكل طلبات الدفع عند الاستلام"), body: tr("أقوى حماية — كل طلب كاش لازم يتأكد بكود قبل ما يوصلك.") },
  ];
}

export function FraudSettingsForm({ storeId, otpAvailable, initial }: { storeId: string; otpAvailable: boolean; initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState<Settings>(initial);
  const [saving, start] = useTransition();
  const dirty = values.orderOtpMode !== initial.orderOtpMode || values.blockHighRiskOrders !== initial.blockHighRiskOrders;

  function save() {
    start(async () => {
      const result = await SaveFraudSettingsAction(storeId, values);
      if (result.ok) {
        toast.success(trv(result.message));
        router.refresh();
      } else {
        toast.error(trv(result.message));
      }
    });
  }

  return (
    <div className="space-y-8">
      <Group
        id="otp"
        title={tr("تأكيد الطلب بكود")}
        footer={tr("العميل بيوصله كود على موبايله ولازم يكتبه عشان الطلب يتأكد. الطلب اللي ماتأكدش بيتلغى لوحده بعد ٦ ساعات والمخزون يرجع. الدفع أونلاين مش محتاج كود — البنك بيأكده.")}
      >
        {!otpAvailable && (
          <p className="bg-(--sys-orange)/10 px-4 py-3 text-[13px] leading-[19px]">
            {tr("تأكيد الطلب بالكود مش متاح حاليًا على كاشو. سمعة الأرقام والحظر شغالين عادي.")}
          </p>
        )}
        <div role="radiogroup" aria-label={tr("تأكيد الطلب بكود")}>
          {otpOptions().map((option) => {
            const active = values.orderOtpMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!otpAvailable}
                onClick={() => setValues((s) => ({ ...s, orderOtpMode: option.value }))}
                className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-(--fill-3)/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-5">{option.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-[18px] text-muted-foreground">{option.body}</span>
                </span>
                <Check className={cn("size-5 shrink-0 text-primary", !active && "invisible")} strokeWidth={2.6} />
              </button>
            );
          })}
        </div>
      </Group>

      <Group
        title={tr("الدفع عند الاستلام")}
        inset={58}
        footer={tr("الرقم اللي رفض الاستلام أكتر من مرة مش هيقدر يطلب كاش من متجرك — لازم يدفع أونلاين (لو مفعّل عندك).")}
      >
        <label htmlFor="block-high-risk" className="flex cursor-pointer items-center gap-3.5 px-4 py-3">
          <IconTile icon={ShieldAlert} tint="bg-(--sys-red)" />
          <span className="min-w-0 flex-1 text-[15px] leading-5">{tr("ارفض الدفع عند الاستلام للأرقام عالية الخطورة")}</span>
          <Switch
            id="block-high-risk"
            className="apple-switch"
            checked={values.blockHighRiskOrders}
            onCheckedChange={(checked) => setValues((s) => ({ ...s, blockHighRiskOrders: checked }))}
          />
        </label>
      </Group>

      {/* Floating save bar — only while there are unsaved changes. */}
      {dirty && (
        <div className="sticky bottom-4 z-20 flex justify-center">
          <div className="apple-glass flex items-center gap-2 rounded-full p-1.5 ps-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <span className="text-[13px] text-muted-foreground">{tr("عندك تغييرات مش محفوظة")}</span>
            <button type="button" onClick={() => setValues(initial)} disabled={saving} className={cn(appleButton.plain, "mx-0 h-10 px-3")}>
              {tr("تجاهل")}
            </button>
            <button type="button" onClick={save} disabled={saving} className={cn(appleButton.filled, "h-10")}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {tr("حفظ")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
