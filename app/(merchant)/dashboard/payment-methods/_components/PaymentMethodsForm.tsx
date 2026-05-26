"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  KeyRound,
  Landmark,
  Loader2,
  Save,
  ShieldCheck,
  WalletCards,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  KASHIER_ALLOWED_METHODS,
  type KashierAllowedMethod,
} from "@/constants/welcome/payment-methods";
import {
  PAYMENT_METHODS,
  PAYMENT_REGION_DESCRIPTIONS,
  PAYMENT_REGION_LABELS,
  type PaymentMethodConfig,
  type PaymentMethodKey,
  type PaymentRegion,
} from "@/constants/payment-methods";
import {
  UpdatePaymentMethodsAction,
  type PaymentMethodsFormState,
  type PaymentMethodsSettingsData,
} from "@/actions/payment-methods/payment-methods.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ManualPaymentDetails = Record<string, string>;

type ExtendedPaymentMethodsSettingsData = PaymentMethodsSettingsData & {
  enabledPaymentMethods?: string[];
  manualPaymentDetails?: ManualPaymentDetails | null;
};

type PaymentMethodsFormProps = {
  initialSettings: ExtendedPaymentMethodsSettingsData;
};

function FieldError({
  state,
  name,
}: {
  state: PaymentMethodsFormState | null;
  name: string;
}) {
  const message = state?.errors?.[name]?.[0];
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

const REGION_ICONS: Record<PaymentRegion, React.ElementType> = {
  global: Globe,
  egypt: Building2,
  saudi: Landmark,
};

function RegionHeader({ region }: { region: PaymentRegion }) {
  const Icon = REGION_ICONS[region];
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="whitespace-nowrap text-sm font-bold">
            {PAYMENT_REGION_LABELS[region]}
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {PAYMENT_REGION_DESCRIPTIONS[region]}
        </p>
      </div>
    </div>
  );
}

function PaymentMethodCard({
  method,
  checked,
  defaultManualValue,
  state,
  onToggle,
}: {
  method: PaymentMethodConfig;
  checked: boolean;
  defaultManualValue: string;
  state: PaymentMethodsFormState | null;
  onToggle: (methodKey: PaymentMethodKey) => void;
}) {
  const inputId = `payment_method_${method.key}`;
  const manualInputId = `manual_${method.key}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-background transition-all duration-200",
        checked
          ? "border-primary/40 shadow-sm ring-1 ring-primary/20"
          : "border-border/60 hover:border-primary/30 hover:shadow-sm",
      )}
    >
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-4 p-4">
        <input
          id={inputId}
          type="checkbox"
          name="enabledPaymentMethods"
          value={method.key}
          checked={checked}
          onChange={() => onToggle(method.key)}
          className="sr-only"
        />

        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
          <Image
            src={method.logo}
            alt={method.label}
            width={48}
            height={48}
            className="max-h-10 w-auto object-contain"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1 text-right">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{method.label}</p>
            {method.manual ? (
              <Badge variant="outline" className="text-xs">تحويل يدوي</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">بوابة دفع</Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {method.description}
          </p>
        </div>

        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            checked
              ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "border-border/60 bg-background",
          )}
        >
          {checked && <CheckCircle2 className="size-4" />}
        </div>
      </label>

      {checked && method.manual && (
        <div className="border-t border-border/60 bg-muted/20 p-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <Label htmlFor={manualInputId} className="text-sm font-semibold">
                بيانات التحويل — {method.label}
              </Label>
            </div>
            <Textarea
              id={manualInputId}
              name={manualInputId}
              defaultValue={defaultManualValue}
              placeholder={`اكتب بيانات الدفع التي ستظهر للعميل بعد اختيار ${method.label}`}
              rows={3}
              className="resize-none text-right leading-7"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              مثال: رقم المحفظة، البريد، رقم الحساب، IBAN، أو تعليمات الدفع.
            </p>
            <FieldError state={state} name={manualInputId} />
          </div>
        </div>
      )}
    </div>
  );
}

function isAllowedMethodSelected(
  selectedMethods: KashierAllowedMethod[],
  method: string,
) {
  return selectedMethods.includes(method as KashierAllowedMethod);
}

function getManualDetailsValue(
  manualPaymentDetails: ManualPaymentDetails | null | undefined,
  methodKey: string,
) {
  if (!manualPaymentDetails) return "";
  return manualPaymentDetails[methodKey] ?? "";
}

export default function PaymentMethodsForm({
  initialSettings,
}: PaymentMethodsFormProps) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    UpdatePaymentMethodsAction,
    null,
  );

  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    initialSettings.enabledPaymentMethods ?? [],
  );

  const [kashierMode, setKashierMode] = useState<"TEST" | "LIVE">(
    initialSettings.kashierMode ?? "TEST",
  );

  const kashierSelected = selectedMethods.includes("kashier");

  function togglePaymentMethod(methodKey: PaymentMethodKey) {
    setSelectedMethods((current) =>
      current.includes(methodKey)
        ? current.filter((key) => key !== methodKey)
        : [...current, methodKey],
    );
  }

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.message);
      router.refresh();
      return;
    }
    toast.error(state.message);
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-5" dir="rtl">
      <input type="hidden" name="storeId" value={initialSettings.storeId} />

      {/* ── Payment Methods ── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <WalletCards className="size-4" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">طرق الدفع في المتجر</CardTitle>
              <CardDescription>
                اختار طريقة الدفع — لو محتاجة بيانات تحويل هتظهر الخانة تحتها مباشرة.
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">
              {initialSettings.storeName}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-7">
          <FieldError state={state} name="enabledPaymentMethods" />

          {(["global", "egypt", "saudi"] as PaymentRegion[]).map((region) => {
            const methods = PAYMENT_METHODS.filter((m) => m.region === region);
            return (
              <section key={region} className="space-y-3">
                <RegionHeader region={region} />
                <div className="grid gap-2.5">
                  {methods.map((method) => (
                    <PaymentMethodCard
                      key={method.key}
                      method={method}
                      checked={selectedMethods.includes(method.key)}
                      defaultManualValue={getManualDetailsValue(
                        initialSettings.manualPaymentDetails,
                        method.key,
                      )}
                      state={state}
                      onToggle={togglePaymentMethod}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Kashier Settings ── */}
      {kashierSelected ? (
        <Card className="overflow-hidden border-border/60 shadow-sm">
          {/* Gateway Status Banner */}
          {kashierMode === "TEST" ? (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-500/8 px-5 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="size-3.5 shrink-0" />
              وضع الاختبار — الدفعات لن تتم فعلياً ولن ترحل للبنك
            </div>
          ) : (
            <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-500/8 px-5 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5 shrink-0" />
              وضع الإنتاج — الدفعات حقيقية وسترسل للبنك مباشرة
            </div>
          )}

          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">إعدادات Kashier</CardTitle>
                  <CardDescription>
                    Kashier متفعل — اكمل بيانات الربط عشان يشتغل في الـ checkout.
                  </CardDescription>
                </div>
              </div>
              <Badge className="gap-1.5 text-xs" variant="secondary">
                <ShieldCheck className="size-3" />
                API Key مشفر
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <input type="hidden" name="kashierEnabled" value="on" />
            <input type="hidden" name="kashierMode" value={kashierMode} />

            <div className="grid gap-5 md:grid-cols-2">
              {/* Mode Toggle */}
              <div className="space-y-2">
                <Label>وضع البيئة</Label>
                <div className="flex overflow-hidden rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setKashierMode("TEST")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                      kashierMode === "TEST"
                        ? "bg-amber-500 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <AlertCircle className="size-3.5" />
                    Test
                  </button>
                  <div className="w-px bg-border/60" />
                  <button
                    type="button"
                    onClick={() => setKashierMode("LIVE")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                      kashierMode === "LIVE"
                        ? "bg-emerald-600 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <Zap className="size-3.5" />
                    Live
                  </button>
                </div>
              </div>

              {/* Merchant ID */}
              <div className="space-y-2">
                <Label htmlFor="kashierMerchantId">Merchant ID</Label>
                <Input
                  id="kashierMerchantId"
                  name="kashierMerchantId"
                  defaultValue={initialSettings.kashierMerchantId}
                  placeholder="MID-xx-xx"
                  dir="ltr"
                />
                <FieldError state={state} name="kashierMerchantId" />
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="kashierApiKey" className="flex items-center gap-2">
                <KeyRound className="size-3.5 text-muted-foreground" />
                Payment API Key
              </Label>
              <Input
                id="kashierApiKey"
                name="kashierApiKey"
                type="password"
                placeholder={
                  initialSettings.kashierApiKeyHint
                    ? `محفوظ: ${initialSettings.kashierApiKeyHint} — اتركه فارغًا لو مش هتغيره`
                    : "الصق Payment API Key من لوحة Kashier"
                }
                dir="ltr"
              />
              <FieldError state={state} name="kashierApiKey" />
            </div>

            {/* Kashier Allowed Methods */}
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <WalletCards className="size-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">طرق الدفع داخل Kashier</p>
                  <p className="text-xs text-muted-foreground">
                    اختار بس اللي متفعل في حساب Kashier بتاعك.
                  </p>
                </div>
              </div>

              <FieldError state={state} name="kashierAllowedMethods" />

              <div className="grid gap-2.5 sm:grid-cols-3">
                {KASHIER_ALLOWED_METHODS.map((method) => {
                  const isSelected = isAllowedMethodSelected(
                    initialSettings.kashierAllowedMethods,
                    method.key,
                  );
                  return (
                    <label
                      key={method.key}
                      className={cn(
                        "relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border bg-background p-3.5 transition-all",
                        isSelected
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-border/60 hover:border-primary/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="kashierAllowedMethods"
                        value={method.key}
                        defaultChecked={isSelected}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <span className="space-y-0.5 text-right">
                        <span className="block text-sm font-semibold">{method.label}</span>
                        <span className="block text-xs leading-relaxed text-muted-foreground">
                          {method.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <input type="hidden" name="kashierMode" value="TEST" />
      )}

      {/* ── Sticky Save Bar ── */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/85 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="text-xs text-muted-foreground">
            راجع طرق الدفع قبل الحفظ — التغييرات هتظهر فوراً في المتجر
          </p>
          <Button type="submit" disabled={pending} className="h-9 min-w-36 gap-2 shadow-sm">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="size-4" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
