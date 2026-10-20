"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, FlaskConical, Loader2, ShieldCheck, Unplug } from "lucide-react";

import {
  DisconnectKashierAction,
  SaveKashierAction,
  StartKashierTestPaymentAction,
  type PaymentMethodsSettingsData,
} from "@/actions/payment-methods/payment-methods.actions";
import { KASHIER_ALLOWED_METHODS, PAYMENT_METHODS_BY_KEY, type KashierAllowedMethod } from "@/constants/welcome/payment-methods";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { KASHIER_DASHBOARD_URL, KASHIER_SIGNUP_URL } from "./method-meta";
import { MethodLogo } from "./shared";
import { intlLocale, tdir, tr, trv } from "@/lib/i18n/dashboard";

export function KashierSheetBody({ initial, onDone }: { initial: PaymentMethodsSettingsData; onDone: (enabled: boolean) => void }) {
  const connected = Boolean(initial.kashierApiKeyHint && initial.kashierMerchantId);
  const [merchantId, setMerchantId] = useState(initial.kashierMerchantId);
  const [apiKey, setApiKey] = useState("");
  const [replacingKey, setReplacingKey] = useState(!connected);
  const [allowed, setAllowed] = useState<KashierAllowedMethod[]>(initial.kashierAllowedMethods);
  const [mode, setMode] = useState<"TEST" | "LIVE">(initial.kashierMode);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();
  const [testing, startTest] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();

  const dirty =
    merchantId !== initial.kashierMerchantId ||
    !!apiKey ||
    mode !== initial.kashierMode ||
    allowed.slice().sort().join() !== initial.kashierAllowedMethods.slice().sort().join();

  const credsDone = !!merchantId.trim() && (connected || !!apiKey.trim());

  function save() {
    startSaving(async () => {
      const res = await SaveKashierAction({ merchantId, apiKey: apiKey || undefined, allowedMethods: allowed, mode }).catch(() => null);
      if (!res?.success) {
        setErrors(res?.errors ?? {});
        toast.error(res?.message ?? tr("مقدرناش نحفظ. جرّب تاني."));
        return;
      }
      toast.success(trv(res.message));
      onDone(true);
    });
  }

  function runTest() {
    startTest(async () => {
      const res = await StartKashierTestPaymentAction().catch(() => null);
      if (!res?.success) {
        toast.error(res?.message ?? tr("مقدرناش نبدأ التجربة"));
        return;
      }
      window.location.href = res.url;
    });
  }

  function disconnect() {
    startDisconnect(async () => {
      const res = await DisconnectKashierAction().catch(() => null);
      if (!res?.success) {
        toast.error(res?.message ?? tr("مقدرناش نفصل Kashier"));
        return;
      }
      toast.success(trv(res.message));
      onDone(false);
    });
  }

  return (
    <>
      <SheetHeader className="items-center gap-1.5 px-6 pt-10 pb-6 text-center">
        <MethodLogo src={PAYMENT_METHODS_BY_KEY.kashier.logo} alt="Kashier" size="lg" className="mb-2" />
        <SheetTitle className="text-[22px] font-bold">{connected ? tr("إعدادات Kashier") : tr("اربط Kashier")}</SheetTitle>
        <SheetDescription className="text-[15px]">{tr("٣ خطوات وعملاءك يدفعوا بالكارت والمحفظة.")}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-7 overflow-y-auto px-4 pb-6">
        {/* 1 — credentials */}
        <Group n={1} done={credsDone} title={tr("بيانات الربط من حسابك على Kashier")}>
          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="k-mid" className="text-[13px] font-normal text-muted-foreground">
                Merchant ID
              </Label>
              <Input
                id="k-mid"
                dir="ltr"
                value={merchantId}
                onChange={(e) => {
                  setMerchantId(e.target.value);
                  setErrors((x) => ({ ...x, merchantId: "" }));
                }}
                placeholder="MID-1234-567"
                aria-invalid={!!errors.merchantId}
                className="font-mono"
              />
              {errors.merchantId && <p className="text-[13px] text-(--sys-red)">{errors.merchantId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-key" className="text-[13px] font-normal text-muted-foreground">
                Payment API Key
              </Label>
              {replacingKey ? (
                <Input
                  id="k-key"
                  dir="ltr"
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setErrors((x) => ({ ...x, apiKey: "" }));
                  }}
                  placeholder={tr("الصق المفتاح هنا")}
                  aria-invalid={!!errors.apiKey}
                  className="font-mono"
                />
              ) : (
                <div className="apple-field flex h-11 items-center justify-between gap-2 px-3">
                  <span dir="ltr" className="flex items-center gap-1.5 font-mono text-[15px]">
                    <ShieldCheck className="size-4 text-(--sys-green)" />
                    {initial.kashierApiKeyHint}
                  </span>
                  <button type="button" onClick={() => setReplacingKey(true)} className="text-[15px] text-primary">
                    {tr("غيّره")}
                  </button>
                </div>
              )}
              <p className={cn("text-[13px]", errors.apiKey ? "text-(--sys-red)" : "text-muted-foreground")}>
                {errors.apiKey || tr("بيتحفظ مشفّر — محدش يقدر يشوفه بعد كده.")}
              </p>
            </div>
          </div>
          {!connected && (
            <p className="border-t-[0.5px] border-border px-4 py-3 text-[13px] leading-5 text-muted-foreground">
              {tr("هتلاقيهم في لوحة Kashier من")}{" "}<span className="font-medium text-foreground">Integrate now</span>{tr(". معندكش حساب؟")}{" "}
              <a href={KASHIER_SIGNUP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary">
                {tr("افتح حساب مجاني")}
                <ExternalLink className="size-3" />
              </a>
            </p>
          )}
        </Group>

        {/* 2 — methods (iOS multi-select list) */}
        <Group
          n={2}
          done={allowed.length > 0}
          title={tr("العميل يقدر يدفع بـ")}
          footer={errors.allowedMethods || tr("اختار بس اللي متفعّل في حسابك على Kashier.")}
          footerError={!!errors.allowedMethods}
        >
          <ul className="apple-rows [--row-inset:16px]">
            {KASHIER_ALLOWED_METHODS.map((am) => {
              const active = allowed.includes(am.key);
              return (
                <li key={am.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setAllowed((list) => (active ? list.filter((x) => x !== am.key) : [...list, am.key]));
                      setErrors((x) => ({ ...x, allowedMethods: "" }));
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-(--fill-3)/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px]">{am.label}</span>
                      <span className="block text-[13px] text-muted-foreground">{am.description}</span>
                    </span>
                    <Check className={cn("size-5 shrink-0 text-primary transition-opacity", active ? "opacity-100" : "opacity-0")} strokeWidth={2.6} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Group>

        {/* 3 — mode */}
        <Group n={3} done={mode === "LIVE"} title={tr("جرّب وبعدين شغّل")}>
          <div className="space-y-3 p-4">
            <SegmentedButtons
              label={tr("جرّب وبعدين شغّل")}
              value={mode}
              onChange={setMode}
              className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
              options={[
                ["TEST", tr("تجربة")],
                ["LIVE", tr("لايف")],
              ]}
            />
            <p className="text-[13px] leading-5 text-muted-foreground">
              {mode === "TEST" ? tr("مفيش فلوس حقيقية — عشان تتأكد إن كله شغال.") : tr("الدفع حقيقي والفلوس بتوصل حسابك.")}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t-[0.5px] border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-[15px]">{tr("جرّب عملية دفع")}</p>
              <p className="text-[13px] text-muted-foreground">
                {!connected ? tr("احفظ بيانات الربط الأول.") : dirty ? tr("احفظ تغييراتك الأول.") : tr("بجنيه واحد في وضع التجربة — بنتأكد إن الربط سليم.")}
              </p>
            </div>
            <button type="button" className={cn(appleButton.tinted, "text-primary")} onClick={runTest} disabled={!connected || dirty || testing}>
              {testing ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
              {tr("جرّب")}
            </button>
          </div>
        </Group>
      </div>

      <SheetFooter className="apple-glass gap-2 px-4 pt-3 pb-4">
        <button type="button" onClick={save} disabled={saving || (!dirty && connected)} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {connected ? tr("احفظ") : tr("اربط Kashier")}
        </button>
        <div className="flex items-center justify-center gap-2">
          <a href={KASHIER_DASHBOARD_URL} target="_blank" rel="noreferrer" className={cn(appleButton.plain, "mx-0 text-[13px]")}>
            {tr("لوحة Kashier")}
            <ExternalLink className="size-3" />
          </a>
          {connected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className={cn(appleButton.plain, "mx-0 text-[13px] text-(--sys-red) hover:bg-(--sys-red)/8")} disabled={disconnecting}>
                  <Unplug className="size-3.5" />
                  {tr("افصل")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={tdir()} className="sm:max-w-sm">
                <AlertDialogHeader className="text-center sm:text-center">
                  <AlertDialogTitle>{tr("تفصل Kashier؟")}</AlertDialogTitle>
                  <AlertDialogDescription>{tr("هنمسح بيانات الربط والدفع الأونلاين هيختفي من متجرك. الطلبات القديمة مش هتتأثر.")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                  <AlertDialogAction onClick={disconnect} className={cn(appleButton.destructiveFilled, "h-11 w-full text-[15px]")}>
                    {tr("افصل")}
                  </AlertDialogAction>
                  <AlertDialogCancel className={cn(appleButton.plain, "mx-0 h-11 w-full border-0 bg-transparent shadow-none")}>{tr("رجوع")}</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </SheetFooter>
    </>
  );
}

/** Settings-style group: numbered header, white inset card, optional footer note. */
function Group({
  n,
  done,
  title,
  footer,
  footerError,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  footer?: string;
  footerError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 px-4 text-[13px] font-semibold text-muted-foreground">
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full text-[11px] font-bold",
            done ? "bg-(--sys-green) text-white" : "bg-(--fill-3) text-muted-foreground",
          )}
        >
          {done ? <Check className="size-3" strokeWidth={3.5} /> : n.toLocaleString(intlLocale())}
        </span>
        {title}
      </h3>
      <div className="overflow-hidden rounded-[14px] bg-card">{children}</div>
      {footer && <p className={cn("px-4 text-[13px] leading-5", footerError ? "text-(--sys-red)" : "text-muted-foreground")}>{footer}</p>}
    </section>
  );
}
