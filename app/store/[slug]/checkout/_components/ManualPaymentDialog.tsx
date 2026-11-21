"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AlertCircle, Check, Copy, ImageUp, Loader2, RefreshCw, ShieldCheck, X } from "lucide-react";

import { getPaymentMethodByKey } from "@/constants/payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressImage } from "@/lib/image-compress";
import { PROOF_MAX_BYTES, normalizePayer } from "@/lib/payments/manual-proof";
import { cn } from "@/lib/utils";
import { formatPrice, st } from "@/lib/i18n/storefront";

/** What the shopper sent — either can be missing when the merchant made it optional. */
export type PaymentProof = { payer: string; image: File | null };

/** "Paid from" asks for what the shopper can see in their own app for that method. */
function payerField(method: string): { label: string; placeholder: string; inputMode: "tel" | "email" | "text" } {
  switch (method) {
    case "vodafone_cash":
    case "stc_pay":
      return { label: st("رقم المحفظة اللي حوّلت منه"), placeholder: st("مثال: 01012345678"), inputMode: "tel" };
    case "instapay":
      return { label: st("رقمك أو عنوان InstaPay اللي حوّلت منه"), placeholder: st("مثال: 01012345678 أو name@instapay"), inputMode: "text" };
    case "bank_transfer":
    case "saudi_bank_transfer":
      return { label: st("رقم الحساب أو اسم صاحبه اللي حوّلت منه"), placeholder: st("مثال: محمد أحمد — 1234"), inputMode: "text" };
    case "paypal":
      return { label: st("إيميل PayPal اللي دفعت منه"), placeholder: "name@example.com", inputMode: "email" };
    case "fawry":
      return { label: st("رقم الموبايل أو رقم العملية في فوري"), placeholder: st("مثال: 01012345678"), inputMode: "text" };
    default:
      return { label: st("الرقم أو الحساب اللي حوّلت منه"), placeholder: st("مثال: 01012345678"), inputMode: "text" };
  }
}

function Step({ n, title, done, optional = false, children }: { n: number; title: string; done: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2.5 text-[15px] font-semibold">
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
            done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
        </span>
        {title}
        {optional && <span className="font-normal text-muted-foreground">{st("(اختياري)")}</span>}
      </h3>
      {children}
    </section>
  );
}

/**
 * Manual transfer, before the order exists: shows the amount and where to send
 * it, then asks what the shopper paid from and for a screenshot — each required
 * or optional as the merchant set it. "Confirm payment" hands them back to the
 * checkout form, which places the order.
 *
 * Rendered inside the store root (`container`) so it keeps the theme's colors,
 * font and direction. Keyed by method in CheckoutForm: another method is
 * another transfer, so it starts over.
 */
export function ManualPaymentDialog({
  open,
  onOpenChange,
  container,
  method,
  methodLabel,
  transferTo,
  total,
  requirePayer,
  requireScreenshot,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement | null;
  method: string;
  methodLabel: string;
  transferTo: string;
  /** EGP, as the cart summary shows it. */
  total: number;
  /** The merchant's rules (StorePaymentSettings) — the other piece is optional. */
  requirePayer: boolean;
  requireScreenshot: boolean;
  pending: boolean;
  error: string | null;
  onConfirm: (proof: PaymentProof) => void;
}) {
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [payer, setPayer] = useState("");
  // The screenshot and its local preview URL, created together and revoked when replaced.
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const shotUrl = useRef<string | null>(null);
  const image = shot?.file ?? null;
  const preview = shot?.url ?? null;
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const field = payerField(method);
  const logo = getPaymentMethodByKey(method)?.logo;
  const payerGiven = normalizePayer(payer) !== null;
  const payerOk = payerGiven || !requirePayer;
  const imageOk = !!image || !requireScreenshot;
  const intro =
    requirePayer && requireScreenshot
      ? st("حوّل المبلغ، وبعدها ابعتلنا الرقم اللي حوّلت منه وصورة التحويل.")
      : requirePayer
        ? st("حوّل المبلغ، وبعدها اكتب الرقم اللي حوّلت منه.")
        : requireScreenshot
          ? st("حوّل المبلغ، وبعدها ارفع صورة التحويل.")
          : st("حوّل المبلغ وأكّد الدفع.");
  const shortDetail = !transferTo.includes("\n") && transferTo.length <= 40;

  useEffect(
    () => () => {
      if (shotUrl.current) URL.revokeObjectURL(shotUrl.current);
    },
    [],
  );

  function keepShot(file: File) {
    if (shotUrl.current) URL.revokeObjectURL(shotUrl.current);
    const url = URL.createObjectURL(file);
    shotUrl.current = url;
    setShot({ file, url });
  }

  async function copyDetail() {
    try {
      await navigator.clipboard.writeText(transferTo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the text is selectable anyway.
    }
  }

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    if (file.type && !file.type.startsWith("image/")) {
      setFileError(st("الملف ده مش صورة. ارفع سكرين شوت للتحويل."));
      return;
    }
    setReading(true);
    try {
      // Server action bodies stop at 1 MB: shrink the screenshot on the phone first.
      const small = await compressImage(file, { maxBytes: PROOF_MAX_BYTES - 64 * 1024, maxSide: 2200 });
      if (small.size > PROOF_MAX_BYTES || !small.type.startsWith("image/")) throw new Error("too big");
      keepShot(small);
    } catch {
      setFileError(st("مقدرناش نقرأ الصورة دي. جرّب سكرين شوت JPG أو PNG."));
    } finally {
      setReading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function confirm() {
    setTriedSubmit(true);
    if (!payerOk || !imageOk || pending || reading) return;
    onConfirm({ payer: payer.trim(), image });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          onInteractOutside={(e) => pending && e.preventDefault()}
          className={cn(
            "fixed z-[100] flex max-h-[92dvh] flex-col overflow-hidden bg-background text-foreground shadow-2xl outline-none",
            // Phones: a sheet from the bottom (the shopper is in their wallet app and back).
            "inset-x-0 bottom-0 rounded-t-3xl",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-6 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            // Larger screens: a centered card.
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          )}
        >
          <div className="flex items-start gap-3 border-b px-5 pt-5 pb-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-white p-1.5">
              {logo ? <Image src={logo} alt="" width={36} height={36} className="max-h-8 w-auto object-contain" /> : <ShieldCheck className="size-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5 text-start">
              <DialogPrimitive.Title className="text-lg font-semibold leading-7">{st("ادفع عن طريق {0}", methodLabel)}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
                {intro}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              disabled={pending}
              className="-me-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label={st("إغلاق")}
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
            <Step n={1} title={st("حوّل المبلغ")} done={payerGiven || !!image}>
              <div className="overflow-hidden rounded-2xl border">
                <div className="flex items-baseline justify-between gap-3 bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{st("المبلغ المطلوب")}</span>
                  <span className="text-xl font-bold tabular-nums">{formatPrice(total)}</span>
                </div>
                <div className="space-y-2 px-4 py-3">
                  <p className="text-sm text-muted-foreground">{st("على")}</p>
                  <div className="flex items-start justify-between gap-3">
                    {shortDetail ? (
                      <p dir="ltr" className="min-w-0 select-all break-all text-lg font-semibold tracking-wide">
                        {transferTo}
                      </p>
                    ) : (
                      <p className="min-w-0 select-all whitespace-pre-wrap break-words text-sm leading-7">{transferTo}</p>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={copyDetail} className="shrink-0 rounded-full">
                      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                      {copied ? st("اتنسخ") : st("نسخ")}
                    </Button>
                  </div>
                </div>
              </div>
            </Step>

            <Step n={2} title={field.label} done={payerGiven} optional={!requirePayer}>
              <Input
                id={`${ids}-payer`}
                aria-label={field.label}
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                inputMode={field.inputMode}
                autoComplete={field.inputMode === "email" ? "email" : field.inputMode === "tel" ? "tel" : "off"}
                placeholder={field.placeholder}
                maxLength={80}
                aria-invalid={triedSubmit && !payerOk}
                className="h-12 rounded-xl text-start"
              />
              {triedSubmit && !payerOk && <p className="text-xs text-destructive">{st("اكتب الرقم أو الحساب اللي حوّلت منه.")}</p>}
            </Step>

            <Step n={3} title={st("صورة التحويل")} done={!!image} optional={!requireScreenshot}>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {image && preview ? (
                <div className="flex items-center gap-3 rounded-2xl border p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview */}
                  <img src={preview} alt={st("صورة التحويل")} className="h-20 w-16 shrink-0 rounded-lg border object-cover" />
                  <div className="min-w-0 flex-1 space-y-1 text-start">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Check className="size-4 text-primary" />
                      {st("الصورة جاهزة")}
                    </p>
                    <p className="text-xs text-muted-foreground">{st("اتأكد إن المبلغ والتاريخ باينين فيها.")}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" disabled={pending || reading} onClick={() => fileInput.current?.click()} className="shrink-0 rounded-full">
                    <RefreshCw className="size-4" />
                    {st("تغيير")}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={reading}
                  onClick={() => fileInput.current?.click()}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
                    triedSubmit && !imageOk ? "border-destructive/60" : "border-border",
                  )}
                >
                  {reading ? <Loader2 className="size-6 animate-spin text-primary" /> : <ImageUp className="size-6 text-primary" />}
                  <span className="text-sm font-medium">{reading ? st("بنجهّز الصورة...") : st("ارفع سكرين شوت التحويل")}</span>
                  <span className="text-xs text-muted-foreground">{st("صورة من تطبيق المحفظة أو البنك فيها المبلغ")}</span>
                </button>
              )}
              {fileError ? (
                <p className="text-xs text-destructive">{fileError}</p>
              ) : (
                triedSubmit && !imageOk && <p className="text-xs text-destructive">{st("ارفع صورة التحويل عشان نأكد طلبك.")}</p>
              )}
            </Step>
          </div>

          <div className="space-y-3 border-t px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm leading-6 text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
            <Button type="button" size="lg" onClick={confirm} disabled={pending || reading} className="h-12 w-full rounded-xl text-base font-semibold">
              {pending ? (
                <>
                  {st("جاري تأكيد الدفع...")}
                  <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                st("تأكيد الدفع")
              )}
            </Button>
            <p className="text-center text-xs leading-5 text-muted-foreground">{st("المتجر هيراجع التحويل ويأكد طلبك.")}</p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
