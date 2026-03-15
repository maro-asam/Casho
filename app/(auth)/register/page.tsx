"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";

import { RegisterAction } from "@/actions/auth/register.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const points = [
  "أنشئ متجرك في دقائق",
  "احصل على رابط خاص لمتجرك",
  "ابدأ استقبال الطلبات بسهولة",
];

const RegisterRoute = () => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(RegisterAction, null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordMismatch = confirm.length > 0 && password !== confirm;

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    if (state?.success) {
      toast.success(state.message || "تم إنشاء الحساب بنجاح");
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-primary px-10 py-10 text-primary-foreground">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-semibold"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Store className="h-5 w-5" />
            </div>
            كُشــــك
          </Link>

          <div className="max-w-md space-y-6">
            <span className="inline-flex rounded-full border border-white/15 px-4 py-1 text-sm text-white/80">
              ابدأ البيع أونلاين بسهولة
            </span>

            <h1 className="text-4xl font-bold leading-relaxed">
              أنشئ متجرك
              <br />
              وابدأ أول خطوة في بيع منتجاتك
            </h1>

            <p className="text-base leading-8 text-primary-foreground/80">
              منصة بسيطة للتجار اللي عايزين يبيعوا أونلاين بسرعة، من غير تعقيد
              ومن غير تكلفة كبيرة.
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
            أول 50 متجر بسعر 300 جنيه شهريًا
          </p>
        </div>

        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                إنشاء حساب جديد
              </h2>
              <p className="text-sm text-muted-foreground">
                أدخل بياناتك للبدء في إنشاء متجرك الإلكتروني
              </p>
            </div>

            <form
              action={formAction}
              className="space-y-5 rounded-3xl border bg-background p-6 shadow-sm md:p-8"
            >
              <div className="space-y-2">
                <Label htmlFor="storeName">اسم المتجر</Label>
                <Input
                  id="storeName"
                  name="storeName"
                  required
                  placeholder="Maro Fashion"
                  className={`h-12 rounded-xl ${
                    state?.fieldErrors?.storeName
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {state?.fieldErrors?.storeName && (
                  <p className="text-xs text-red-500">
                    {state.fieldErrors.storeName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className={`h-12 rounded-xl ${
                    state?.fieldErrors?.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  dir="ltr"
                />
                {state?.fieldErrors?.email && (
                  <p className="text-xs text-red-500">
                    {state.fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className={`h-12 rounded-xl ${
                    state?.fieldErrors?.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {state?.fieldErrors?.password && (
                  <p className="text-xs text-red-500">
                    {state.fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className={`h-12 rounded-xl ${
                    passwordMismatch
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  onChange={(e) => setConfirm(e.target.value)}
                />

                {passwordMismatch && (
                  <p className="text-xs text-red-500">
                    كلمتا المرور غير متطابقتين
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base"
                disabled={passwordMismatch || isPending}
              >
                {isPending ? "جاري إنشاء الحساب..." : "ابدأ متجرك دلوقتي"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                عندك حساب بالفعل؟{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  سجل دخول
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterRoute;