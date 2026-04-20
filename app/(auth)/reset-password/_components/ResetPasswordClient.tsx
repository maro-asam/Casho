"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { ResetPasswordAction } from "@/actions/auth/forgot-password.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = null;

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [state, formAction, isPending] = useActionState(
    ResetPasswordAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">تغيير كلمة المرور</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              اكتب كلمة المرور الجديدة لحسابك.
            </p>
          </div>

          {!token ? (
            <div className="space-y-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <p>الرابط غير صالح.</p>
              <Link
                href="/forgot-password"
                className="inline-block font-medium underline underline-offset-4"
              >
                ارجع لصفحة استرجاع كلمة المرور
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="token" value={token} />

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
                {state?.fieldErrors?.password ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                />
                {state?.fieldErrors?.confirmPassword ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.confirmPassword}
                  </p>
                ) : null}
              </div>

              {state?.error ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </div>
              ) : null}

              {state?.success ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  {state.message}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={isPending}
              >
                {isPending ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
