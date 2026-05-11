"use client";

import Image from "next/image";
import {
  useActionState,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
  WalletCards,
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

type FieldErrorProps = {
  state: PaymentMethodsFormState | null;
  name: string;
};

function FieldError({ state, name }: FieldErrorProps) {
  const message = state?.errors?.[name]?.[0];

  if (!message) return null;

  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

type ToggleCardProps = {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
  icon: ComponentType<{ className?: string }>;
  children?: ReactNode;
  badge?: string;
};

function ToggleCard({
  name,
  title,
  description,
  defaultChecked,
  icon: Icon,
  children,
  badge,
}: ToggleCardProps) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>

          <div className="space-y-1 text-right">
            <div className="flex flex-wrap items-center gap-2">
              <Label
                htmlFor={name}
                className="cursor-pointer text-base font-semibold"
              >
                {title}
              </Label>

              {badge ? <Badge variant="secondary">{badge}</Badge> : null}
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="mt-2 size-5 accent-primary"
        />
      </div>

      {children ? <div className="mt-4 space-y-2">{children}</div> : null}
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
        "overflow-hidden rounded-2xl border bg-background shadow-sm transition-all",
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-4 p-4"
      >
        <input
          id={inputId}
          type="checkbox"
          name="enabledPaymentMethods"
          value={method.key}
          checked={checked}
          onChange={() => onToggle(method.key)}
          className="sr-only"
        />

        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-white p-2">
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
              <Badge variant="outline">تحويل يدوي</Badge>
            ) : (
              <Badge variant="secondary">بوابة دفع</Badge>
            )}
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            {method.description}
          </p>
        </div>

        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border text-transparent transition",
            checked && "border-primary bg-primary text-primary-foreground",
          )}
        >
          {checked ? <CheckCircle2 className="size-4" /> : null}
        </span>
      </label>

      {checked && method.manual ? (
        <div className="border-t bg-muted/20 p-4">
          <div className="space-y-2">
            <Label htmlFor={manualInputId}>
              بيانات التحويل الخاصة بـ {method.label}
            </Label>

            <Textarea
              id={manualInputId}
              name={manualInputId}
              defaultValue={defaultManualValue}
              placeholder={`اكتب بيانات الدفع التي ستظهر للعميل بعد اختيار ${method.label}`}
              rows={4}
              className="resize-none text-right leading-7"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              مثال: رقم المحفظة، البريد، رقم الحساب، IBAN، أو تعليمات الدفع.
            </p>

            <FieldError state={state} name={manualInputId} />
          </div>
        </div>
      ) : null}
    </div>
  );
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

  const kashierSelected = selectedMethods.includes("kashier");

  function togglePaymentMethod(methodKey: PaymentMethodKey) {
    setSelectedMethods((current) => {
      if (current.includes(methodKey)) {
        return current.filter((key) => key !== methodKey);
      }

      return [...current, methodKey];
    });
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
    <form action={formAction} className="space-y-6" dir="rtl">
      <input type="hidden" name="storeId" value={initialSettings.storeId} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 text-right">
              <CardTitle className="flex items-center gap-2 text-xl">
                <WalletCards className="size-5 text-primary" />
                طرق الدفع في المتجر
              </CardTitle>

              <CardDescription>
                اختار طريقة الدفع، ولو محتاجة بيانات تحويل هتظهر الخانة تحتها
                مباشرة بشكل منظم.
              </CardDescription>
            </div>

            <Badge variant="outline">{initialSettings.storeName}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <FieldError state={state} name="enabledPaymentMethods" />

          {(["global", "egypt", "saudi"] as PaymentRegion[]).map((region) => {
            const methods = PAYMENT_METHODS.filter(
              (method) => method.region === region,
            );

            return (
              <section key={region} className="space-y-4">
                <div className="space-y-1 text-right">
                  <h3 className="text-lg font-semibold">
                    {PAYMENT_REGION_LABELS[region]}
                  </h3>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {PAYMENT_REGION_DESCRIPTIONS[region]}
                  </p>
                </div>

                <div className="grid gap-3">
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

      {kashierSelected ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-right">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="size-5 text-primary" />
                  إعدادات Kashier
                </CardTitle>

                <CardDescription>
                  Kashier متفعل لأنك اخترته من طرق الدفع. املأ بيانات الربط
                  عشان يشتغل في checkout.
                </CardDescription>
              </div>

              <Badge className="gap-1" variant="secondary">
                <ShieldCheck className="size-3.5" />
                Encrypted API Key
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <input type="hidden" name="kashierEnabled" value="on" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kashierMode">الوضع</Label>

                <select
                  id="kashierMode"
                  name="kashierMode"
                  defaultValue={initialSettings.kashierMode}
                  className={cn(
                    "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <option value="TEST">Test</option>
                  <option value="LIVE">Live</option>
                </select>
              </div>

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

            <div className="space-y-2">
              <Label
                htmlFor="kashierApiKey"
                className="flex items-center gap-2"
              >
                <KeyRound className="size-4 text-muted-foreground" />
                Payment API Key
              </Label>

              <Input
                id="kashierApiKey"
                name="kashierApiKey"
                type="password"
                placeholder={
                  initialSettings.kashierApiKeyHint
                    ? `محفوظ حاليًا: ${initialSettings.kashierApiKeyHint} - اتركه فارغًا لو مش هتغيره`
                    : "الصق Payment API Key من Kashier"
                }
                dir="ltr"
              />

              <FieldError state={state} name="kashierApiKey" />
            </div>

            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="space-y-1 text-right">
                <Label>طرق الدفع داخل Kashier</Label>

                <p className="text-sm leading-6 text-muted-foreground">
                  دي قيمة allowedMethods اللي هنبعتها لـ Kashier. اختار بس اللي
                  متفعل عندك في حساب Kashier.
                </p>
              </div>

              <FieldError state={state} name="kashierAllowedMethods" />

              <div className="grid gap-3 md:grid-cols-3">
                {KASHIER_ALLOWED_METHODS.map((method) => (
                  <label
                    key={method.key}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-3 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      name="kashierAllowedMethods"
                      value={method.key}
                      defaultChecked={isAllowedMethodSelected(
                        initialSettings.kashierAllowedMethods,
                        method.key,
                      )}
                      className="mt-1 size-4 accent-primary"
                    />

                    <span className="space-y-1 text-right">
                      <span className="block font-semibold">
                        {method.label}
                      </span>

                      <span className="block text-xs leading-5 text-muted-foreground">
                        {method.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <input type="hidden" name="kashierMode" value="TEST" />
      )}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-40 gap-2">
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="size-4" />
              حفظ طرق الدفع
            </>
          )}
        </Button>
      </div>
    </form>
  );
}