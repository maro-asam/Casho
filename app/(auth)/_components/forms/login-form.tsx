"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
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

        <Button type="submit" disabled={isPending} className={cn(PRIMARY_BUTTON_CLASS, "mt-2 w-full gap-2")}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "جاري الدخول..." : "دخول"}
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
