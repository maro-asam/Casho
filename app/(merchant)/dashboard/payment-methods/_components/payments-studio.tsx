"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowUp, BadgeCheck, CheckCircle2, CreditCard, Info, Landmark, Settings2, Wallet, Zap } from "lucide-react";

import {
  ReorderPaymentMethodsAction,
  TogglePaymentMethodAction,
  type PaymentMethodsSettingsData,
} from "@/actions/payment-methods/payment-methods.actions";
import { PAYMENT_METHODS, PAYMENT_METHODS_BY_KEY, type PaymentMethodKey, type PaymentRegion } from "@/constants/welcome/payment-methods";
import { StatusPill } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { KashierSheetBody } from "./kashier-sheet";
import { ManualSheetBody } from "./manual-sheet";
import { REGIONS } from "./method-meta";
import { MethodLogo, OnDot } from "./shared";

const nf = new Intl.NumberFormat("ar-EG");

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
    next.delete("kashier_test");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const kashierConnected = Boolean(initial.kashierApiKeyHint && initial.kashierMerchantId);
  const isOn = (key: PaymentMethodKey) => enabled.includes(key);
  const isSetUp = (key: PaymentMethodKey) => (key === "kashier" ? kashierConnected : !PAYMENT_METHODS_BY_KEY[key].manual || !!details[key]?.trim());

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
        toast.error(res?.message ?? "مقدرناش نحفظ. جرّب تاني.");
        return;
      }
      toast.success(res.message);
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
        toast.error(res?.message ?? "مقدرناش نحفظ الترتيب");
      }
    });
  }

  // ── Health, in plain words ───────────────────────────────────────────
  const kashierOn = isOn("kashier");
  const kashierTest = kashierOn && initial.kashierMode === "TEST";
  const checks: { tone: "ok" | "warn" | "danger" | "tip"; text: string; action?: { label: string; key: PaymentMethodKey } }[] = [];
  if (kashierTest) checks.push({ tone: "danger", text: "Kashier في وضع التجربة — الدفع الأونلاين مش حقيقي والفلوس مش هتوصلك.", action: { label: "شغّله لايف", key: "kashier" } });
  else if (kashierOn) checks.push({ tone: "ok", text: "الدفع الأونلاين شغال — الطلبات المدفوعة بتتعلّم لوحدها." });
  else checks.push({ tone: "tip", text: "مفيش دفع أونلاين. الدفع المسبق بيقلل الطلبات اللي بتترفض عند الاستلام.", action: { label: kashierConnected ? "فعّل Kashier" : "اربط Kashier", key: "kashier" } });
  if (isOn("cash_on_delivery")) checks.push({ tone: "ok", text: "الدفع عند الاستلام متاح." });
  const manualOn = enabled.filter((k) => PAYMENT_METHODS_BY_KEY[k]?.manual);
  if (manualOn.length) checks.push({ tone: "ok", text: `${nf.format(manualOn.length)} طريقة تحويل — بياناتها بتظهر للعميل بعد الطلب.` });

  const regionMethods = PAYMENT_METHODS.filter((m) => m.region === region && m.manual);
  const regionOnCount = (r: PaymentRegion) => PAYMENT_METHODS.filter((m) => m.region === r && m.manual && isOn(m.key)).length;
  const kashierMethod = PAYMENT_METHODS_BY_KEY.kashier;
  const kashierStatus = !kashierConnected
    ? { label: "مش مربوط", tone: "neutral" as const }
    : !kashierOn
      ? { label: "متوقف", tone: "neutral" as const }
      : initial.kashierMode === "LIVE"
        ? { label: "شغال لايف", tone: "success" as const }
        : { label: "وضع تجربة", tone: "warning" as const };

  return (
    <div className="space-y-10">
      {/* ═══ Overview: what the customer can do right now ═══ */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div className="space-y-5 p-6">
            <div>
              <p className="text-sm text-muted-foreground">عملاءك دلوقتي يقدروا يدفعوا بـ</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {nf.format(enabled.length)} {enabled.length === 1 ? "طريقة" : "طرق"}
              </p>
              <div className="mt-3 flex [&>*+*]:-ms-2">
                {enabled.slice(0, 7).map((k) => (
                  <MethodLogo key={k} src={PAYMENT_METHODS_BY_KEY[k].logo} alt={PAYMENT_METHODS_BY_KEY[k].label} size="sm" className="ring-2 ring-card" />
                ))}
                {enabled.length > 7 && (
                  <span className="grid size-8 place-items-center rounded-lg bg-muted text-xs font-medium ring-2 ring-card">+{nf.format(enabled.length - 7)}</span>
                )}
              </div>
            </div>

            <ul className="space-y-2.5">
              {checks.map((c) => {
                const Icon = c.tone === "ok" ? CheckCircle2 : c.tone === "tip" ? Info : AlertTriangle;
                return (
                  <li key={c.text} className="flex flex-wrap items-start gap-2 text-sm leading-6">
                    <Icon
                      className={cn(
                        "mt-1 size-4 shrink-0",
                        c.tone === "ok" && "text-emerald-600 dark:text-emerald-400",
                        c.tone === "tip" && "text-muted-foreground",
                        (c.tone === "warn" || c.tone === "danger") && "text-rose-600 dark:text-rose-400",
                      )}
                    />
                    <span className={cn("min-w-0 flex-1", c.tone === "danger" && "font-medium text-rose-800 dark:text-rose-300")}>{c.text}</span>
                    {c.action && (
                      <button type="button" onClick={() => openSetup(c.action!.key)} className="text-sm font-medium text-primary hover:underline">
                        {c.action.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Checkout mock */}
          <div className="border-t border-border bg-muted/30 p-6 lg:border-s lg:border-t-0">
            <p className="mb-3 text-xs font-medium text-muted-foreground">كده صفحة الدفع عند عميلك</p>
            <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
              <p className="mb-2.5 flex items-center gap-1.5 px-1 text-sm font-semibold">
                <Wallet className="size-4 text-primary" />
                طريقة الدفع
              </p>
              <ol className="space-y-1.5">
                {enabled.map((key, i) => {
                  const m = PAYMENT_METHODS_BY_KEY[key];
                  return (
                    <li
                      key={key}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg border px-2.5 py-2",
                        i === 0 ? "border-primary bg-primary/[0.05]" : "border-border",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn("grid size-4 shrink-0 place-items-center rounded-full border", i === 0 ? "border-primary bg-primary" : "border-muted-foreground/40")}
                      >
                        {i === 0 && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                      </span>
                      <MethodLogo src={m.logo} alt="" size="xs" />
                      <span className="min-w-0 flex-1 truncate text-sm">{m.label}</span>
                      <span className="flex opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                        <MoveBtn label={`طلّع ${m.label} لفوق`} disabled={i === 0} onClick={() => move(key, -1)}>
                          <ArrowUp className="size-3.5" />
                        </MoveBtn>
                        <MoveBtn label={`نزّل ${m.label} لتحت`} disabled={i === enabled.length - 1} onClick={() => move(key, 1)}>
                          <ArrowDown className="size-3.5" />
                        </MoveBtn>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">الأولى بتبقى مختارة تلقائي — رتّبهم بالأسهم.</p>
          </div>
        </div>
      </section>

      {/* ═══ Online ═══ */}
      <Section icon={CreditCard} title="الدفع الأونلاين" description="العميل يدفع وهو بيطلب، والفلوس توصل حسابك.">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6",
            kashierOn && initial.kashierMode === "LIVE" ? "border-emerald-500/40" : kashierTest ? "border-amber-500/50" : "border-border",
          )}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <MethodLogo src={kashierMethod.logo} alt="Kashier" size="lg" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">Kashier</h3>
                <StatusPill tone={kashierStatus.tone}>{kashierStatus.label}</StatusPill>
                {!kashierConnected && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">موصى بيه</span>
                )}
              </div>
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <Benefit icon={CreditCard} text="كروت ميزة وفيزا وماستركارد" />
                <Benefit icon={Wallet} text="محافظ إلكترونية وتقسيط" />
                <Benefit icon={BadgeCheck} text="الطلب يتعلّم مدفوع لوحده" />
              </ul>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
              {kashierConnected ? (
                <>
                  <Switch checked={kashierOn} disabled={busyKey === "kashier"} onCheckedChange={(v) => toggle("kashier", v)} aria-label="إظهار Kashier للعملاء" />
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openSetup("kashier")}>
                    <Settings2 className="size-4" />
                    الإعدادات
                  </Button>
                </>
              ) : (
                <Button onClick={() => openSetup("kashier")} className="gap-1.5">
                  <Zap className="size-4" />
                  اربط Kashier
                </Button>
              )}
            </div>
          </div>
          {kashierTest && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                وضع التجربة شغال — العملاء بيشوفوا Kashier بس الدفع مش حقيقي.
              </span>
              <Button size="sm" variant="outline" className="border-amber-600/30 bg-transparent" onClick={() => openSetup("kashier")}>
                شغّله لايف
              </Button>
            </div>
          )}
        </div>
      </Section>

      {/* ═══ COD ═══ */}
      <Section icon={Wallet} title="الدفع عند الاستلام" description="العميل يدفع كاش للمندوب.">
        <MethodRow methodKey="cash_on_delivery" on={isOn("cash_on_delivery")} busy={busyKey === "cash_on_delivery"} onToggle={(v) => toggle("cash_on_delivery", v)} />
      </Section>

      {/* ═══ Manual ═══ */}
      <Section
        icon={Landmark}
        title="تحويلات ومحافظ"
        description="العميل يطلب، يحوّل على بياناتك، وإنت تأكد الدفع من صفحة الطلب."
        aside={
          <div role="tablist" aria-label="السوق" className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {REGIONS.map((r) => (
              <button
                key={r.value}
                role="tab"
                type="button"
                aria-selected={region === r.value}
                onClick={() => setRegion(r.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors",
                  region === r.value ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
                {regionOnCount(r.value) > 0 && (
                  <span className="rounded bg-primary/10 px-1 text-[11px] font-medium tabular-nums text-primary">{nf.format(regionOnCount(r.value))}</span>
                )}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {regionMethods.map((m) => {
            const on = isOn(m.key);
            const ready = isSetUp(m.key);
            return (
              <article
                key={m.key}
                className={cn("flex flex-col rounded-xl border bg-card p-4 transition-colors", on ? "border-primary/40" : "border-border")}
              >
                <div className="flex items-start gap-3">
                  <MethodLogo src={m.logo} alt={m.label} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.label}</p>
                    <OnDot on={on} label={on ? "ظاهر للعملاء" : ready ? "متوقف" : "محتاج إعداد"} />
                  </div>
                  {ready && <Switch checked={on} disabled={busyKey === m.key} onCheckedChange={(v) => toggle(m.key, v)} aria-label={`إظهار ${m.label} للعملاء`} />}
                </div>
                <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                  {ready ? details[m.key] : m.description}
                </p>
                <Button variant={ready ? "ghost" : "outline"} size="sm" className="mt-3 self-start" onClick={() => openSetup(m.key)}>
                  {ready ? "عدّل البيانات" : "إعداد"}
                </Button>
              </article>
            );
          })}
        </div>
      </Section>

      {/* ═══ Setup sheet (URL-driven: ?setup=<key>) ═══ */}
      <Sheet open={!!setupKey} onOpenChange={(open) => !open && openSetup(null)}>
        <SheetContent side="left" dir="rtl" className="gap-0 data-[side=left]:w-full data-[side=left]:sm:max-w-lg">
          {setupKey === "kashier" ? (
            <KashierSheetBody
              key="kashier"
              initial={initial}
              onDone={(on) => {
                setEnabled((list) => (on ? (list.includes("kashier") ? list : ["kashier", ...list]) : list.filter((k) => k !== "kashier")));
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

function Section({
  icon: Icon,
  title,
  description,
  aside,
  children,
}: {
  icon: typeof Wallet;
  title: string;
  description: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function MethodRow({ methodKey, on, busy, onToggle }: { methodKey: PaymentMethodKey; on: boolean; busy: boolean; onToggle: (v: boolean) => void }) {
  const m = PAYMENT_METHODS_BY_KEY[methodKey];
  return (
    <label className={cn("flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-4", on ? "border-primary/40" : "border-border")}>
      <MethodLogo src={m.logo} alt={m.label} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{m.label}</span>
        <OnDot on={on} />
      </span>
      <Switch checked={on} disabled={busy} onCheckedChange={onToggle} aria-label={`إظهار ${m.label} للعملاء`} />
    </label>
  );
}

function Benefit({ icon: Icon, text }: { icon: typeof Wallet; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-primary" />
      {text}
    </li>
  );
}

function MoveBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
    >
      {children}
    </button>
  );
}
