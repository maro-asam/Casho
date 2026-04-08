"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  UpdateStorePlanAction,
  type PlanKey,
  type ChangePlanFormState,
} from "@/actions/subscription/change-plan.actions";

type PlanItem = {
  key: PlanKey;
  title: string;
  description: string;
  price: number;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
};

type ChangePlanFormProps = {
  currentPlan: PlanKey;
  currentMonthlyPrice: number;
  currentBalance: number;
  autoRenew: boolean;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

const plans: PlanItem[] = [
  {
    key: "STARTER",
    title: "باقة البداية",
    description: "مناسبة لو لسه بتبدأ وعايز أقل تكلفة شهرية.",
    price: 29900,
    icon: ShieldCheck,
    features: ["متجر إلكتروني كامل", "إدارة منتجات وطلبات", "لوحة تحكم سهلة"],
  },
  {
    key: "GROWTH",
    title: "باقة النمو",
    description: "أفضل اختيار لأغلب التجار ودي الباقة المتوازنة.",
    price: 49900,
    icon: Sparkles,
    recommended: true,
    features: [
      "كل مميزات Starter",
      "مناسبة للنمو المستمر",
      "أفضل قيمة مقابل السعر",
    ],
  },
  {
    key: "PRO",
    title: "باقة الاحتراف",
    description: "للمتاجر اللي عايزة مرونة أعلى وتجهيز للتوسع.",
    price: 99900,
    icon: Zap,
    features: ["كل مميزات Growth", "جاهزة للتوسع", "أنسب للمتاجر الجادة"],
  },
];

const initialState: ChangePlanFormState = {
  success: false,
  message: "",
};

function getPlanFromPrice(price: number): PlanKey {
  if (price === 29900) return "STARTER";
  if (price === 99900) return "PRO";
  return "GROWTH";
}

export default function ChangePlanForm({
  currentPlan,
  currentMonthlyPrice,
  currentBalance,
  autoRenew,
}: ChangePlanFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(currentPlan);
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(autoRenew);

  const [state, formAction, isPending] = useActionState(
    UpdateStorePlanAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const selectedPlanObject = useMemo(() => {
    return plans.find((plan) => plan.key === selectedPlan) ?? plans[1];
  }, [selectedPlan]);

  const isCurrentPlan = selectedPlan === currentPlan;
  const priceDifference = selectedPlanObject.price - currentMonthlyPrice;
  const enoughForRenewal = currentBalance >= selectedPlanObject.price;
  const currentPlanLabel = getPlanFromPrice(currentMonthlyPrice);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="plan" value={selectedPlan} />
      <input
        type="hidden"
        name="autoRenew"
        value={autoRenewEnabled ? "true" : "false"}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const active = selectedPlan === plan.key;
          const current = currentPlanLabel === plan.key;

          return (
            <button
              type="button"
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              className="w-full text-right"
            >
              <Card
                className={cn(
                  "h-full transition-all",
                  active && "border-primary ring-1 ring-primary",
                )}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{plan.title}</Badge>

                        {plan.recommended && (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            الأنسب
                          </Badge>
                        )}

                        {current && (
                          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
                            باقتك الحالية
                          </Badge>
                        )}
                      </div>

                      <CardTitle className="text-2xl">
                        {formatPrice(plan.price)}
                        <span className="ms-2 text-sm font-normal text-muted-foreground">
                          / شهريًا
                        </span>
                      </CardTitle>
                    </div>

                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Check className="size-4 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملخص التغيير</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  الباقة الحالية
                </p>
                <p className="font-semibold">{currentPlanLabel}</p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  الباقة الجديدة
                </p>
                <p className="font-semibold">{selectedPlanObject.title}</p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  السعر الحالي
                </p>
                <p className="font-semibold">
                  {formatPrice(currentMonthlyPrice)}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  السعر بعد التغيير
                </p>
                <p className="font-semibold">
                  {formatPrice(selectedPlanObject.price)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {priceDifference === 0
                  ? "أنت مختار نفس الباقة الحالية، ومفيش فرق في السعر."
                  : priceDifference > 0
                    ? `التجديد القادم هيكون أعلى بمقدار ${formatPrice(priceDifference)}.`
                    : `التجديد القادم هيكون أقل بمقدار ${formatPrice(Math.abs(priceDifference))}.`}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="autoRenew" className="text-sm font-medium">
                  التجديد التلقائي
                </Label>
                <p className="text-sm text-muted-foreground">
                  لو مفعل، هيتم خصم سعر الباقة المختارة تلقائيًا وقت التجديد.
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
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-1 text-sm text-muted-foreground">
                الرصيد الحالي
              </p>
              <p className="font-semibold">{formatPrice(currentBalance)}</p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-1 text-sm text-muted-foreground">
                المطلوب للتجديد القادم
              </p>
              <p className="font-semibold">
                {formatPrice(selectedPlanObject.price)}
              </p>
            </div>

            <div
              className={cn(
                "rounded-lg border p-4 text-sm",
                enoughForRenewal
                  ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-200 bg-amber-500/10 text-amber-700 dark:text-amber-400",
              )}
            >
              {enoughForRenewal
                ? "رصيدك الحالي يكفي للتجديد القادم على الباقة المختارة."
                : "رصيدك الحالي غير كافٍ للتجديد القادم على الباقة المختارة."}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isPending || (isCurrentPlan && autoRenewEnabled === autoRenew)
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="ms-2 size-4 animate-spin" />
                  جاري حفظ التغييرات...
                </>
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
