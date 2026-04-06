"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ForgotPasswordAction } from "@/actions/auth/forgot-password.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = null;

export default function ForgotPasswordRoute() {
  const [state, formAction, isPending] = useActionState(
    ForgotPasswordAction,
    initialState,
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">نسيت كلمة المرور؟</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              اكتب البريد الإلكتروني المرتبط بحسابك، وهنجهز لك رابط تغيير
              الباسورد.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                placeholder="you@example.com"
                required
              />
              {state?.fieldErrors?.email ? (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.email}
                </p>
              ) : null}
            </div>

            {state?.error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            ) : null}

            {state?.success ? (
              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
                <p className="text-foreground">{state.message}</p>

                {state.resetLink ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      ده لينك تجريبي لحد ما توصل خدمة الإيميل:
                    </p>
                    <div className="overflow-x-auto rounded-lg border bg-background p-3 text-xs">
                      <code>{state.resetLink}</code>
                    </div>
                    <a
                      href={state.resetLink}
                      className="inline-block text-sm font-medium text-primary underline underline-offset-4"
                    >
                      افتح رابط إعادة التعيين
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full rounded-lg"
              disabled={isPending}
            >
              {isPending ? "جاري الإرسال..." : "إرسال رابط الاسترجاع"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            تذكرت كلمة المرور؟{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4"
            >
              ارجع لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
