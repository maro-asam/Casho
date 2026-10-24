"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, CreditCard, ImagePlus, Landmark, Loader2, Smartphone, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import type { TopupMethod } from "@prisma/client";

import { CreateTopupRequestAction, InitiatePaymobTopupAction } from "@/actions/balance/topup.actions";
import { PaymobCoverage, PaymobMark } from "@/components/payments/PaymobCoverage";
import { Card, Row, Rows, SegmentedButtons, appleButton } from "@/components/saas-page";
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
  /** Casho's Paymob account is configured. */
  onlineAvailable: boolean;
};

/** "حوّل على الرقم: 010…" → "010…" (what people actually need to copy). */
const accountOf = (instructions: string) => instructions.split(":").slice(1).join(":").trim() || instructions;

export function TopupStudio({ storeId, balance, price, periodDays, cycleWord, nextRenewal, initialAmount, onlineAvailable }: Props) {
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
  const [mode, setMode] = useState<"online" | "manual">(onlineAvailable ? "online" : "manual");
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
      // Redirects to Paymob on success; only returns on failure.
      const result = await InitiatePaymobTopupAction(storeId, piasters);
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

  const tileOn = "bg-primary/10 ring-2 ring-primary";
  const tileOff = "bg-(--fill-3) hover:bg-(--fill-3)/70";

  return (
    <div className="apple-form grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        {/* ── 1. Amount ───────────────────────────────────────── */}
        <Card title={tr("المبلغ")}>
          <div className="space-y-3 px-5 pb-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {presets.map((p) => (
                <button
                  key={p.egp}
                  type="button"
                  onClick={() => setAmount(String(p.egp))}
                  aria-pressed={egp === p.egp}
                  className={cn(TILE, egp === p.egp ? tileOn : tileOff)}
                >
                  <span className="block text-[17px] font-semibold tabular-nums">{formatMoney(p.egp * 100)}</span>
                  <span className="block text-[13px] text-muted-foreground">{p.label || "\u00a0"}</span>
                </button>
              ))}
            </div>
            <div className="apple-field flex h-14 items-center">
              <input
                type="number"
                inputMode="decimal"
                min={MIN_EGP}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label={tr("مبلغ مخصص")}
                className="h-full min-w-0 flex-1 bg-transparent px-4 text-[22px] font-semibold tabular-nums outline-none"
              />
              <span className="pe-4 text-[15px] text-muted-foreground">{tr("جنيه")}</span>
            </div>
          </div>
        </Card>

        {/* ── 2. Method ───────────────────────────────────────── */}
        <Card
          title={tr("طريقة الدفع")}
          action={
            <SegmentedButtons
              label={tr("طريقة الدفع")}
              value={mode}
              onChange={setMode}
              role="tablist"
              options={[
                ["online", tr("كارت أو محفظة")],
                ["manual", tr("تحويل يدوي")],
              ]}
            />
          }
        >
          {mode === "online" ? (
            onlineAvailable ? (
              <div className="space-y-4 px-5 pb-5">
                <div className="flex items-center gap-3">
                  <PaymobMark />
                  <p className="text-[15px] leading-6 text-muted-foreground">
                    {tr("هتدفع على صفحة Paymob الآمنة وترجع هنا والرصيد مضاف على طول.")}
                  </p>
                </div>
                <PaymobCoverage className="rounded-[14px] bg-(--fill-3)/50 p-4" />
                <p className="text-[13px] leading-5 text-muted-foreground">
                  {tr("عايز تدفع بـ InstaPay؟ اختار")}{" "}
                  <button type="button" onClick={() => { setMode("manual"); setMethod("INSTAPAY"); }} className="font-semibold text-primary hover:underline">
                    {tr("تحويل يدوي ← إنستاباي")}
                  </button>
                </p>
              </div>
            ) : (
              <p className="px-5 pb-5 text-[15px] leading-6 text-muted-foreground">
                {tr("الدفع الأونلاين مش متاح دلوقتي — حوّل يدوي بفودافون كاش أو InstaPay أو تحويل بنكي وهنضيف الرصيد بعد المراجعة.")}
              </p>
            )
          ) : (
            <div className="space-y-5 px-5 pb-5">
              <div className="grid gap-2 sm:grid-cols-3">
                {TOPUP_METHODS.map((m) => {
                  const Icon = METHOD_ICONS[m.value] ?? CreditCard;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      aria-pressed={method === m.value}
                      className={cn(TILE, "flex items-center gap-2.5 text-[15px]", method === m.value ? cn(tileOn, "font-semibold") : tileOff)}
                    >
                      <Icon className="size-[18px] text-primary" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[14px] bg-primary/6 p-4">
                <p className="text-[13px] text-muted-foreground">
                  {tr("حوّل")}{" "}<span className="font-semibold text-foreground">{valid ? formatMoney(piasters) : tr("المبلغ")}</span>{" "}{tr("على {0}:", selected.label)}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="font-mono text-[20px] font-semibold tracking-wide" dir="ltr">
                    {accountOf(selected.instructions)}
                  </p>
                  <button
                    type="button"
                    className={appleButton.tinted}
                    onClick={() => {
                      navigator.clipboard?.writeText(accountOf(selected.instructions).split(" ")[0]).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="size-4 text-(--sys-green)" /> : <Copy className="size-4" />}
                    {tr("نسخ")}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ref" className="text-[13px] font-normal text-muted-foreground">
                    {tr("رقم العملية")}
                  </Label>
                  <Input id="ref" dir="ltr" value={transferRef} onChange={(e) => setTransferRef(e.target.value)} placeholder={tr("من رسالة التحويل")} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-normal text-muted-foreground">{tr("صورة الإيصال")}</Label>
                  {receipt ? (
                    <div className="apple-field flex h-11 items-center gap-2 px-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={receipt} alt="" className="size-8 rounded-md object-cover" />
                      <span className="flex-1 text-[13px] text-muted-foreground">{tr("اترفعت")}</span>
                      <button
                        type="button"
                        aria-label={tr("شيل الإيصال")}
                        onClick={() => setReceipt("")}
                        className="apple-press grid size-7 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="apple-field apple-press flex h-11 cursor-pointer items-center justify-center gap-2 text-[15px] text-primary">
                      {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                      {uploading ? tr("بنرفع…") : tr("ارفع سكرين شوت")}
                      <input type="file" accept="image/*" className="sr-only" onChange={onReceipt} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note" className="text-[13px] font-normal text-muted-foreground">
                  {tr("ملاحظة")}{" "}{tr("(اختياري)")}
                </Label>
                <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="resize-none" />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Summary ─────────────────────────────────────────────── */}
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <Card title={tr("الملخص")}>
          <Rows className="pb-0">
            <Row label={tr("رصيدك دلوقتي")}>
              <span className="tabular-nums">{formatMoney(balance)}</span>
            </Row>
            <Row label={tr("الشحن")}>
              <span className="text-(--sys-green) tabular-nums">+ {valid ? formatMoney(piasters) : "—"}</span>
            </Row>
            <div className="flex min-h-11 items-center justify-between gap-4 px-5 py-3 text-[15px] font-semibold">
              <dt>{tr("الرصيد بعد الشحن")}</dt>
              <dd className="text-[17px] tabular-nums">{formatMoney(after)}</dd>
            </div>
          </Rows>
          {price > 0 && (
            <p className="border-t-[0.5px] border-border px-5 py-3.5 text-[13px] leading-5 text-muted-foreground">
              {renewals > 0 ? (
                <>
                  {tr("يكفي")}{" "}<span className="font-semibold text-foreground">{tr("{0} تجديد", nf.format(renewals))}</span>
                  {coveredUntil && <>{" "}{tr("— متجرك شغّال لحد {0}", df.format(coveredUntil))}</>}
                </>
              ) : (
                <>{tr("لسه مش كفاية لتجديد واحد ({0})", formatMoney(price))}</>
              )}
            </p>
          )}
        </Card>

        {error && (
          <p role="alert" className="rounded-[14px] bg-(--sys-red)/10 px-4 py-3 text-[15px] text-(--sys-red)">
            {error}
          </p>
        )}

        <button
          type="button"
          className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}
          disabled={pending || uploading || !valid || (mode === "online" && !onlineAvailable)}
          onClick={mode === "online" ? payOnline : submitManual}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "online" ? tr("ادفع {0}", valid ? formatMoney(piasters) : "") : tr("ابعت طلب الشحن")}
        </button>
        <p className="px-4 text-center text-[13px] text-muted-foreground">
          {mode === "online" ? tr("مش هنحفظ بيانات كارتك أو محفظتك — الدفع كله على Paymob.") : tr("هيوصلك إشعار أول ما الرصيد يتضاف.")}
        </p>
      </aside>
    </div>
  );
}

const TILE = "apple-press rounded-[14px] p-3.5 text-start ring-inset transition-[background-color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
