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
    <div className={cn("flex flex-col gap-6", className)} dir="rtl" {...props}>
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* الفورم */}
          <form action={formAction} className="p-6 md:p-8">
            <FieldGroup>
              {/* Logo + Title */}
              <div className="flex flex-col items-center gap-3 text-center">
                <Image src="/logo.svg" alt="Casho" width={60} height={60} className="rounded-sm" />
                <h1 className="text-2xl font-bold">أهلاً بيك 👋</h1>
                <p className="text-sm text-muted-foreground">
                  سجل دخولك وكمل إدارة متجرك بسهولة
                </p>
              </div>

              {/* Email */}
              <Field>
                <FieldLabel htmlFor="email">البريد الإلكتروني</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  dir="ltr"
                />
              </Field>

              {/* Password */}
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">كلمة المرور</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:underline"
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
                />
              </Field>

              {/* Submit */}
              <Field>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "جاري الدخول..." : "دخول"}
                </Button>
              </Field>

              {/* Register */}
              <FieldDescription className="text-center">
                معندكش حساب؟{" "}
                <Link href="/register" className="font-medium underline">
                  أنشئ متجرك
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* الصورة */}
          <div className="relative hidden bg-muted md:block">
            <Image src="/login.jpg" alt="Casho" fill className="object-cover" />
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        باستخدامك كاشو، أنت توافق على الشروط وسياسة الخصوصية
      </p>
    </div>
  );
}
