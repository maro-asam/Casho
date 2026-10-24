"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, ShieldCheck, Unplug } from "lucide-react";

import { DisconnectPaymobAction, SavePaymobAction, type PaymentMethodsSettingsData } from "@/actions/payment-methods/payment-methods.actions";
import { PAYMENT_METHODS_BY_KEY } from "@/constants/welcome/payment-methods";
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
import { appleButton } from "@/components/saas-page";
import { PaymobCoverage } from "@/components/payments/PaymobCoverage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PAYMOB_DASHBOARD_URL, PAYMOB_SIGNUP_URL } from "./method-meta";
import { MethodLogo } from "./shared";
import { intlLocale, tdir, tr, trv } from "@/lib/i18n/dashboard";

type Field = "secretKey" | "publicKey" | "hmacSecret" | "cardIntegrationId" | "walletIntegrationId";

export function PaymobSheetBody({ initial, onDone }: { initial: PaymentMethodsSettingsData; onDone: (enabled: boolean) => void }) {
  const p = initial.paymob;
  const [form, setForm] = useState<Record<Field, string>>({
    secretKey: "",
    publicKey: p.publicKey,
    hmacSecret: "",
    cardIntegrationId: p.cardIntegrationId ? String(p.cardIntegrationId) : "",
    walletIntegrationId: p.walletIntegrationId ? String(p.walletIntegrationId) : "",
  });
  // Saved secrets are never sent back to the browser — show a hint and offer "change".
  const [replacing, setReplacing] = useState({ secretKey: !p.secretKeyHint, hmacSecret: !p.hasHmacSecret });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, startSaving] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((x) => ({ ...x, [field]: undefined }));
  };

  const dirty =
    !!form.secretKey ||
    !!form.hmacSecret ||
    form.publicKey !== p.publicKey ||
    form.cardIntegrationId !== (p.cardIntegrationId ? String(p.cardIntegrationId) : "") ||
    form.walletIntegrationId !== (p.walletIntegrationId ? String(p.walletIntegrationId) : "");

  const keysDone = !!form.publicKey.trim() && (!replacing.secretKey || !!form.secretKey.trim()) && (!replacing.hmacSecret || !!form.hmacSecret.trim());
  const idsDone = !!form.cardIntegrationId.trim() || !!form.walletIntegrationId.trim();

  function save() {
    startSaving(async () => {
      const res = await SavePaymobAction({
        secretKey: form.secretKey || undefined,
        publicKey: form.publicKey,
        hmacSecret: form.hmacSecret || undefined,
        cardIntegrationId: form.cardIntegrationId,
        walletIntegrationId: form.walletIntegrationId,
      }).catch(() => null);
      if (!res?.success) {
        setErrors((res?.errors as Partial<Record<Field, string>>) ?? {});
        toast.error(res?.message ? trv(res.message) : tr("مقدرناش نحفظ. جرّب تاني."));
        return;
      }
      toast.success(trv(res.message));
      onDone(true);
    });
  }

  function disconnect() {
    startDisconnect(async () => {
      const res = await DisconnectPaymobAction().catch(() => null);
      if (!res?.success) {
        toast.error(res?.message ? trv(res.message) : tr("مقدرناش نفصل Paymob"));
        return;
      }
      toast.success(trv(res.message));
      onDone(false);
    });
  }

  return (
    <>
      <SheetHeader className="items-center gap-1.5 px-6 pt-10 pb-6 text-center">
        <MethodLogo src={PAYMENT_METHODS_BY_KEY.paymob.logo} alt="Paymob" size="lg" className="mb-2" />
        <SheetTitle className="text-[22px] font-bold">{p.connected ? tr("إعدادات Paymob") : tr("اربط Paymob")}</SheetTitle>
        <SheetDescription className="text-[15px]">{tr("عملاءك يدفعوا بالكارت أو بأي محفظة إلكترونية، والفلوس توصل حسابك على Paymob.")}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-7 overflow-y-auto px-4 pb-6">
        <section className="space-y-2">
          <h3 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("عميلك هيقدر يدفع بـ")}</h3>
          <div className="rounded-[14px] bg-card p-4">
            <PaymobCoverage />
          </div>
          <p className="px-4 text-[13px] leading-5 text-muted-foreground">
            {tr("InstaPay مش ضمن Paymob لسه — فعّله من «تحويلات مباشرة» والعميل يحوّل عليك على طول.")}
          </p>
        </section>

        {/* 1 — keys */}
        <Group n={1} done={keysDone} title={tr("المفاتيح من حسابك على Paymob")}>
          <div className="space-y-4 p-4">
            <SecretField
              id="pm-secret"
              label="Secret Key"
              placeholder="egy_sk_live_…"
              hint={p.secretKeyHint}
              replacing={replacing.secretKey}
              onReplace={() => setReplacing((r) => ({ ...r, secretKey: true }))}
              value={form.secretKey}
              onChange={set("secretKey")}
              error={errors.secretKey}
            />
            <TextField id="pm-public" label="Public Key" placeholder="egy_pk_live_…" value={form.publicKey} onChange={set("publicKey")} error={errors.publicKey} />
            <SecretField
              id="pm-hmac"
              label="HMAC"
              placeholder={tr("الصق الـ HMAC هنا")}
              hint={p.hasHmacSecret ? "••••••••" : null}
              replacing={replacing.hmacSecret}
              onReplace={() => setReplacing((r) => ({ ...r, hmacSecret: true }))}
              value={form.hmacSecret}
              onChange={set("hmacSecret")}
              error={errors.hmacSecret}
            />
            <p className="text-[13px] text-muted-foreground">{tr("بيتحفظوا مشفّرين — محدش يقدر يشوفهم بعد كده.")}</p>
          </div>
          <p className="border-t-[0.5px] border-border px-4 py-3 text-[13px] leading-5 text-muted-foreground">
            {tr("في لوحة Paymob افتح")}{" "}<span className="font-medium text-foreground">Settings ← Account Info</span>{" "}
            {tr("وهتلاقي التلاتة. معندكش حساب؟")}{" "}
            <a href={PAYMOB_SIGNUP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary">
              {tr("افتح حساب")}
              <ExternalLink className="size-3" />
            </a>
          </p>
        </Group>

        {/* 2 — integrations */}
        <Group
          n={2}
          done={idsDone}
          title={tr("أرقام طرق الدفع (Integration ID)")}
          footer={errors.cardIntegrationId || errors.walletIntegrationId || tr("من Developers ← Payment Integrations. حط اللي متفعّل عندك بس — واحد على الأقل.")}
          footerError={!!(errors.cardIntegrationId || errors.walletIntegrationId)}
        >
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <TextField id="pm-card" label={tr("الكروت (Online Card)")} placeholder="1234567" inputMode="numeric" value={form.cardIntegrationId} onChange={set("cardIntegrationId")} />
            <TextField id="pm-wallet" label={tr("المحافظ (Mobile Wallet)")} placeholder="7654321" inputMode="numeric" value={form.walletIntegrationId} onChange={set("walletIntegrationId")} />
          </div>
        </Group>

        {p.connected && p.mode === "test" && (
          <p className="rounded-[14px] bg-(--sys-orange)/10 px-4 py-3 text-[13px] leading-5">
            {tr("إنت على مفاتيح التجربة (test) — الدفع مش حقيقي. لما Paymob يفعّل حسابك، بدّلهم بمفاتيح الـ live وأرقام الـ Integration بتاعتها.")}
          </p>
        )}
      </div>

      <SheetFooter className="apple-glass gap-2 px-4 pt-3 pb-4">
        <button type="button" onClick={save} disabled={saving || (!dirty && p.connected)} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? tr("بنتأكد من البيانات مع Paymob…") : p.connected ? tr("احفظ") : tr("اربط Paymob")}
        </button>
        <div className="flex items-center justify-center gap-2">
          <a href={PAYMOB_DASHBOARD_URL} target="_blank" rel="noreferrer" className={cn(appleButton.plain, "mx-0 text-[13px]")}>
            {tr("لوحة Paymob")}
            <ExternalLink className="size-3" />
          </a>
          {p.connected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className={cn(appleButton.plain, "mx-0 text-[13px] text-(--sys-red) hover:bg-(--sys-red)/8")} disabled={disconnecting}>
                  <Unplug className="size-3.5" />
                  {tr("افصل")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={tdir()} className="sm:max-w-sm">
                <AlertDialogHeader className="text-center sm:text-center">
                  <AlertDialogTitle>{tr("تفصل Paymob؟")}</AlertDialogTitle>
                  <AlertDialogDescription>{tr("هنمسح المفاتيح والدفع بالكارت والمحفظة هيختفي من متجرك. الطلبات القديمة مش هتتأثر.")}</AlertDialogDescription>
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

function TextField({
  id,
  label,
  error,
  ...input
}: { id: string; label: string; error?: string } & Omit<React.ComponentProps<typeof Input>, "id">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-normal text-muted-foreground">
        {label}
      </Label>
      <Input id={id} dir="ltr" autoComplete="off" spellCheck={false} aria-invalid={!!error} className="font-mono" {...input} />
      {error && <p className="text-[13px] text-(--sys-red)">{error}</p>}
    </div>
  );
}

function SecretField({
  hint,
  replacing,
  onReplace,
  ...field
}: {
  id: string;
  label: string;
  placeholder: string;
  hint: string | null;
  replacing: boolean;
  onReplace: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  if (replacing) return <TextField type="password" {...field} />;
  return (
    <div className="space-y-1.5">
      <p className="text-[13px] text-muted-foreground">{field.label}</p>
      <div className="apple-field flex h-11 items-center justify-between gap-2 px-3">
        <span dir="ltr" className="flex items-center gap-1.5 font-mono text-[15px]">
          <ShieldCheck className="size-4 text-(--sys-green)" />
          {hint}
        </span>
        <button type="button" onClick={onReplace} className="text-[15px] text-primary">
          {tr("غيّره")}
        </button>
      </div>
    </div>
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
