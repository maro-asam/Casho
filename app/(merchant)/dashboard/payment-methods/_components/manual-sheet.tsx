"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { SaveManualMethodAction } from "@/actions/payment-methods/payment-methods.actions";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { appleButton } from "@/components/saas-page";
import { Label } from "@/components/ui/label";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { INSTRUCTION_HINTS } from "./method-meta";
import { MethodLogo } from "./shared";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

export function ManualSheetBody({
  methodKey,
  initialValue,
  enabled,
  onSaved,
}: {
  methodKey: PaymentMethodKey;
  initialValue: string;
  enabled: boolean;
  onSaved: (value: string) => void;
}) {
  const method = PAYMENT_METHODS_BY_KEY[methodKey];
  const hint = INSTRUCTION_HINTS[methodKey];
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await SaveManualMethodAction(methodKey, value).catch(() => null);
      if (!res?.success) {
        setError(res?.errors?.details ?? null);
        toast.error(res?.message ?? tr("مقدرناش نحفظ. جرّب تاني."));
        return;
      }
      toast.success(trv(res.message));
      onSaved(value.trim());
    });
  }

  const steps = [
    tr("١. العميل بيختار {0} في صفحة الدفع ويأكد الطلب.", method.label),
    tr("٢. بيظهرله الكلام اللي هتكتبه هنا عشان يحوّل."),
    tr("٣. إنت بتتأكد إن الفلوس وصلت وتعلّم الطلب «مدفوع»."),
  ];

  return (
    <>
      <SheetHeader className="items-center gap-1.5 px-6 pt-10 pb-6 text-center">
        <MethodLogo src={method.logo} alt={method.label} size="lg" className="mb-2" />
        <SheetTitle className="text-[22px] font-bold">{method.label}</SheetTitle>
        <SheetDescription className="text-[15px]">{method.description}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-7 overflow-y-auto px-4 pb-6">
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-4">
            <Label htmlFor="manual-details" className="text-[13px] font-semibold text-muted-foreground">
              {tr("البيانات اللي العميل هيحوّل عليها")}
            </Label>
            {hint && !value.trim() && (
              <button type="button" onClick={() => setValue(hint.placeholder)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                <Sparkles className="size-3.5" />
                {tr("ابدأ بمثال")}
              </button>
            )}
          </div>
          <div className="rounded-[14px] bg-card p-2">
            <Textarea
              id="manual-details"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder={hint?.placeholder}
              rows={5}
              maxLength={1000}
              aria-invalid={!!error}
              className="resize-y border-0 bg-transparent text-[15px] leading-7 shadow-none focus-visible:shadow-none"
              autoFocus
            />
          </div>
          <p className={cn("px-4 text-[13px] leading-5", error ? "text-(--sys-red)" : "text-muted-foreground")}>{error ?? hint?.hint}</p>
        </section>

        <section className="space-y-2">
          <p className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("كده العميل هيشوفها بعد ما يطلب")}</p>
          <div className="rounded-[14px] bg-card p-4">
            <div className="flex items-center gap-2.5">
              <MethodLogo src={method.logo} alt="" size="sm" />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{tr("ادفع عن طريق {0}", method.label)}</p>
                <p className="text-[13px] text-muted-foreground">{tr("استخدم البيانات دي لإتمام الدفع، واحتفظ بصورة الإيصال.")}</p>
              </div>
            </div>
            <pre className="mt-3 min-h-16 whitespace-pre-wrap rounded-[12px] bg-(--fill-3) p-3.5 font-sans text-[15px] leading-7">
              {value.trim() || <span className="text-(--label-3)">{tr("بياناتك هتظهر هنا…")}</span>}
            </pre>
          </div>
        </section>

        <ol className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:16px]">
          {steps.map((step) => (
            <li key={step} className="px-4 py-3 text-[13px] leading-5 text-muted-foreground">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <SheetFooter className="apple-glass px-4 pt-3 pb-4">
        <button type="button" onClick={save} disabled={pending || !value.trim()} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {enabled ? tr("احفظ التعديل") : tr("احفظ وفعّل")}
        </button>
      </SheetFooter>
    </>
  );
}
