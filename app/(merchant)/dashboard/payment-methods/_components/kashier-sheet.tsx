"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, FlaskConical, KeyRound, Loader2, ShieldCheck, Unplug, Zap } from "lucide-react";

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
import { Button } from "@/components/ui/button";
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
      <SheetHeader className="border-b border-border pb-4 text-start">
        <div className="flex items-center gap-3">
          <MethodLogo src={PAYMENT_METHODS_BY_KEY.kashier.logo} alt="Kashier" />
          <div className="min-w-0">
            <SheetTitle>{connected ? tr("إعدادات Kashier") : tr("اربط Kashier")}</SheetTitle>
            <SheetDescription>{tr("٣ خطوات وعملاءك يدفعوا بالكارت والمحفظة.")}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        <ol className="relative space-y-8 before:absolute before:inset-y-3 before:start-[13px] before:w-px before:bg-border">
          {/* 1 — credentials */}
          <Step n={1} done={credsDone} title={tr("بيانات الربط من حسابك على Kashier")}>
            {!connected && (
              <p className="text-xs leading-6 text-muted-foreground">
                {tr("هتلاقيهم في لوحة Kashier من")}{" "}<span className="font-medium text-foreground">Integrate now</span>{tr(". معندكش حساب؟")}{" "}
                <a href={KASHIER_SIGNUP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline">
                  {tr("افتح حساب مجاني")}
                  <ExternalLink className="size-3" />
                </a>
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="k-mid">Merchant ID</Label>
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
              {errors.merchantId && <p className="text-xs text-destructive">{errors.merchantId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-key" className="flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-muted-foreground" />
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
                <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3">
                  <span dir="ltr" className="flex items-center gap-1.5 font-mono text-sm">
                    <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    {initial.kashierApiKeyHint}
                  </span>
                  <button type="button" onClick={() => setReplacingKey(true)} className="text-xs font-medium text-primary hover:underline">
                    {tr("غيّره")}
                  </button>
                </div>
              )}
              <p className={errors.apiKey ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                {errors.apiKey || tr("بيتحفظ مشفّر — محدش يقدر يشوفه بعد كده.")}
              </p>
            </div>
          </Step>

          {/* 2 — methods */}
          <Step n={2} done={allowed.length > 0} title={tr("العميل يقدر يدفع بـ")}>
            <div className="grid gap-2">
              {KASHIER_ALLOWED_METHODS.map((am) => {
                const active = allowed.includes(am.key);
                return (
                  <button
                    key={am.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setAllowed((list) => (active ? list.filter((x) => x !== am.key) : [...list, am.key]));
                      setErrors((x) => ({ ...x, allowedMethods: "" }));
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-start transition-colors",
                      active ? "border-primary/50 bg-primary/[0.04]" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded border",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                      )}
                    >
                      {active && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{am.label}</span>
                      <span className="block text-xs text-muted-foreground">{am.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className={errors.allowedMethods ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {errors.allowedMethods || tr("اختار بس اللي متفعّل في حسابك على Kashier.")}
            </p>
          </Step>

          {/* 3 — mode */}
          <Step n={3} done={mode === "LIVE"} title={tr("جرّب وبعدين شغّل")}>
            <div className="grid grid-cols-2 gap-2">
              <ModeCard active={mode === "TEST"} onClick={() => setMode("TEST")} icon={FlaskConical} title={tr("تجربة")} text={tr("مفيش فلوس حقيقية — عشان تتأكد إن كله شغال.")} tone="amber" />
              <ModeCard active={mode === "LIVE"} onClick={() => setMode("LIVE")} icon={Zap} title={tr("لايف")} text={tr("الدفع حقيقي والفلوس بتوصل حسابك.")} tone="emerald" />
            </div>
            <div className="rounded-lg border border-dashed border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{tr("جرّب عملية دفع")}</p>
                  <p className="text-xs text-muted-foreground">
                    {!connected ? tr("احفظ بيانات الربط الأول.") : dirty ? tr("احفظ تغييراتك الأول.") : tr("بجنيه واحد في وضع التجربة — بنتأكد إن الربط سليم.")}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={runTest} disabled={!connected || dirty || testing}>
                  {testing ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
                  {tr("جرّب")}
                </Button>
              </div>
            </div>
          </Step>
        </ol>
      </div>

      <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border">
        <Button onClick={save} disabled={saving || (!dirty && connected)} className="gap-1.5">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {connected ? tr("احفظ") : tr("اربط Kashier")}
        </Button>
        <div className="flex items-center">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <a href={KASHIER_DASHBOARD_URL} target="_blank" rel="noreferrer">
              {tr("لوحة Kashier")}
              <ExternalLink className="size-3" />
            </a>
          </Button>
          {connected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" disabled={disconnecting}>
                  <Unplug className="size-3.5" />
                  {tr("افصل")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={tdir()}>
                <AlertDialogHeader className="text-start">
                  <AlertDialogTitle>{tr("تفصل Kashier؟")}</AlertDialogTitle>
                  <AlertDialogDescription>{tr("هنمسح بيانات الربط والدفع الأونلاين هيختفي من متجرك. الطلبات القديمة مش هتتأثر.")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:justify-start">
                  <AlertDialogAction onClick={disconnect} className="bg-destructive text-white hover:bg-destructive/90">
                    {tr("افصل")}
                  </AlertDialogAction>
                  <AlertDialogCancel>{tr("رجوع")}</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </SheetFooter>
    </>
  );
}

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="relative ps-10">
      <span
        className={cn(
          "absolute start-0 top-0 grid size-7 place-items-center rounded-full text-xs font-semibold ring-4 ring-popover",
          done ? "bg-primary text-primary-foreground" : "border border-border bg-popover text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : n.toLocaleString(intlLocale())}
      </span>
      <p className="mb-3 pt-1 text-sm font-semibold">{title}</p>
      <div className="space-y-3">{children}</div>
    </li>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  text,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Zap;
  title: string;
  text: string;
  tone: "amber" | "emerald";
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-start transition-colors",
        active
          ? tone === "emerald"
            ? "border-emerald-500/60 bg-emerald-500/[0.06]"
            : "border-amber-500/60 bg-amber-500/[0.06]"
          : "border-border hover:bg-muted/40",
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className={cn("size-4", tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")} />
        {title}
      </span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
    </button>
  );
}
