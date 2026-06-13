"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { LoginAction } from "@/actions/auth/login.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "./form-field";
import { AuthBrandPanel } from "../auth-brand-panel";

const formReveal = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(LoginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success("تم تسجيل الدخول بنجاح");
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div dir="rtl" className="flex min-h-screen">
      {/* ── Form Panel ── */}
      <motion.div
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        variants={formReveal}
        initial="hidden"
        animate="visible"
        className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 md:px-10"
      >
        <div className="w-full max-w-105">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Casho"
                width={44}
                height={44}
                priority
                className="rounded-xl"
              />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              مرحباً بك مجدداً
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              تسجيل الدخول
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              أدخل بياناتك للوصول للوحة التحكم
            </p>
          </div>

          {/* Google OAuth */}
          <div className="mb-6">
            <a href="/api/auth/google" className="block">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2.5 font-medium"
              >
                <GoogleIcon />
                المتابعة بواسطة Google
              </Button>
            </a>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">
                أو بالبريد الإلكتروني
              </span>
            </div>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <FormField
              htmlFor="email"
              label="البريد الإلكتروني"
              error={state?.fieldErrors?.email}
            >
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                dir="ltr"
                required
                className="h-11"
              />
            </FormField>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground transition hover:text-primary"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                  className="h-11 pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  className="absolute inset-y-0 inset-e-0 flex items-center pe-3 text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {state?.fieldErrors?.password && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-11 w-full font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>

            <p className="pt-2 text-center text-sm text-muted-foreground">
              معندكش حساب؟{" "}
              <Link
                href="/register"
                className="font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                أنشئ متجرك مجاناً
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          باستخدامك كاشو، أنت توافق على{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:text-foreground"
          >
            الشروط
          </Link>{" "}
          و{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            سياسة الخصوصية
          </Link>
        </p>
      </motion.div>

      {/* ── Brand Panel ── */}
      <AuthBrandPanel
        heading={
          <>
            كل أدوات إدارة متجرك
            <br />
            <span className="text-primary">في مكان واحد</span>
          </>
        }
        subheading="لوحة تحكم متكاملة تساعدك على إدارة متجرك ومتابعة مبيعاتك بكل سهولة"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
