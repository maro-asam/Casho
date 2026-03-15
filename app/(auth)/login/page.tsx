"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";

import { LoginAction } from "@/actions/auth/login.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const points = [
  "ادخل على لوحة التحكم بسهولة",
  "تابع طلبات متجرك في مكان واحد",
  "إدارة سريعة وبسيطة لمتجرك",
];

const LoginRoute = () => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(LoginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    if (state?.success) {
      toast.success(state.message || "تم تسجيل الدخول بنجاح جاري التوجيه...");
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-primary px-10 py-10 text-primary-foreground">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Store className="h-5 w-5" />
            </div>
            كُشــــك
          </Link>

          <div className="max-w-md space-y-6">
            <span className="inline-flex rounded-full border border-white/15 px-4 py-1 text-sm text-white/80">
              رجوع سريع لمتجرك
            </span>

            <h1 className="text-4xl font-bold leading-tight">
              سجل دخولك
              <br />
              وكمل إدارة متجرك بسهولة
            </h1>

            <p className="text-base leading-8 text-primary-foreground/80">
              ادخل لحسابك وابدأ تتابع الطلبات، وتدير المنتجات، وتكمل شغلك من مكان
              واحد وبأبسط تجربة ممكنة.
            </p>

            <div className="space-y-4 pt-2">
              {points.map((point, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-foreground/70">
            منصة بسيطة للتجار اللي بيبيعوا أونلاين
          </p>
        </div>

        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                الرجوع للرئيسية
              </Link>
            </div>

            <div className="mb-8 space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">تسجيل الدخول</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                أدخل بياناتك للوصول إلى لوحة التحكم الخاصة بمتجرك
              </p>
            </div>

            <form
              action={formAction}
              className="space-y-5 rounded-3xl border bg-background p-6 shadow-sm md:p-8"
            >
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  dir="ltr"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">كلمة المرور</Label>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  dir="ltr"
                  className="h-12 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base"
                disabled={isPending}
              >
                {isPending ? "جاري تسجيل الدخول..." : "دخول"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                معندكش حساب؟{" "}
                <Link
                  href="/register"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  أنشئ متجرك
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginRoute;