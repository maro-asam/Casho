"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CreditCard,
  MapPinHouse,
  Phone,
  UserRound,
  Wallet,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PaymentMethod = { key: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-12 w-full rounded-xl text-base font-semibold"
    >
      {pending ? (
        <>
          جاري تأكيد الطلب...
          <Loader2 className="size-4 animate-spin" />
        </>
      ) : (
        "تأكيد الطلب الآن"
      )}
    </Button>
  );
}

export default function CheckoutForm({
  paymentMethods,
  action,
}: {
  paymentMethods: PaymentMethod[];
  action: (formData: FormData) => void;
}) {
  const defaultPaymentMethod = useMemo(() => {
    return (
      paymentMethods.find((m) => m.key === "cash_on_delivery")?.key ||
      paymentMethods[0]?.key ||
      "cash_on_delivery"
    );
  }, [paymentMethods]);

  const [paymentMethod, setPaymentMethod] = useState<string>(
    defaultPaymentMethod,
  );

  return (
    <form action={action} className="space-y-6" dir="rtl">
      <div className="space-y-2 text-right">
        <h2 className="text-2xl font-bold">بيانات الطلب</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          املأ البيانات التالية بدقة عشان نقدر نأكد الطلب ونسلمه بدون أي تأخير.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">
            الاسم بالكامل
          </Label>

          <div className="relative">
            <UserRound className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              name="fullName"
              placeholder="مثال: محمد أحمد علي"
              required
              className="h-12 rounded-xl pr-10 text-right"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            رقم الموبايل
          </Label>

          <div className="relative">
            <Phone className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              placeholder="مثال: 01012345678"
              required
              className="h-12 rounded-xl pr-10 text-right"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            العنوان بالكامل
          </Label>

          <div className="relative">
            <MapPinHouse className="pointer-events-none absolute right-3 top-4 size-4 text-muted-foreground" />
            <Textarea
              id="address"
              name="address"
              placeholder="المحافظة - المنطقة - الشارع - رقم العمارة - الدور - الشقة - علامة مميزة"
              rows={5}
              required
              className="rounded-xl pr-10 text-right leading-7"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          <Label className="text-sm font-medium">طريقة الدفع</Label>
        </div>

        <input type="hidden" name="paymentMethod" value={paymentMethod} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const isActive = paymentMethod === method.key;

            return (
              <button
                key={method.key}
                type="button"
                onClick={() => setPaymentMethod(method.key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right transition-all",
                  "hover:border-primary/40 hover:bg-primary/5",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <CreditCard className="size-4" />
                  </div>

                  <div className="space-y-1 text-right">
                    <p className="font-semibold">{method.label}</p>
                    <p className="text-xs text-muted-foreground">
                      اختر الوسيلة المناسبة لإتمام الطلب
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30",
                  )}
                >
                  {isActive && <CheckCircle2 className="size-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-4" />
          </div>

          <div className="space-y-1 text-right">
            <p className="font-medium">راجع بياناتك قبل التأكيد</p>
            <p className="text-sm leading-6 text-muted-foreground">
              تأكد إن الاسم، رقم الموبايل، والعنوان مكتوبين بشكل صحيح لتجنب أي
              تأخير في التواصل أو الشحن.
            </p>
          </div>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}