"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart3, CreditCard, Loader2, Palette, ShoppingBag } from "lucide-react";

import { LoginAction } from "@/actions/auth/login.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "./form-field";

const brandFeatures = [
  { icon: ShoppingBag, text: "أضف منتجاتك وابدأ البيع في دقائق" },
  { icon: CreditCard, text: "استقبل مدفوعات آمنة مع كاشير" },
  { icon: BarChart3, text: "تابع طلباتك ومبيعاتك لحظة بلحظة" },
  { icon: Palette, text: "خصص مظهر متجرك من ثيمات احترافية" },
];

const formReveal = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const panelReveal = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.08 },
  },
};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(LoginAction, null);

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
      {/* ── Form Panel (RIGHT in RTL) ── */}
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              أهلاً بيك 👋
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              سجل دخولك وكمل إدارة متجرك بسهولة
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-5">
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
                  className="text-xs text-muted-foreground transition hover:text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                dir="ltr"
                required
                className="h-11"
              />
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">أو</span>
              </div>
            </div>

            <a href="/api/auth/google">
              <Button type="button" variant="outline" className="h-11 w-full gap-2.5 font-medium">
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
                تسجيل الدخول بواسطة Google
              </Button>
            </a>

            <p className="text-center text-sm text-muted-foreground mt-5">
              معندكش حساب؟{" "}
              <Link
                href="/register"
                className="font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                أنشئ متجرك
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          باستخدامك كاشو، أنت توافق على الشروط وسياسة الخصوصية
        </p>
      </motion.div>

      {/* ── Brand Panel (LEFT in RTL) ── */}
      <motion.div
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        variants={panelReveal}
        initial="hidden"
        animate="visible"
        className="relative hidden w-130 flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex"
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Casho"
            width={38}
            height={38}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-wide">كاشو</span>
        </div>

        {/* Features */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-[1.75rem] font-bold leading-snug">
              كل أدوات إدارة متجرك
              <br />
              <span className="text-primary">في مكان واحد</span>
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              لوحة تحكم متكاملة تساعدك على إدارة متجرك ومتابعة مبيعاتك بكل سهولة
            </p>
          </div>

          <ul className="space-y-4">
            {brandFeatures.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3">
                <div className="flex size-9 flex-none items-center justify-center rounded-xl bg-white/10">
                  <feature.icon className="size-4 text-white/90" />
                </div>
                <span className="text-sm text-white/75">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats widget */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between px-8 gap-6">
            <div>
              <p className="text-2xl font-bold">5,000+</p>
              <p className="mt-0.5 text-xs text-white/55">تاجر نشط</p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <p className="text-2xl font-bold">98%</p>
              <p className="mt-0.5 text-xs text-white/55">رضا العملاء</p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="mt-0.5 text-xs text-white/55">دعم فني</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
