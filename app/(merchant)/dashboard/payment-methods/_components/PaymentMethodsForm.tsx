"use client";

import { useActionState, useEffect, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  CreditCard,
  KeyRound,
  Landmark,
  Loader2,
  Save,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import {
  KASHIER_ALLOWED_METHODS,
  type KashierAllowedMethod,
} from "@/constants/welcome/payment-methods";
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

type PaymentMethodsFormProps = {
  initialSettings: PaymentMethodsSettingsData;
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
    <div className="rounded-xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor={name} className="cursor-pointer text-base font-semibold">
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

export default function PaymentMethodsForm({
  initialSettings,
}: PaymentMethodsFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    UpdatePaymentMethodsAction,
    null,
  );

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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="storeId" value={initialSettings.storeId} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <WalletCards className="size-5 text-primary" />
                الطرق اليدوية
              </CardTitle>
              <CardDescription>
                الطرق دي هتظهر للعميل في checkout، والطلب هيتسجل Pending لحد
                ما التاجر يراجعه.
              </CardDescription>
            </div>
            <Badge variant="outline">{initialSettings.storeName}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <FieldError state={state} name="paymentMethods" />

          <ToggleCard
            name="cashOnDeliveryEnabled"
            title="الدفع عند الاستلام"
            description="العميل يدفع كاش عند وصول الطلب. دي أفضل fallback لو مفيش بوابة أونلاين."
            defaultChecked={initialSettings.cashOnDeliveryEnabled}
            icon={Banknote}
          />

          <ToggleCard
            name="vodafoneCashEnabled"
            title="فودافون كاش"
            description="اعرض رقم المحفظة للعميل بعد تأكيد الطلب عشان يحول عليه."
            defaultChecked={initialSettings.vodafoneCashEnabled}
            icon={Smartphone}
          >
            <Label htmlFor="vodafoneCashNumber">رقم فودافون كاش</Label>
            <Input
              id="vodafoneCashNumber"
              name="vodafoneCashNumber"
              defaultValue={initialSettings.vodafoneCashNumber}
              placeholder="مثال: 01012345678"
              inputMode="tel"
            />
            <FieldError state={state} name="vodafoneCashNumber" />
          </ToggleCard>

          <ToggleCard
            name="instapayEnabled"
            title="InstaPay"
            description="اعرض عنوان InstaPay أو رقم الهاتف/الحساب الذي سيحول عليه العميل."
            defaultChecked={initialSettings.instapayEnabled}
            icon={Building2}
          >
            <Label htmlFor="instapayAddress">بيانات InstaPay</Label>
            <Input
              id="instapayAddress"
              name="instapayAddress"
              defaultValue={initialSettings.instapayAddress}
              placeholder="مثال: username@instapay أو رقم الهاتف"
            />
            <FieldError state={state} name="instapayAddress" />
          </ToggleCard>

          <ToggleCard
            name="bankTransferEnabled"
            title="تحويل بنكي"
            description="اعرض بيانات الحساب البنكي للعميل بعد تأكيد الطلب."
            defaultChecked={initialSettings.bankTransferEnabled}
            icon={Landmark}
          >
            <Label htmlFor="bankTransferDetails">بيانات الحساب البنكي</Label>
            <Textarea
              id="bankTransferDetails"
              name="bankTransferDetails"
              defaultValue={initialSettings.bankTransferDetails}
              placeholder={"اسم البنك:\nاسم صاحب الحساب:\nرقم الحساب / IBAN:"}
              rows={5}
            />
            <FieldError state={state} name="bankTransferDetails" />
          </ToggleCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="size-5 text-primary" />
                ربط Kashier
              </CardTitle>
              <CardDescription>
                التاجر يجيب Merchant ID و Payment API Key من لوحة تحكم Kashier،
                وإحنا هنستخدمهم server-side لإنشاء رابط الدفع والتحقق من
                callback.
              </CardDescription>
            </div>
            <Badge className="gap-1" variant="secondary">
              <ShieldCheck className="size-3.5" />
              Encrypted API Key
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <ToggleCard
            name="kashierEnabled"
            title="تفعيل Kashier في checkout"
            description="لما العميل يختار Kashier، هننشئ order ونوديه على Hosted Payment Page بتاعة Kashier."
            defaultChecked={initialSettings.kashierEnabled}
            icon={CreditCard}
            badge="Online"
          />

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
            <Label htmlFor="kashierApiKey" className="flex items-center gap-2">
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
            <div className="space-y-1">
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
                    <span className="block font-semibold">{method.label}</span>
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
