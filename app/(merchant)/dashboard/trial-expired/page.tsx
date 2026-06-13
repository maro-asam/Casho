import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, CreditCard, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";

export const metadata: Metadata = {
  title: "انتهت الفترة التجريبية | كاشو",
  robots: { index: false, follow: false },
};

export default async function TrialExpiredPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      monthlyPrice: true,
      planName: true,
      balance: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyPrice = store?.monthlyPrice ?? 29900;
  const balance = store?.balance ?? 0;
  const needed = Math.max(0, monthlyPrice - balance);

  return (
    <div dir="rtl" className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold">انتهت فترتك التجريبية</h1>
        <p className="mt-3 text-muted-foreground">
          الفترة التجريبية المجانية لمدة 3 أيام قد انتهت. لمواصلة البيع وإدارة متجرك،
          يلزم تفعيل الاشتراك الشهري.
        </p>

        {/* Plan info */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-right shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">باقة سوبر</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {formatMoneyFromPiasters(monthlyPrice)} / شهر
            </span>
          </div>

          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            {[
              "منتجات غير محدودة",
              "طلبات غير محدودة",
              "جميع الثيمات",
              "تكامل كاشير",
              "إدارة المخزون",
              "دعم على مدار الساعة",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>

          {balance > 0 && (
            <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span className="text-muted-foreground">رصيدك الحالي: </span>
              <span className="font-bold">{formatMoneyFromPiasters(balance)}</span>
              {needed > 0 && (
                <span className="mr-2 text-muted-foreground">
                  (تحتاج {formatMoneyFromPiasters(needed)} إضافية)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild size="lg" className="w-full font-bold">
            <Link href="/dashboard/balance">
              <CreditCard className="ml-2 h-4 w-4" />
              شحن الرصيد وتفعيل الاشتراك
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/dashboard/change-plan">
              عرض تفاصيل الباقة
            </Link>
          </Button>
        </div>

        {/* Support */}
        <p className="mt-8 text-xs text-muted-foreground">
          تحتاج مساعدة؟{" "}
          <Link
            href="/dashboard/support"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            تواصل مع الدعم
          </Link>
        </p>
      </div>
    </div>
  );
}
