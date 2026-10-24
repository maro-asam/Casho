"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronUp, Info, Lock, Zap } from "lucide-react";

import {
  ReorderPaymentMethodsAction,
  TogglePaymentMethodAction,
  type PaymentMethodsSettingsData,
} from "@/actions/payment-methods/payment-methods.actions";
import { PAYMENT_METHODS, PAYMENT_METHODS_BY_KEY, type PaymentMethodKey, type PaymentRegion } from "@/constants/welcome/payment-methods";
import { Card, SegmentedButtons, StatusText, appleButton } from "@/components/saas-page";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PaymobSheetBody } from "./paymob-sheet";
import { PaymobCoverage } from "@/components/payments/PaymobCoverage";
import { ManualSheetBody } from "./manual-sheet";
import { REGIONS } from "./method-meta";
import { MethodLogo } from "./shared";
import { isRtl, lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();

export function PaymentsStudio({ initial }: { initial: PaymentMethodsSettingsData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [enabled, setEnabled] = useState<PaymentMethodKey[]>(initial.enabledPaymentMethods);
  const [details, setDetails] = useState<Record<string, string>>(initial.manualPaymentDetails);
  const [region, setRegion] = useState<PaymentRegion>("egypt");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const setupParam = searchParams.get("setup");
  const setupKey = setupParam && setupParam in PAYMENT_METHODS_BY_KEY ? (setupParam as PaymentMethodKey) : null;

  function openSetup(key: PaymentMethodKey | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (key) next.set("setup", key);
    else next.delete("setup");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const paymobConnected = initial.paymob.connected;
  const isOn = (key: PaymentMethodKey) => enabled.includes(key);
  const isSetUp = (key: PaymentMethodKey) => (key === "paymob" ? paymobConnected : !PAYMENT_METHODS_BY_KEY[key].manual || !!details[key]?.trim());

  function toggle(key: PaymentMethodKey, on: boolean) {
    if (on && !isSetUp(key)) {
      openSetup(key);
      return;
    }
    const before = enabled;
    setEnabled(on ? [...enabled, key] : enabled.filter((k) => k !== key));
    setBusyKey(key);
    startTransition(async () => {
      const res = await TogglePaymentMethodAction(key, on).catch(() => null);
      setBusyKey(null);
      if (!res?.success) {
        setEnabled(before);
        if (res?.needsSetup) openSetup(key);
        toast.error(res?.message ?? tr("مقدرناش نحفظ. جرّب تاني."));
        return;
      }
      toast.success(trv(res.message));
      router.refresh();
    });
  }

  function move(key: PaymentMethodKey, dir: -1 | 1) {
    const i = enabled.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= enabled.length) return;
    const before = enabled;
    const next = [...enabled];
    [next[i], next[j]] = [next[j], next[i]];
    setEnabled(next);
    startTransition(async () => {
      const res = await ReorderPaymentMethodsAction(next).catch(() => null);
      if (!res?.success) {
        setEnabled(before);
        toast.error(res?.message ?? tr("مقدرناش نحفظ الترتيب"));
      }
    });
  }

  // ── Health, in plain words ───────────────────────────────────────────
  const paymobOn = isOn("paymob");
  const paymobTest = paymobOn && initial.paymob.mode === "test";
  const checks: { tone: "ok" | "warn" | "danger" | "tip"; text: string; action?: { label: string; key: PaymentMethodKey } }[] = [];
  if (paymobTest) checks.push({ tone: "danger", text: tr("Paymob على مفاتيح التجربة — الدفع الأونلاين مش حقيقي والفلوس مش هتوصلك."), action: { label: tr("حط مفاتيح الـ live"), key: "paymob" } });
  else if (paymobOn) checks.push({ tone: "ok", text: tr("الدفع بالكارت والمحافظ شغال — الطلبات المدفوعة بتتعلّم لوحدها.") });
  else checks.push({ tone: "tip", text: tr("مفيش دفع أونلاين. الدفع المسبق بالكارت أو المحفظة بيقلل الطلبات اللي بتترفض عند الاستلام."), action: { label: paymobConnected ? tr("فعّل Paymob") : tr("اربط Paymob"), key: "paymob" } });
  if (isOn("cash_on_delivery")) checks.push({ tone: "ok", text: tr("الدفع عند الاستلام متاح.") });
  const manualOn = enabled.filter((k) => PAYMENT_METHODS_BY_KEY[k]?.manual);
  if (manualOn.length) checks.push({ tone: "ok", text: tr("{0} طريقة تحويل — بياناتها بتظهر للعميل بعد الطلب.", nf.format(manualOn.length)) });

  const regionMethods = PAYMENT_METHODS.filter((m) => m.region === region && m.manual);
  const regionOnCount = (r: PaymentRegion) => PAYMENT_METHODS.filter((m) => m.region === r && m.manual && isOn(m.key)).length;
  const paymobMethod = PAYMENT_METHODS_BY_KEY.paymob;
  const paymobStatus = !paymobConnected
    ? { label: tr("مش مربوط"), tone: "neutral" as const }
    : !paymobOn
      ? { label: tr("متوقف"), tone: "neutral" as const }
      : initial.paymob.mode === "test"
        ? { label: tr("وضع تجربة"), tone: "warning" as const }
        : { label: tr("شغال لايف"), tone: "success" as const };

  const ready = (key: PaymentMethodKey) => isSetUp(key);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
      {/* ═══ Settings column ═══ */}
      <div className="min-w-0 space-y-6">
        {/* ── Online: Paymob (cards + every mobile wallet) ───────── */}
        <Card title={tr("الدفع الأونلاين — كارت أو محفظة")} subtitle={tr("العميل يدفع وهو بيطلب، والطلب يتعلّم مدفوع لوحده.")}>
          {paymobConnected ? (
            <div className="apple-rows pb-2 [--row-inset:76px]">
              <label className="flex cursor-pointer items-center gap-4 px-5 py-3">
                <MethodLogo src={paymobMethod.logo} alt="Paymob" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold">Paymob</span>
                  <StatusText tone={paymobStatus.tone}>{paymobStatus.label}</StatusText>
                </span>
                <Switch
                  className="apple-switch"
                  checked={paymobOn}
                  disabled={busyKey === "paymob"}
                  onCheckedChange={(v) => toggle("paymob", v)}
                  aria-label={tr("إظهار Paymob للعملاء")}
                />
              </label>
              <div className="py-3 ps-[76px] pe-5">
                <PaymobCoverage compact />
              </div>
              <NavRow label={tr("الإعدادات")} value={initial.paymob.mode === "test" ? tr("تجربة") : tr("لايف")} onClick={() => openSetup("paymob")} />
            </div>
          ) : (
            <div className="space-y-5 px-5 pb-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <MethodLogo src={paymobMethod.logo} alt="Paymob" size="lg" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-center gap-2 text-[17px] font-semibold">
                    Paymob
                    <span className="text-[13px] font-semibold text-(--sys-orange)">{tr("موصى بيه")}</span>
                  </p>
                  <p className="text-[15px] leading-[21px] text-muted-foreground">
                    {tr("بوابة واحدة لكل الكروت وكل المحافظ الإلكترونية في مصر.")}
                  </p>
                </div>
                <button type="button" onClick={() => openSetup("paymob")} className={appleButton.filled}>
                  <Zap className="size-4" />
                  {tr("اربط Paymob")}
                </button>
              </div>
              <PaymobCoverage className="rounded-[14px] bg-(--fill-3)/50 p-4" />
            </div>
          )}
          {paymobTest && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-[0.5px] border-border bg-(--sys-orange)/8 px-5 py-3.5">
              <span className="flex items-start gap-2.5 text-[15px]">
                <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-(--sys-orange)" />
                {tr("مفاتيح التجربة شغالة — العملاء بيشوفوا Paymob بس الدفع مش حقيقي.")}
              </span>
              <button type="button" className={cn(appleButton.filled, "h-9 px-4")} onClick={() => openSetup("paymob")}>
                {tr("حط مفاتيح الـ live")}
              </button>
            </div>
          )}
        </Card>

        {/* ── Cash on delivery ────────────────────────────────── */}
        <Card title={tr("الدفع عند الاستلام")} subtitle={tr("العميل يدفع كاش للمندوب.")}>
          <div className="pb-2">
            <MethodRow methodKey="cash_on_delivery" on={isOn("cash_on_delivery")} busy={busyKey === "cash_on_delivery"} onToggle={(v) => toggle("cash_on_delivery", v)} />
          </div>
        </Card>

        {/* ── Manual transfers ────────────────────────────────── */}
        <Card
          title={tr("تحويلات مباشرة — InstaPay وفودافون كاش")}
          subtitle={tr("من غير بوابة: العميل يطلب، يحوّل على رقمك أو حسابك، وإنت تأكد الدفع من صفحة الطلب.")}
        >
          <div className="px-5 pb-3">
            <SegmentedButtons
              label={tr("السوق")}
              role="tablist"
              value={region}
              onChange={setRegion}
              options={REGIONS.map((r) => [
                r.value,
                <>
                  {r.label}
                  {regionOnCount(r.value) > 0 && <span className="text-muted-foreground tabular-nums">{nf.format(regionOnCount(r.value))}</span>}
                </>,
              ] as const)}
            />
          </div>
          <ul className="apple-rows border-t-[0.5px] border-border pb-2 [--row-inset:72px]">
            {regionMethods.map((m) => {
              const on = isOn(m.key);
              const isReady = ready(m.key);
              return (
                <li key={m.key} className="flex items-center gap-3 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => openSetup(m.key)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MethodLogo src={m.logo} alt="" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{m.label}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {isReady ? details[m.key]?.split("\n")[0] : m.description}
                      </span>
                    </span>
                  </button>
                  {isReady ? (
                    <Switch
                      className="apple-switch"
                      checked={on}
                      disabled={busyKey === m.key}
                      onCheckedChange={(v) => toggle(m.key, v)}
                      aria-label={tr("إظهار {0} للعملاء", m.label)}
                    />
                  ) : (
                    <button type="button" onClick={() => openSetup(m.key)} className={cn(appleButton.tinted, "h-8 px-3 text-[13px] font-semibold text-primary")}>
                      {tr("إعداد")}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* ═══ Live checkout preview (what the customer sees) ═══ */}
      <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <section aria-labelledby="checkout-preview" className="space-y-3">
          <p id="checkout-preview" className="px-1 text-[13px] font-semibold text-muted-foreground">
            {tr("كده صفحة الدفع عند عميلك")}
          </p>
          <div className="rounded-[36px] bg-[#1d1d1f] p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] dark:bg-[#3a3a3c]">
            <div className="overflow-hidden rounded-[29px] bg-background">
              <div className="flex justify-center pt-2.5 pb-1">
                <span className="h-[18px] w-20 rounded-full bg-[#1d1d1f] dark:bg-[#3a3a3c]" aria-hidden />
              </div>
              <div className="space-y-3 px-3.5 pt-2 pb-5">
                <p className="flex items-center gap-1.5 px-1 text-[15px] font-semibold">
                  <Lock className="size-3.5 text-(--sys-green)" />
                  {tr("طريقة الدفع")}
                </p>
                {enabled.length === 0 ? (
                  <p className="rounded-[14px] bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">{tr("فعّل طريقة دفع واحدة على الأقل.")}</p>
                ) : (
                  <ol className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:44px]">
                    {enabled.map((key, i) => {
                      const m = PAYMENT_METHODS_BY_KEY[key];
                      return (
                        <li key={key} className="group flex items-center gap-2.5 px-3 py-2.5">
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-5 shrink-0 place-items-center rounded-full",
                              i === 0 ? "bg-primary text-primary-foreground" : "ring-[1.5px] ring-(--label-3) ring-inset",
                            )}
                          >
                            {i === 0 && <Check className="size-3" strokeWidth={3.5} />}
                          </span>
                          <MethodLogo src={m.logo} alt="" size="xs" />
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{m.label}</span>
                          <span className="flex gap-0.5 opacity-100 transition-opacity xl:opacity-0 xl:group-focus-within:opacity-100 xl:group-hover:opacity-100">
                            <MoveBtn label={tr("طلّع {0} لفوق", m.label)} disabled={i === 0} onClick={() => move(key, -1)}>
                              <ChevronUp className="size-3.5" strokeWidth={2.6} />
                            </MoveBtn>
                            <MoveBtn label={tr("نزّل {0} لتحت", m.label)} disabled={i === enabled.length - 1} onClick={() => move(key, 1)}>
                              <ChevronDown className="size-3.5" strokeWidth={2.6} />
                            </MoveBtn>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <div className="grid h-11 place-items-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground" aria-hidden>
                  {tr("تأكيد الطلب")}
                </div>
              </div>
            </div>
          </div>
          <p className="px-1 text-[13px] text-muted-foreground">{tr("الأولى بتبقى مختارة تلقائي — رتّبهم بالأسهم.")}</p>
        </section>

        <Card title={tr("{0} {1}", nf.format(enabled.length), enabled.length === 1 ? tr("طريقة") : tr("طرق"))} subtitle={tr("عملاءك دلوقتي يقدروا يدفعوا بـ")}>
          <ul className="apple-rows pb-2 [--row-inset:52px]">
            {checks.map((c) => {
              const Icon = c.tone === "ok" ? Check : c.tone === "tip" ? Info : AlertTriangle;
              return (
                <li key={c.text} className="flex items-start gap-3 px-5 py-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white",
                      c.tone === "ok" && "bg-(--sys-green)",
                      c.tone === "tip" && "bg-primary",
                      (c.tone === "warn" || c.tone === "danger") && "bg-(--sys-red)",
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] leading-[21px]">
                    {c.text}
                    {c.action && (
                      <button type="button" onClick={() => openSetup(c.action!.key)} className="ms-1.5 font-semibold text-primary hover:underline">
                        {c.action.label}
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </aside>

      {/* ═══ Setup sheet (URL-driven: ?setup=<key>) ═══ */}
      <Sheet open={!!setupKey} onOpenChange={(open) => !open && openSetup(null)}>
        <SheetContent
          side={isRtl() ? "left" : "right"}
          dir={tdir()}
          className="apple-ui apple-form gap-0 border-0 bg-background text-foreground data-[side=left]:w-full data-[side=left]:sm:max-w-md data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        >
          {setupKey === "paymob" ? (
            <PaymobSheetBody
              key="paymob"
              initial={initial}
              onDone={(on) => {
                setEnabled((list) => (on ? (list.includes("paymob") ? list : ["paymob", ...list]) : list.filter((k) => k !== "paymob")));
                openSetup(null);
                router.refresh();
              }}
            />
          ) : setupKey && PAYMENT_METHODS_BY_KEY[setupKey].manual ? (
            <ManualSheetBody
              key={setupKey}
              methodKey={setupKey}
              initialValue={details[setupKey] ?? ""}
              enabled={isOn(setupKey)}
              onSaved={(value) => {
                setDetails((d) => ({ ...d, [setupKey]: value }));
                setEnabled((list) => (list.includes(setupKey) ? list : [...list, setupKey]));
                openSetup(null);
                router.refresh();
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavRow({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-between gap-3 py-3 ps-[76px] pe-5 text-start text-[15px] transition-colors hover:bg-(--fill-3)/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
      <span className="flex items-center gap-1 text-muted-foreground">
        {value}
        <ChevronLeft className="size-[18px] text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
      </span>
    </button>
  );
}

function MethodRow({ methodKey, on, busy, onToggle }: { methodKey: PaymentMethodKey; on: boolean; busy: boolean; onToggle: (v: boolean) => void }) {
  const m = PAYMENT_METHODS_BY_KEY[methodKey];
  return (
    <label className="flex cursor-pointer items-center gap-4 px-5 py-3">
      <MethodLogo src={m.logo} alt={m.label} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{m.label}</span>
        <StatusText tone={on ? "success" : "neutral"}>{on ? tr("ظاهر للعملاء") : tr("مش مفعّل")}</StatusText>
      </span>
      <Switch className="apple-switch" checked={on} disabled={busy} onCheckedChange={onToggle} aria-label={tr("إظهار {0} للعملاء", m.label)} />
    </label>
  );
}

function MoveBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="apple-press grid size-7 place-items-center rounded-full bg-(--fill-3) text-primary disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
