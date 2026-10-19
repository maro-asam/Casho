"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, CreditCard, ImagePlus, Landmark, Loader2, ShieldCheck, Smartphone, Wallet, X, Zap } from "lucide-react";
import { toast } from "sonner";
import type { TopupMethod } from "@prisma/client";

import { CreateTopupRequestAction, InitiateKashierTopupAction } from "@/actions/balance/topup.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TOPUP_METHODS } from "@/constants/topup";
import { formatMoney } from "@/lib/balance-ui/meta";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const MIN_EGP = 10;
const nf = lazyIntl.number();
const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const METHOD_ICONS: Record<string, typeof Smartphone> = { VODAFONE_CASH: Smartphone, INSTAPAY: Wallet, BANK_TRANSFER: Landmark };

type Props = {
  storeId: string;
  balance: number;
  price: number;
  periodDays: number;
  cycleWord: string;
  nextRenewal: string | null;
  initialAmount: number | null;
};

/** "حوّل على الرقم: 010…" → "010…" (what people actually need to copy). */
const accountOf = (instructions: string) => instructions.split(":").slice(1).join(":").trim() || instructions;

export function TopupStudio({ storeId, balance, price, periodDays, cycleWord, nextRenewal, initialAmount }: Props) {
  const router = useRouter();
  const shortBy = Math.max(0, price - balance);
  const presets = useMemo(() => {
    const list: { egp: number; label: string }[] = [];
    if (price > 0) {
      if (shortBy > 0) list.push({ egp: Math.max(MIN_EGP, Math.ceil(shortBy / 100)), label: tr("يكمّل التجديد الجاي") });
      list.push({ egp: Math.ceil((price * 3) / 100), label: tr("٣ {0}", cycleWord === "سنة" ? tr("سنين") : tr("شهور")) });
      list.push({ egp: Math.ceil((price * 6) / 100), label: tr("٦ {0}", cycleWord === "سنة" ? tr("سنين") : tr("شهور")) });
    }
    for (const egp of [200, 500, 1000]) if (!list.some((p) => p.egp === egp) && list.length < 5) list.push({ egp, label: "" });
    return list;
  }, [price, shortBy, cycleWord]);

  const [amount, setAmount] = useState(String(initialAmount ? Math.max(MIN_EGP, initialAmount) : (presets[0]?.egp ?? 200)));
  const [mode, setMode] = useState<"online" | "manual">("online");
  const [method, setMethod] = useState<TopupMethod>(TOPUP_METHODS[0].value);
  const [transferRef, setTransferRef] = useState("");
  const [receipt, setReceipt] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const egp = Number(amount);
  const piasters = Number.isFinite(egp) ? Math.round(egp * 100) : 0;
  const valid = piasters >= MIN_EGP * 100;
  const after = balance + (valid ? piasters : 0);
  const renewals = price > 0 ? Math.floor(after / price) : 0;
  const coveredUntil = nextRenewal && renewals > 0 ? new Date(new Date(nextRenewal).getTime() + renewals * periodDays * 86400_000) : null;
  const selected = TOPUP_METHODS.find((m) => m.value === method)!;

  async function onReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      setReceipt(await uploadImageToCloudinary(file, "casho/uploads/receipts", 8));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع الصورة"));
    } finally {
      setUploading(false);
    }
  }

  function payOnline() {
    setError(null);
    if (!valid) return setError(tr("أقل مبلغ {0} جنيه.", MIN_EGP));
    startTransition(async () => {
      // Redirects to Kashier on success; only returns on failure.
      const result = await InitiateKashierTopupAction(storeId, piasters);
      if (result && !result.success) setError(result.message);
    });
  }

  function submitManual() {
    setError(null);
    if (!valid) return setError(tr("أقل مبلغ {0} جنيه.", MIN_EGP));
    if (!transferRef.trim() && !receipt) return setError(tr("اكتب رقم العملية أو ارفع صورة الإيصال عشان نلاقي التحويل."));
    startTransition(async () => {
      const result = await CreateTopupRequestAction({ storeId, amount: piasters, method, transferRef, receiptImage: receipt, note });
      if (!result.success) {
        setError(result.message);
        return;
      }
      toast.success(tr("طلبك وصل — هنضيف الرصيد أول ما نتأكد من التحويل"));
      router.push("/balance");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        {/* ── 1. Amount ───────────────────────────────────────── */}
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">{tr("١. المبلغ")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {presets.map((p) => (
              <button
                key={p.egp}
                type="button"
                onClick={() => setAmount(String(p.egp))}
                aria-pressed={egp === p.egp}
                className={cn(
                  "rounded-lg border p-3 text-start transition-colors",
                  egp === p.egp ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                )}
              >
                <span className="block text-base font-semibold tabular-nums">{formatMoney(p.egp * 100)}</span>
                {p.label && <span className="block text-xs text-muted-foreground">{p.label}</span>}
              </button>
            ))}
          </div>
          <div className="flex h-11 items-center rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring/30">
            <input
              type="number"
              inputMode="decimal"
              min={MIN_EGP}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label={tr("مبلغ مخصص")}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none"
            />
            <span className="pe-3 text-sm text-muted-foreground">{tr("جنيه")}</span>
          </div>
        </section>

        {/* ── 2. Method ───────────────────────────────────────── */}
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">{tr("٢. طريقة الدفع")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <ModeCard
              active={mode === "online"}
              onClick={() => setMode("online")}
              icon={Zap}
              title={tr("دفع فوري")}
              hint={tr("كارت أو محفظة — الرصيد بيتضاف في ثانية")}
              badge={tr("الأسرع")}
            />
            <ModeCard
              active={mode === "manual"}
              onClick={() => setMode("manual")}
              icon={Landmark}
              title={tr("تحويل يدوي")}
              hint={tr("فودافون كاش أو إنستاباي أو بنك — بيتراجع يدوي")}
            />
          </div>

          {mode === "online" ? (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <p className="leading-6 text-muted-foreground">
                {tr("هتتحوّل لصفحة الدفع الآمنة (Kashier) — فيزا، ماستركارد، ميزة، أو محفظة إلكترونية. بعد الدفع هترجع هنا والرصيد مضاف.")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {TOPUP_METHODS.map((m) => {
                  const Icon = METHOD_ICONS[m.value] ?? CreditCard;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      aria-pressed={method === m.value}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                        method === m.value ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-foreground/30",
                      )}
                    >
                      <Icon className="size-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/[0.03] p-3">
                <p className="text-xs text-muted-foreground">
                  {tr("حوّل")}{" "}<span className="font-semibold text-foreground">{valid ? formatMoney(piasters) : tr("المبلغ")}</span>{" "}{tr("على {0}:", selected.label)}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-lg font-semibold tracking-wide" dir="ltr">
                    {accountOf(selected.instructions)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => {
                      navigator.clipboard?.writeText(accountOf(selected.instructions).split(" ")[0]).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    {tr("نسخ")}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ref">{tr("رقم العملية")}</Label>
                  <Input id="ref" dir="ltr" value={transferRef} onChange={(e) => setTransferRef(e.target.value)} placeholder={tr("من رسالة التحويل")} />
                </div>
                <div className="space-y-2">
                  <Label>{tr("صورة الإيصال")}</Label>
                  {receipt ? (
                    <div className="flex h-10 items-center gap-2 rounded-md border border-border px-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={receipt} alt="" className="size-7 rounded object-cover" />
                      <span className="flex-1 text-xs text-muted-foreground">{tr("اترفعت")}</span>
                      <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={tr("شيل الإيصال")} onClick={() => setReceipt("")}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/50">
                      {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                      {uploading ? tr("بنرفع…") : tr("ارفع سكرين شوت")}
                      <input type="file" accept="image/*" className="sr-only" onChange={onReceipt} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note" className="text-xs">
                  {tr("ملاحظة")}{" "}<span className="font-normal text-muted-foreground">{tr("(اختياري)")}</span>
                </Label>
                <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="resize-none" />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Summary ─────────────────────────────────────────────── */}
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <section className="rounded-xl border border-border bg-card">
          <dl className="space-y-2.5 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tr("رصيدك دلوقتي")}</dt>
              <dd className="tabular-nums">{formatMoney(balance)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tr("الشحن")}</dt>
              <dd className="tabular-nums text-emerald-700 dark:text-emerald-400">+ {valid ? formatMoney(piasters) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 font-semibold">
              <dt>{tr("الرصيد بعد الشحن")}</dt>
              <dd className="tabular-nums">{formatMoney(after)}</dd>
            </div>
          </dl>
          {price > 0 && (
            <p className="border-t border-border bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
              {renewals > 0 ? (
                <>
                  {tr("يكفي")}{" "}<span className="font-medium text-foreground">{tr("{0} تجديد", nf.format(renewals))}</span>
                  {coveredUntil && <>{" "}{tr("— متجرك شغّال لحد {0}", df.format(coveredUntil))}</>}
                </>
              ) : (
                <>{tr("لسه مش كفاية لتجديد واحد ({0})", formatMoney(price))}</>
              )}
            </p>
          )}
        </section>

        {error && <p className="rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

        <Button className="h-11 w-full gap-1.5" disabled={pending || uploading || !valid} onClick={mode === "online" ? payOnline : submitManual}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "online" ? tr("ادفع {0}", valid ? formatMoney(piasters) : "") : tr("ابعت طلب الشحن")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {mode === "online" ? tr("مش هنحفظ بيانات كارتك — الدفع كله على Kashier.") : tr("هيوصلك إشعار أول ما الرصيد يتضاف.")}
        </p>
      </aside>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  hint,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Zap;
  title: string;
  hint: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("flex gap-3 rounded-lg border p-3 text-start transition-colors", active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30")}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {title}
          {badge && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">{badge}</span>}
        </span>
        <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
