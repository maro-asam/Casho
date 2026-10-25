"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, MailCheck } from "lucide-react";

import {
  ChangeSignupEmailAction,
  ResendEmailCodeAction,
  VerifyEmailCodeAction,
  type SendCodeState,
  type VerifyEmailState,
} from "@/actions/auth/email-verification.actions";
import { LogoutAction } from "@/actions/auth/logout.actions";
import { CODE_LENGTH, normalizeCode } from "@/lib/auth/verification-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FIELD_CLASS, FormField, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "../../_components/forms/form-field";

type Props = {
  maskedEmail: string;
  /** False when no usable code exists yet — one is sent as the page opens. */
  hasActiveCode: boolean;
  initialRetryIn: number;
  nextPath: string;
  /** Older accounts may leave and confirm later; new signups can only sign out. */
  canSkip: boolean;
};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function VerifyEmailForm({ maskedEmail, hasActiveCode, initialRetryIn, nextPath, canSkip }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSent = useRef(false);

  const [email, setEmail] = useState(maskedEmail);
  const [mode, setMode] = useState<"code" | "email">("code");
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [retryIn, setRetryIn] = useState(initialRetryIn);
  const [status, setStatus] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [sending, startSending] = useTransition();

  const [verifyState, verifyAction, verifying] = useActionState(async (prev: VerifyEmailState | null, formData: FormData) => {
    const result = await VerifyEmailCodeAction(prev, formData);
    if (result.success) {
      window.setTimeout(() => {
        router.replace(nextPath);
        router.refresh();
      }, 900);
    } else {
      // Wrong code: clear the boxes so the next try starts clean.
      setCode("");
      setStatus(null);
      // After the input re-enables.
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
    return result;
  }, null);

  const [emailState, emailAction, changingEmail] = useActionState(async (prev: SendCodeState | null, formData: FormData) => {
    const result = await ChangeSignupEmailAction(prev, formData);
    if (result.ok) {
      if (result.maskedEmail) setEmail(result.maskedEmail);
      if (result.retryIn) setRetryIn(result.retryIn);
      setStatus({ tone: "info", text: result.message });
      setCode("");
      setMode("code");
    }
    return result;
  }, null);

  function resend() {
    startSending(async () => {
      const result = await ResendEmailCodeAction();
      if (result.retryIn) setRetryIn(result.retryIn);
      setStatus({ tone: result.ok ? "info" : "error", text: result.message });
      inputRef.current?.focus();
    });
  }

  // autoFocus lands before hydration, so onFocus never saw it.
  useEffect(() => {
    if (document.activeElement === inputRef.current) setFocused(true);
  }, []);

  // No code yet (the signup send failed, or an older account): send one now.
  useEffect(() => {
    if (!hasActiveCode && !autoSent.current) {
      autoSent.current = true;
      resend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = window.setTimeout(() => setRetryIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [retryIn]);

  function onCodeChange(value: string) {
    const next = normalizeCode(value).slice(0, CODE_LENGTH);
    setCode(next);
    // The last digit (typed, pasted or autofilled) submits — no extra tap.
    if (next.length === CODE_LENGTH && !verifying) {
      window.setTimeout(() => formRef.current?.requestSubmit(), 0);
    }
  }

  if (verifyState?.success) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
        <span className="grid size-16 place-items-center rounded-full bg-(--sys-green) text-white">
          <Check className="size-8" strokeWidth={2.6} />
        </span>
        <h1 className="text-[34px] leading-[41px] font-bold">إيميلك اتأكد</h1>
        <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          بنكمّل...
        </p>
      </div>
    );
  }

  const codeError = verifyState?.error;
  const activeBox = Math.min(code.length, CODE_LENGTH - 1);

  return (
    <div className="space-y-7 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="flex flex-col items-center gap-4 text-center">
        <span aria-hidden className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-8" strokeWidth={1.8} />
        </span>
        <div className="space-y-2">
          <h1 className="text-[34px] leading-[41px] font-bold">أكّد إيميلك</h1>
          <p className="text-[17px] leading-7 text-muted-foreground">
            بعتنا كود من 6 أرقام لـ{" "}
            <span dir="ltr" className="font-semibold text-foreground">
              {email}
            </span>
          </p>
        </div>
      </div>

      {mode === "code" ? (
        <form ref={formRef} action={verifyAction} className="space-y-5">
          <div className="space-y-2">
            {/* One real input under six boxes: typing, paste and SMS/email autofill all just work. */}
            <div className="relative" dir="ltr">
              <input
                ref={inputRef}
                name="code"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={CODE_LENGTH + 4}
                aria-label="كود التأكيد"
                aria-invalid={!!codeError}
                aria-describedby={codeError ? "code-error" : undefined}
                disabled={verifying}
                className="absolute inset-0 z-10 h-full w-full cursor-text text-[16px] opacity-0"
              />
              <div className="grid grid-cols-6 gap-2" aria-hidden>
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative grid h-14 place-items-center rounded-[12px] bg-card text-[28px] font-semibold tabular-nums transition-shadow duration-200",
                      focused && i === activeBox && "ring-[3px] ring-primary/25",
                      codeError && !code && "ring-[3px] ring-(--sys-red)/25",
                    )}
                  >
                    {code[i] ?? ""}
                    {focused && i === code.length && (
                      <span className="absolute h-7 w-0.5 rounded-full bg-primary motion-safe:animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {codeError ? (
              <p id="code-error" role="alert" className="flex items-center justify-center gap-1.5 text-[13px] text-[#d70015] dark:text-(--sys-red)">
                <AlertCircle className="size-3.5 shrink-0" />
                {codeError}
              </p>
            ) : status ? (
              <p
                role="status"
                className={cn(
                  "text-center text-[13px]",
                  status.tone === "error" ? "text-[#d70015] dark:text-(--sys-red)" : "text-muted-foreground",
                )}
              >
                {status.text}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={verifying || code.length !== CODE_LENGTH} className={cn(PRIMARY_BUTTON_CLASS, "w-full gap-2")}>
            {verifying && <Loader2 className="size-4 animate-spin" />}
            {verifying ? "بنتأكد..." : "تأكيد"}
          </Button>

          <div className="flex flex-col items-center gap-1 text-[15px]">
            <button
              type="button"
              onClick={resend}
              disabled={sending || retryIn > 0}
              className="apple-press inline-flex h-11 items-center gap-2 rounded-full px-4 font-semibold text-primary disabled:font-normal disabled:text-muted-foreground"
            >
              {sending && <Loader2 className="size-4 animate-spin" />}
              {retryIn > 0 ? (
                <>
                  ابعت الكود تاني بعد{" "}
                  <span dir="ltr" className="tabular-nums">
                    {clock(retryIn)}
                  </span>
                </>
              ) : (
                "ابعت الكود تاني"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus(null);
                setMode("email");
              }}
              className="apple-press inline-flex h-11 items-center rounded-full px-4 text-primary"
            >
              الإيميل غلط؟ غيّره
            </button>
          </div>
        </form>
      ) : (
        <form action={emailAction} className="space-y-5">
          <FormField htmlFor="email" label="الإيميل الصحيح" error={emailState && !emailState.ok ? emailState.message : undefined}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              dir="ltr"
              required
              autoFocus
              aria-invalid={!!emailState && !emailState.ok}
              className={FIELD_CLASS}
            />
          </FormField>
          <div className="grid gap-3">
            <Button type="submit" disabled={changingEmail} className={cn(PRIMARY_BUTTON_CLASS, "w-full gap-2")}>
              {changingEmail && <Loader2 className="size-4 animate-spin" />}
              ابعت الكود على الإيميل ده
            </Button>
            <Button type="button" variant="outline" onClick={() => setMode("code")} className={cn(SECONDARY_BUTTON_CLASS, "w-full")}>
              إلغاء
            </Button>
          </div>
        </form>
      )}

      <div className="border-t-[0.5px] border-border pt-5 text-center text-[15px] text-muted-foreground">
        {canSkip ? (
          <Link href="/dashboard" className="apple-press inline-flex h-11 items-center rounded-full px-4 hover:text-foreground">
            أكّد بعدين
          </Link>
        ) : (
          <form action={LogoutAction}>
            <button type="submit" className="apple-press inline-flex h-11 items-center rounded-full px-4 hover:text-foreground">
              تسجيل الخروج
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
