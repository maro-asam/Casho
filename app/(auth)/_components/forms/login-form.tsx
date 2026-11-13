"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { LoginAction } from "@/actions/auth/login.actions";
import type { LoginState } from "@/actions/auth/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton, OrDivider, PasswordInput } from "../auth-controls";
import { cn } from "@/lib/utils";
import { FIELD_CLASS, FormAlert, FormField, PRIMARY_BUTTON_CLASS } from "./form-field";

export function LoginForm({ notice }: { notice?: string }) {
  // Stays true until the dashboard replaces this page, so the button keeps
  // spinning instead of looking like the sign-in did nothing.
  const [redirecting, setRedirecting] = useState(false);

  const [state, formAction, isPending] = useActionState(async (prev: LoginState | null, formData: FormData) => {
    const result = await LoginAction(prev, formData);
    if (result.success) {
      toast.success("أهلًا بيك تاني");
      setRedirecting(true);
      // A full page load, not router.push() + router.refresh(): this action just
      // set the session cookie, so Next is already refreshing /login on its own,
      // and a client-side push racing that refresh sometimes left the merchant (or
      // rep) on the login page until they signed in again. The browser's own
      // request always carries the new cookie, and the server sends it on to the
      // dashboard, /sales, /verify-email or onboarding.
      window.location.replace("/dashboard");
    }
    return result;
  }, null);
  const busy = isPending || redirecting;

  // Field errors show under the field; anything else (wrong password, rate limit) up top.
  const formError = state?.error && !state.fieldErrors ? state.error : notice;

  return (
    <div className="space-y-7 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="space-y-2 text-center">
        <h1 className="text-[34px] leading-[41px] font-bold">تسجيل الدخول</h1>
        <p className="text-[17px] text-muted-foreground">ادخل على لوحة تحكم متجرك.</p>
      </div>

      {formError && <FormAlert>{formError}</FormAlert>}

      <GoogleButton label="الدخول بحساب Google" />
      <OrDivider label="أو بالإيميل" />

      <form action={formAction} className="space-y-5">
        <FormField htmlFor="email" label="البريد الإلكتروني" error={state?.fieldErrors?.email}>
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
            aria-invalid={!!state?.fieldErrors?.email}
            className={FIELD_CLASS}
          />
        </FormField>

        <FormField
          htmlFor="password"
          label="كلمة المرور"
          error={state?.fieldErrors?.password}
          action={
            <Link href="/forgot-password" className="text-[13px] text-primary hover:underline">
              نسيت كلمة المرور؟
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            aria-invalid={!!state?.fieldErrors?.password}
          />
        </FormField>

        <Button type="submit" disabled={busy} className={cn(PRIMARY_BUTTON_CLASS, "mt-2 w-full gap-2")}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "جاري الدخول..." : "دخول"}
        </Button>
      </form>

      <p className="text-center text-[15px] text-muted-foreground">
        لسه معندكش متجر؟{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          ابدأ مجانًا
        </Link>
      </p>
    </div>
  );
}
