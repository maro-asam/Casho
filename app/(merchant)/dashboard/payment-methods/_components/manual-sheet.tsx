"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { SaveManualMethodAction } from "@/actions/payment-methods/payment-methods.actions";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { INSTRUCTION_HINTS } from "./method-meta";
import { MethodLogo } from "./shared";

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
        toast.error(res?.message ?? "مقدرناش نحفظ. جرّب تاني.");
        return;
      }
      toast.success(res.message);
      onSaved(value.trim());
    });
  }

  return (
    <>
      <SheetHeader className="border-b border-border pb-4 text-start">
        <div className="flex items-center gap-3">
          <MethodLogo src={method.logo} alt={method.label} />
          <div className="min-w-0">
            <SheetTitle>{method.label}</SheetTitle>
            <SheetDescription>{method.description}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto px-4">
        <ol className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
          <li>١. العميل بيختار {method.label} في صفحة الدفع ويأكد الطلب.</li>
          <li>٢. بيظهرله الكلام اللي هتكتبه هنا عشان يحوّل.</li>
          <li>٣. إنت بتتأكد إن الفلوس وصلت وتعلّم الطلب «مدفوع».</li>
        </ol>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="manual-details">البيانات اللي العميل هيحوّل عليها</Label>
            {hint && !value.trim() && (
              <button type="button" onClick={() => setValue(hint.placeholder)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Sparkles className="size-3" />
                ابدأ بمثال
              </button>
            )}
          </div>
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
            className="resize-y text-sm leading-7"
            autoFocus
          />
          <p className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{error ?? hint?.hint}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">كده العميل هيشوفها بعد ما يطلب</p>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
            <p className="text-sm font-semibold">ادفع عن طريق {method.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">استخدم البيانات دي لإتمام الدفع، واحتفظ بصورة الإيصال.</p>
            <pre className="mt-3 min-h-16 whitespace-pre-wrap rounded-xl border border-border bg-background p-3 font-sans text-sm leading-7">
              {value.trim() || <span className="text-muted-foreground/60">بياناتك هتظهر هنا…</span>}
            </pre>
          </div>
        </div>
      </div>

      <SheetFooter className="border-t border-border">
        <Button onClick={save} disabled={pending || !value.trim()} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {enabled ? "احفظ التعديل" : "احفظ وفعّل"}
        </Button>
      </SheetFooter>
    </>
  );
}
