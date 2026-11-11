"use client";

// TEMP: the pricing cards pay straight on Paymob — see lib/payments/plan-checkout.ts.

import Link from "next/link";
import { useId, useState, useTransition, type ComponentProps, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StartPlanCheckoutAction } from "@/actions/plan-checkout.actions";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";

type Cycle = "MONTHLY" | "YEARLY";
type FieldKey = "name" | "phone" | "email";
type ErrorKey = FieldKey | "invalid" | "rate_limited" | "unavailable" | "failed";

const PHONE = /^01[0125]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Arabic-Indic / Persian digits → Latin, and drop spaces/dashes, so "٠١٠ ١٢٣" validates. */
function normalizePhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s-]/g, "")
    .replace(/^(\+?20|0020)(?=1)/, "0");
}

export function PlanCheckoutButton({
  planId,
  planName,
  cycle,
  priceLabel,
  className,
}: {
  planId: string;
  planName: string;
  cycle: Cycle;
  /** Already formatted, e.g. "1,200". */
  priceLabel: string;
  className?: string;
}) {
  const c = useLandingCopy().pricing;
  const t = c.checkout;
  const { lang } = useLang();
  const formId = useId();

  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<Record<FieldKey, string>>({ name: "", phone: "", email: "" });
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  // Stays true after a successful hand-off so the button keeps its spinner until the browser leaves.
  const [leaving, setLeaving] = useState(false);
  const busy = pending || leaving;

  const set = (key: FieldKey) => (value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  function validate(): FieldKey | null {
    if (fields.name.trim().length < 2) return "name";
    if (!PHONE.test(normalizePhone(fields.phone))) return "phone";
    if (!EMAIL.test(fields.email.trim())) return "email";
    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      document.getElementById(`${formId}-${invalid}`)?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await StartPlanCheckoutAction({
        planId,
        cycle,
        name: fields.name.trim(),
        phone: normalizePhone(fields.phone),
        email: fields.email.trim(),
      });
      if (result.success) {
        setLeaving(true);
        window.location.assign(result.url);
      } else {
        setError(result.error);
      }
    });
  }

  const fieldError = error === "name" || error === "phone" || error === "email" ? error : null;
  const formError = error && !fieldError ? error : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          {c.ctaPay}
        </button>
      </DialogTrigger>
      <DialogContent
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="al gap-0 rounded-[28px] bg-(--al-card) p-7 text-(--al-text) ring-(--al-hair) sm:max-w-[440px] sm:p-8"
      >
        <DialogTitle className="pe-8 text-[24px] font-bold leading-tight">
          {t.title.replace("{plan}", planName)}
        </DialogTitle>
        <DialogDescription className="mt-2 text-[15px] leading-relaxed text-(--al-muted)">
          {t.subtitle}
        </DialogDescription>

        <div className="mt-6 flex items-baseline justify-between gap-4 rounded-2xl bg-(--al-surface) px-5 py-4">
          <span className="text-[15px] text-(--al-muted)">
            {planName} · {cycle === "YEARLY" ? t.yearly : t.monthly}
          </span>
          <span className="text-[20px] font-bold tabular-nums">
            {priceLabel} <span className="text-[14px] font-medium text-(--al-muted)">{c.currency}</span>
          </span>
        </div>

        <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field
            id={`${formId}-name`}
            label={t.name}
            value={fields.name}
            onChange={set("name")}
            error={fieldError === "name" ? t.errors.name : null}
            autoComplete="name"
            maxLength={80}
          />
          <Field
            id={`${formId}-phone`}
            label={t.phone}
            value={fields.phone}
            onChange={set("phone")}
            error={fieldError === "phone" ? t.errors.phone : null}
            autoComplete="tel"
            inputMode="tel"
            type="tel"
            dir="ltr"
            placeholder="01012345678"
            maxLength={20}
          />
          <Field
            id={`${formId}-email`}
            label={t.email}
            value={fields.email}
            onChange={set("email")}
            error={fieldError === "email" ? t.errors.email : null}
            autoComplete="email"
            inputMode="email"
            type="email"
            dir="ltr"
            placeholder="you@example.com"
            maxLength={120}
          />

          {formError ? (
            <p role="alert" className="rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[14px] text-[#d70015] dark:text-[#ff6961]">
              {t.errors[formError]}
            </p>
          ) : null}

          <button type="submit" disabled={busy} aria-busy={busy} className="al-btn al-btn-filled mt-2 w-full disabled:opacity-70">
            {busy ? (
              <>
                <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {t.redirecting}
              </>
            ) : (
              t.pay.replace("{amount}", priceLabel)
            )}
          </button>
        </form>

        <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-(--al-muted)">
          <Lock className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
          <span>{t.secure}</span>
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-(--al-faint)">
          {t.consent}{" "}
          <Link href="/terms" target="_blank" className="text-(--al-link) underline-offset-2 hover:underline">
            {t.terms}
          </Link>{" "}
          {t.and}
          <Link href="/refund-policy" target="_blank" className="text-(--al-link) underline-offset-2 hover:underline">
            {t.refund}
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  ...input
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
} & Omit<ComponentProps<"input">, "id" | "value" | "onChange">) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-semibold">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        required
        className={cn(
          "h-12 w-full rounded-xl border bg-(--al-bg) px-4 text-[17px] text-(--al-text) outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-(--al-faint) focus:border-(--al-tint) focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--al-tint)_18%,transparent)]",
          error ? "border-[#d70015] dark:border-[#ff6961]" : "border-(--al-hair)",
        )}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-[#d70015] dark:text-[#ff6961]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
