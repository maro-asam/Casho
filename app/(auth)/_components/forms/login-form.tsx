"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

import { LoginAction } from "@/actions/auth/login.actions";
import type { LoginState } from "@/actions/auth/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton, OrDivider, PasswordInput } from "../auth-controls";
import { FormField } from "./form-field";

export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(async (prev: LoginState | null, formData: FormData) => {
    const result = await LoginAction(prev, formData);
    if (result.success) {
      toast.success("أهلًا بيك تاني");
      router.push("/dashboard");
      router.refresh();
    }
    return result;
  }, null);

  // Field errors show under the field; anything else (wrong password, rate limit) up top.
  const formError = state?.error && !state.fieldErrors ? state.error : notice;

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">تسجيل الدخول</h1>
        <p className="text-sm text-muted-foreground">ادخل على لوحة تحكم متجرك.</p>
      </div>

      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {formError}
        </div>
      )}

      <GoogleButton label="الدخول بحساب Google" />
      <OrDivider label="أو بالإيميل" />

      <form action={formAction} className="space-y-4">
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
            className="h-11"
          />
        </FormField>

        <FormField
          htmlFor="password"
          label="كلمة المرور"
          error={state?.fieldErrors?.password}
          action={
            <Link href="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-primary">
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

        <Button type="submit" disabled={isPending} className="h-11 w-full gap-2 font-semibold">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "جاري الدخول..." : "دخول"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        لسه معندكش متجر؟{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          ابدأ مجانًا
        </Link>
      </p>
    </div>
  );
}
