"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  UpdateStorePlanAction,
  type ChangePlanFormState,
} from "@/actions/subscription/change-plan.actions";
import { useRouter } from "next/navigation";

const SUPER_PRICE = 29900;
const SUPER_FEATURES = [
  "متجر إلكتروني كامل",
  "منتجات غير محدودة",
  "أكواد خصم غير محدودة",
  "طلبات بدون حد",
  "كل الثيمات",
  "دومين مخصص",
  "CRM كامل + تحليلات متقدمة",
  "نظام نقاط الولاء",
  "تصدير الطلبات CSV",
  "نظام POS للمحل",
  "إدارة المخزون والفروع",
  "طلبات انستجرام AI",
  "أعضاء فريق غير محدودين",
  "دعم فني",
];

type ChangePlanFormProps = {
  currentBalance: number;
  autoRenew: boolean;
  isOnboarding?: boolean;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

const initialState: ChangePlanFormState = {
  success: false,
  message: "",
};

export default function ChangePlanForm({
  currentBalance,
  autoRenew,
  isOnboarding = false,
}: ChangePlanFormProps) {
  const router = useRouter();
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(autoRenew);

  const [state, formAction, isPending] = useActionState(
    UpdateStorePlanAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      if (isOnboarding) {
        router.replace("/");
        router.refresh();
      }
    } else {
      toast.error(state.message);
    }
  }, [state, isOnboarding, router]);

  const enoughForRenewal = currentBalance >= SUPER_PRICE;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="plan" value="SUPER" />
      <input
        type="hidden"
        name="autoRenew"
        value={autoRenewEnabled ? "true" : "false"}
      />

      {/* Plan card */}
      <div className="mx-auto max-w-sm">
        <div className="relative rounded-2xl border-2 border-primary bg-card shadow-lg shadow-primary/15">
          <div className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-white shadow-md">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  باقة
                </p>
                <h3 className="text-lg font-bold leading-tight">سوبر</h3>
              </div>
            </div>

            <div className="mb-2 flex items-end gap-1.5">
              <span className="text-5xl font-extrabold leading-none tracking-tight text-primary">
                299
              </span>
              <span className="mb-1.5 text-sm text-muted-foreground">
                ج.م / شهر
              </span>
            </div>
            <p className="mb-5 text-sm leading-5 text-muted-foreground">
              كل المميزات في خطة واحدة بسعر واحد.
            </p>

            <div className="mb-4 h-px bg-border" />

            <div className="space-y-2.5">
              {SUPER_FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3" />
                  </span>
                  <span className="font-medium text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary + balance */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">إعدادات الاشتراك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-1 text-sm text-muted-foreground">السعر الشهري</p>
              <p className="font-semibold">{formatPrice(SUPER_PRICE)}</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="space-y-1">
                <Label htmlFor="autoRenew" className="text-sm font-medium">
                  التجديد التلقائي
                </Label>
                <p className="text-sm text-muted-foreground">
                  يتم خصم سعر الباقة تلقائيًا عند التجديد.
                </p>
              </div>
              <Switch
                id="autoRenew"
                checked={autoRenewEnabled}
                onCheckedChange={setAutoRenewEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">جاهزية الرصيد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-1 text-sm text-muted-foreground">رصيدك الحالي</p>
              <p className="font-semibold">{formatPrice(currentBalance)}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-1 text-sm text-muted-foreground">
                المطلوب للتجديد
              </p>
              <p className="font-semibold">{formatPrice(SUPER_PRICE)}</p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-4 text-sm",
                enoughForRenewal
                  ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-200 bg-amber-500/10 text-amber-700 dark:text-amber-400",
              )}
            >
              {enoughForRenewal
                ? "رصيدك يكفي للتجديد."
                : "رصيدك غير كافٍ — اشحن قبل التجديد."}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isPending || (!isOnboarding && autoRenewEnabled === autoRenew)
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="ms-2 size-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : isOnboarding ? (
                "ابدأ الاشتراك وادخل الداشبورد"
              ) : (
                "حفظ التغييرات"
              )}
            </Button>

            {state.fieldErrors?.plan && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.plan}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
