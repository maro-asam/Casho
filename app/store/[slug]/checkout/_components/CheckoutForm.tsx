"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SaveCheckoutContactAction } from "@/actions/store/cart-recovery.actions";
import { EGYPT_GOVERNORATES } from "@/constants/egypt-governorates";
import { selectGovernorateAction } from "../../cart/actions";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  MapPinHouse,
  Phone,
  UserRound,
  Wallet,
} from "lucide-react";

import {
  getPaymentMethodByKey,
  isManualPaymentMethod,
} from "@/constants/payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CheckoutLegal, CheckoutPaymentMethod, CheckoutResult } from "../../_themes/types";
import { st, storeDir, storeLocale, stv } from "@/lib/i18n/storefront";
import { clearCheckoutDrafts, readCheckoutDraft, writeCheckoutDraft } from "./checkout-draft";
import { ManualPaymentDialog, type PaymentProof } from "./ManualPaymentDialog";

/** Fields kept on the device while the shopper is away transferring (checkout-draft). */
const DRAFT_FIELDS = ["fullName", "phone", "email", "governorate", "address"] as const;

/** What each method means for the shopper (the shared catalog describes it for the merchant). */
function shopperDescription(key: string): string | null {
  switch (key) {
    case "cash_on_delivery":
      return st("ادفع كاش للمندوب لما الطلب يوصلك.");
    case "vodafone_cash":
      return st("حوّل من محفظتك (فودافون كاش أو أي محفظة) على رقم المتجر.");
    case "instapay":
      return st("حوّل من تطبيق InstaPay على حساب المتجر.");
    case "bank_transfer":
    case "saudi_bank_transfer":
      return st("حوّل على حساب المتجر في البنك.");
    case "fawry":
      return st("ادفع في أي منفذ فوري وابعت رقم العملية.");
    case "paypal":
      return st("ادفع من حساب PayPal بتاعك.");
    case "stc_pay":
      return st("حوّل من STC Pay على رقم المتجر.");
    case "paymob":
      return st("ادفع أونلاين بالكارت أو المحفظة دلوقتي.");
    default:
      return null;
  }
}

/** A failure the router handles itself (the redirect to the order page), not a broken request. */
function isNavigation(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"));
}

const NO_LEGAL: CheckoutLegal = { requireConsent: false, links: [] };

/** "الشروط والأحكام" و"سياسة الاسترجاع" — each opens in a new tab so the form keeps what was typed. */
function LegalLinks({ links }: { links: CheckoutLegal["links"] }) {
  return links.map((link, i) => (
    <span key={link.href} className="font-light">
      {i > 0 && st(" و")}
      <a
        href={link.href}
        target="_blank"
        rel="noopener"
        className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
      >
        {link.label}
      </a>
    </span>
  ));
}

/**
 * Before the order button: a required "I agree" box when the merchant asks
 * for consent, otherwise a short line that ordering means agreeing.
 */
function LegalConsent({ legal }: { legal: CheckoutLegal }) {
  if (legal.links.length === 0) return null;

  if (!legal.requireConsent) {
    return (
      <p className="text-center text-xs leading-6 text-muted-foreground">
        {st("بتأكيدك للطلب، أنت موافق على")}{" "}<LegalLinks links={legal.links} />.
      </p>
    );
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-background p-4 text-start">
      <input
        type="checkbox"
        name="acceptTerms"
        required
        onInvalid={(e) => e.currentTarget.setCustomValidity(st("لازم توافق على الشروط عشان تكمّل الطلب"))}
        onChange={(e) => e.currentTarget.setCustomValidity("")}
        className="mt-1 size-[1.125rem] shrink-0 accent-primary"
      />
      <span className="text-sm leading-6">
        {st("قرأت وأوافق على")}{" "}<LegalLinks links={legal.links} />
      </span>
    </label>
  );
}

function SubmitButton({ pending, toPayment }: { pending: boolean; toPayment: boolean }) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-12 w-full rounded-xl text-base font-semibold"
    >
      {pending ? (
        <>
          {st("جاري تأكيد الطلب...")}
          <Loader2 className="size-4 animate-spin" />
        </>
      ) : toPayment ? (
        st("كمّل للدفع")
      ) : (
        st("تأكيد الطلب الآن")
      )}
    </Button>
  );
}

function PaymentMethodLogo({
  methodKey,
  label,
  isActive,
}: {
  methodKey: string;
  label: string;
  isActive: boolean;
}) {
  const config = getPaymentMethodByKey(methodKey);

  return (
    <div
      className={cn(
        "flex size-16 shrink-0 items-center justify-center rounded-2xl border bg-white p-2",
        isActive ? "border-primary" : "border-border",
      )}
    >
      {config?.logo ? (
        <Image
          src={config.logo}
          alt={label}
          width={56}
          height={56}
          className="max-h-12 w-auto object-contain"
        />
      ) : (
        <CreditCard className="size-6 text-muted-foreground" />
      )}
    </div>
  );
}

export default function CheckoutForm({
  paymentMethods,
  action,
  storeSlug,
  defaultGovernorate,
  digitalOnly = false,
  legal = NO_LEGAL,
  total,
}: {
  paymentMethods: CheckoutPaymentMethod[];
  /** Places the order and redirects; answers `{ error }` when it can't. */
  action: (formData: FormData) => Promise<CheckoutResult>;
  /** What the shopper pays, in EGP (the cart summary's total) — shown in the transfer window. */
  total: number;
  /** Terms / return policy consent (CheckoutViewProps.legal). */
  legal?: CheckoutLegal;
  storeSlug: string;
  /** Last governorate picked (cart summary already prices shipping for it). */
  defaultGovernorate?: string | null;
  /** Every item is digital: nothing ships, so no governorate or address. */
  digitalOnly?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastSaved = useRef("");
  const router = useRouter();
  const [isPricingShipping, startPricing] = useTransition();

  // Shipping can cost differently per governorate: remember the pick and
  // re-render the server summary so the shopper sees the real total.
  function onGovernorateChange(code: string) {
    startPricing(async () => {
      try {
        await selectGovernorateAction(storeSlug, code);
        router.refresh();
      } catch {
        // A dropped request must not break the page: the order prices shipping again anyway.
      }
    });
  }

  // Keep what the customer typed so an unfinished checkout can be followed up
  // from "abandoned carts". Fire-and-forget; never blocks the form.
  function captureContact() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const payload = {
      fullName: String(data.get("fullName") ?? ""),
      phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""),
    };
    const key = JSON.stringify(payload);
    if (key === lastSaved.current || (!payload.phone.trim() && !payload.fullName.trim())) return;
    lastSaved.current = key;
    SaveCheckoutContactAction(storeSlug, payload).catch(() => {});
  }

  const defaultPaymentMethod = useMemo(() => {
    // The merchant orders the methods; the first one is the preselected default.
    return paymentMethods[0]?.key || "cash_on_delivery";
  }, [paymentMethods]);

  const [paymentMethod, setPaymentMethod] =
    useState<string>(defaultPaymentMethod);

  // Placing the order: a manual transfer opens the payment window first; the
  // order is created only from its "confirm payment", with the proof attached.
  const selected = paymentMethods.find((method) => method.key === paymentMethod);
  const transferTo = selected?.transferTo ?? null;
  const [isPlacing, startPlacing] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const pending = isPlacing || redirecting;

  function place(proof?: PaymentProof) {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    if (proof?.payer) data.set("paymentPayer", proof.payer);
    if (proof?.image) data.set("paymentProof", proof.image, proof.image.name);
    setError(null);
    startPlacing(async () => {
      try {
        const result = await action(data);
        // No answer = the action redirected: keep the spinner until the order page opens.
        if (result?.error) setError(stv(result.error));
        else {
          clearCheckoutDrafts(storeSlug);
          setRedirecting(true);
        }
      } catch (err) {
        if (isNavigation(err)) {
          clearCheckoutDrafts(storeSlug);
          throw err;
        }
        // The request never came back (weak mobile data while the screenshot uploads,
        // a server hiccup): keep everything and let them press again. If the order
        // did go through, the retry opens it instead of placing a second one.
        setError(st("الاتصال اتقطع قبل ما نتأكد إن طلبك وصل. اتأكد من النت ودوس تاني — لو الطلب كان وصل هنفتحلك صفحته، ومش هيتكرر."));
      }
    });
  }

  // Keep what's typed on the device, and bring it back after a reload (the
  // shopper went to their wallet app to transfer and the phone reloaded the page).
  function saveDraft(paying = payOpen, method = paymentMethod) {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const fields: Record<string, string> = {};
    for (const name of DRAFT_FIELDS) {
      const value = data.get(name);
      if (typeof value === "string" && value) fields[name] = value;
    }
    writeCheckoutDraft(storeSlug, { fields, paymentMethod: method, paying });
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const form = formRef.current;
      const draft = readCheckoutDraft(storeSlug);
      if (!form || !draft) return;
      for (const name of DRAFT_FIELDS) {
        const saved = draft.fields?.[name];
        const el = form.elements.namedItem(name);
        if (!saved || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) || el.value) continue;
        el.value = saved;
        if (name === "governorate") onGovernorateChange(saved);
      }
      const method = paymentMethods.find((m) => m.key === draft.paymentMethod);
      if (method) setPaymentMethod(method.key);
      // Back from the wallet app: reopen the transfer window where they left it.
      if (draft.paying && method?.transferTo && form.checkValidity()) {
        setPortalRoot(form.closest<HTMLElement>(".store-theme-root"));
        setPayOpen(true);
      }
    });
    return () => cancelAnimationFrame(frame);
    // Once, on mount: restoring later would overwrite what the shopper types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // the browser already checked the required fields
    if (pending) return;
    if (transferTo) {
      setError(null);
      setPortalRoot(formRef.current?.closest<HTMLElement>(".store-theme-root") ?? null);
      setPayOpen(true);
      saveDraft(true);
      return;
    }
    place();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onBlur={captureContact} onChange={() => saveDraft()} className="space-y-6" dir="rtl">
      <div className="space-y-2 text-start">
        <h2 className="text-2xl font-semibold">{st("بيانات الطلب")}</h2>

        <p className="text-sm leading-6 text-muted-foreground">
          {digitalOnly
            ? st("طلبك كله منتجات رقمية — مفيش شحن. هتلاقي روابط التحميل في صفحة الطلب أول ما الدفع يتأكد.")
            : st("املأ البيانات التالية بدقة عشان نقدر نأكد الطلب ونسلمه بدون أي تأخير.")}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">
            {st("الاسم بالكامل")}
          </Label>

          <div className="relative">
            <UserRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="fullName"
              name="fullName"
              placeholder={st("مثال: محمد أحمد علي")}
              required
              className="h-12 rounded-xl ps-10 text-start"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            {st("رقم الموبايل")}
          </Label>

          <div className="relative">
            <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              onChange={(e) => {
                if (e.target.value.replace(/\D/g, "").length >= 11) captureContact();
              }}
              placeholder={st("مثال: 01012345678")}
              required
              className="h-12 rounded-xl ps-10 text-start"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {st("الإيميل")}{" "}<span className="font-normal text-muted-foreground">{st("(اختياري)")}</span>
          </Label>

          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              placeholder="name@example.com"
              className={cn("h-12 rounded-xl", storeDir() === "rtl" ? "pr-10 text-right placeholder:text-right" : "pl-10 text-left")}
            />
          </div>

          <p className="text-xs text-muted-foreground">{st("هيوصلك عليه تأكيد الطلب وتحديثات الشحن.")}</p>
        </div>

        {!digitalOnly && (
        <>
        <div className="space-y-2">
          <Label htmlFor="governorate" className="text-sm font-medium">
            {st("المحافظة")}
          </Label>

          <div className="relative">
            <MapPin className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <select
              id="governorate"
              name="governorate"
              required
              defaultValue={defaultGovernorate ?? ""}
              onChange={(e) => onGovernorateChange(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-input bg-transparent ps-10 pe-10 text-start text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                {st("اختر المحافظة")}
              </option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g.code} value={g.code}>
                  {storeLocale() === "en" ? g.nameEn : g.name}
                </option>
              ))}
            </select>

            {isPricingShipping && (
              <Loader2 className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            {st("العنوان بالكامل")}
          </Label>

          <div className="relative">
            <MapPinHouse className="pointer-events-none absolute start-3 top-4 size-4 text-muted-foreground" />

            <Textarea
              id="address"
              name="address"
              placeholder={st("المنطقة - الشارع - رقم العمارة - الدور - الشقة - علامة مميزة")}
              rows={5}
              required
              className="rounded-xl ps-10 text-start leading-7"
            />
          </div>
        </div>
        </>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          <Label className="text-sm font-medium">{st("طريقة الدفع")}</Label>
        </div>

        <input type="hidden" name="paymentMethod" value={paymentMethod} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const isActive = paymentMethod === method.key;
            const config = getPaymentMethodByKey(method.key);
            const manual = isManualPaymentMethod(method.key);

            return (
              <button
                key={method.key}
                type="button"
                onClick={() => {
                  setPaymentMethod(method.key);
                  saveDraft(false, method.key);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-start transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background",
                )}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <PaymentMethodLogo
                    methodKey={method.key}
                    label={method.label}
                    isActive={isActive}
                  />

                  <div className="min-w-0 space-y-1 text-start">
                    <p className="font-semibold">
                      {config?.label ?? method.label}
                    </p>

                    <p className="text-xs leading-5 text-muted-foreground">
                      {shopperDescription(method.key) ??
                        config?.description ??
                        st("اختر الوسيلة المناسبة لإتمام الطلب")}
                    </p>

                    {method.transferTo ? (
                      <p className="text-xs font-medium text-primary">
                        {st("هتحوّل المبلغ وترفع صورة التحويل قبل تأكيد الطلب")}
                      </p>
                    ) : manual ? (
                      <p className="text-xs font-medium text-primary">
                        {st("سيتم عرض بيانات التحويل بعد تأكيد الطلب")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30",
                  )}
                >
                  {isActive ? <CheckCircle2 className="size-4" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CheckCircle2 className="size-4" />
          </div>

          <div className="space-y-1 text-start">
            <p className="font-medium">{st("راجع بياناتك قبل التأكيد")}</p>

            <p className="text-sm leading-6 text-muted-foreground">
              {digitalOnly
                ? st("تأكد إن الاسم ورقم الموبايل صح عشان نقدر نتواصل معاك لو احتجنا.")
                : st("تأكد إن الاسم، رقم الموبايل، والعنوان مكتوبين بشكل صحيح لتجنب أي تأخير في التواصل أو الشحن.")}
            </p>
          </div>
        </div>
      </div>

      <LegalConsent legal={legal} />

      {error && !payOpen && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm leading-6 text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <SubmitButton pending={pending && !payOpen} toPayment={!!transferTo} />

      {transferTo && selected && (
        <ManualPaymentDialog
          key={selected.key}
          open={payOpen}
          onOpenChange={(open) => {
            setPayOpen(open);
            saveDraft(open);
          }}
          storeSlug={storeSlug}
          container={portalRoot}
          method={selected.key}
          methodLabel={getPaymentMethodByKey(selected.key)?.label ?? selected.label}
          transferTo={transferTo}
          total={total}
          requirePayer={selected.proof?.payer ?? true}
          requireScreenshot={selected.proof?.screenshot ?? true}
          pending={pending}
          error={payOpen ? error : null}
          onConfirm={(proof) => place(proof)}
        />
      )}
    </form>
  );
}
