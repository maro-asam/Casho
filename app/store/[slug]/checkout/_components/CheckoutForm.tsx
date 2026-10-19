"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { SaveCheckoutContactAction } from "@/actions/store/cart-recovery.actions";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import { selectGovernorateAction } from "../../cart/actions";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  MapPinHouse,
  Phone,
  UserRound,
  Wallet,
} from "lucide-react";

import {
  getPaymentMethodByKey,
  isManualPaymentMethod,
} from "@/constants/payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PaymentMethod = {
  key: string;
  label: string;
};

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

function PaymentMethodLogo({
  methodKey,
  label,
  isActive,
}: {
  methodKey: string;
  label: string;
  isActive: boolean;
}) {
  const config = getPaymentMethodByKey(methodKey);

  return (
    <div
      className={cn(
        "flex size-16 shrink-0 items-center justify-center rounded-2xl border bg-white p-2",
        isActive ? "border-primary" : "border-border",
      )}
    >
      {config?.logo ? (
        <Image
          src={config.logo}
          alt={label}
          width={56}
          height={56}
          className="max-h-12 w-auto object-contain"
        />
      ) : (
        <CreditCard className="size-6 text-muted-foreground" />
      )}
    </div>
  );
}

export default function CheckoutForm({
  paymentMethods,
  action,
  storeSlug,
  defaultGovernorate,
}: {
  paymentMethods: PaymentMethod[];
  action: (formData: FormData) => void;
  storeSlug: string;
  /** Last governorate picked (cart summary already prices shipping for it). */
  defaultGovernorate?: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastSaved = useRef("");
  const router = useRouter();
  const [isPricingShipping, startPricing] = useTransition();

  // Shipping can cost differently per governorate: remember the pick and
  // re-render the server summary so the shopper sees the real total.
  function onGovernorateChange(code: string) {
    startPricing(async () => {
      await selectGovernorateAction(storeSlug, code);
      router.refresh();
    });
  }

  // Keep what the customer typed so an unfinished checkout can be followed up
  // from "abandoned carts". Fire-and-forget; never blocks the form.
  function captureContact() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const payload = {
      fullName: String(data.get("fullName") ?? ""),
      phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""),
    };
    const key = JSON.stringify(payload);
    if (key === lastSaved.current || (!payload.phone.trim() && !payload.fullName.trim())) return;
    lastSaved.current = key;
    SaveCheckoutContactAction(storeSlug, payload).catch(() => {});
  }

  const defaultPaymentMethod = useMemo(() => {
    // The merchant orders the methods; the first one is the preselected default.
    return paymentMethods[0]?.key || "cash_on_delivery";
  }, [paymentMethods]);

  const [paymentMethod, setPaymentMethod] =
    useState<string>(defaultPaymentMethod);

  return (
    <form ref={formRef} action={action} onBlur={captureContact} className="space-y-6" dir="rtl">
      <div className="space-y-2 text-right">
        <h2 className="text-2xl font-semibold">بيانات الطلب</h2>

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
              onChange={(e) => {
                if (e.target.value.replace(/\D/g, "").length >= 11) captureContact();
              }}
              placeholder="مثال: 01012345678"
              required
              className="h-12 rounded-xl pr-10 text-right"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="governorate" className="text-sm font-medium">
            المحافظة
          </Label>

          <div className="relative">
            <MapPin className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <select
              id="governorate"
              name="governorate"
              required
              defaultValue={defaultGovernorate ?? ""}
              onChange={(e) => onGovernorateChange(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-input bg-transparent pr-10 pl-10 text-right text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                اختر المحافظة
              </option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.name}
                </option>
              ))}
            </select>

            {isPricingShipping && (
              <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
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
              placeholder="المنطقة - الشارع - رقم العمارة - الدور - الشقة - علامة مميزة"
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
            const config = getPaymentMethodByKey(method.key);
            const manual = isManualPaymentMethod(method.key);

            return (
              <button
                key={method.key}
                type="button"
                onClick={() => setPaymentMethod(method.key)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-right transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background",
                )}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <PaymentMethodLogo
                    methodKey={method.key}
                    label={method.label}
                    isActive={isActive}
                  />

                  <div className="min-w-0 space-y-1 text-right">
                    <p className="font-semibold">
                      {config?.label ?? method.label}
                    </p>

                    <p className="text-xs leading-5 text-muted-foreground">
                      {config?.description ??
                        "اختر الوسيلة المناسبة لإتمام الطلب"}
                    </p>

                    {manual ? (
                      <p className="text-xs font-medium text-primary">
                        سيتم عرض بيانات التحويل بعد تأكيد الطلب
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30",
                  )}
                >
                  {isActive ? <CheckCircle2 className="size-4" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
