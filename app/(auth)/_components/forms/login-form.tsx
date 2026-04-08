"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { LoginAction } from "@/actions/auth/login.actions";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(LoginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    if (state?.success) {
      toast.success("تم تسجيل الدخول بنجاح");
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center px-4 py-10 md:px-6",
        className,
      )}
      dir="rtl"
      {...props}
    >
      <Card className="w-full max-w-7xl p-0 overflow-hidden rounded-3xl border">
        <CardContent className="grid min-h-155 p-0 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex items-center"
          >
            <form action={formAction} className="w-full p-8 md:p-10 lg:p-12">
              <FieldGroup className="gap-6">
                <div className="mb-2 flex flex-col items-center gap-3 text-center">
                  <div className="flex size-14 items-center justify-center">
                    <Image
                      src="/logo.svg"
                      alt="Casho"
                      width={50}
                      height={50}
                      className="object-contain rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold tracking-tight">
                      أهلاً بيك 👋
                    </h1>
                    <p className="text-sm leading-6 text-muted-foreground">
                      سجل دخولك وكمل إدارة متجرك بسهولة
                    </p>
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor="email">البريد الإلكتروني</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    dir="ltr"
                    className="h-12 rounded-xl"
                  />
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">كلمة المرور</FieldLabel>
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
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className="h-12 rounded-xl"
                  />
                </Field>

                <Field>
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </Field>

                <FieldDescription className="text-center text-sm">
                  معندكش حساب؟{" "}
                  <Link
                    href="/register"
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    أنشئ متجرك
                  </Link>
                </FieldDescription>
              </FieldGroup>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40, scale: 1.02 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 }}
            className="relative hidden min-h-[320px] md:block"
          >
            <Image
              src="/login.jpg"
              alt="Casho login"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-primary/10" />

            <div className="absolute bottom-6 right-6 left-6 rounded-2xl border border-card/20 bg-card/70 p-4 backdrop-blur-md">
              <p className="text-sm font-semibold text-foreground">
                ابدأ يومك وسيطر على طلبات متجرك
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                كل أدوات الإدارة اللي تحتاجها في مكان واحد بشكل بسيط ومرتب.
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        باستخدامك كاشو، أنت توافق على الشروط وسياسة الخصوصية
      </p>
    </div>
  );
}
