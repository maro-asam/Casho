import { Metadata } from "next";
import Link from "next/link";
import { Clock, MessageCircle, PauseCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/balance-ui/meta";

export const metadata: Metadata = {
  title: "الاشتراك متوقف",
  robots: { index: false, follow: false },
};

export default async function TrialExpiredPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      monthlyPrice: true,
      billingCycle: true,
      balance: true,
      trialEndDate: true,
      subscriptionEndsAt: true,
      autoRenew: true,
      plan: { select: { name: true } },
      _count: { select: { balanceTransactions: { where: { type: "SUBSCRIPTION_CHARGE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const price = store?.monthlyPrice ?? 0;
  const balance = store?.balance ?? 0;
  const shortfall = Math.max(0, price - balance);
  const neverPaid = (store?._count.balanceTransactions ?? 0) === 0 && !!store?.trialEndDate;
  const cycleWord = store?.billingCycle === "YEARLY" ? "سنة" : "شهر";
  const Icon = neverPaid ? Clock : PauseCircle;

  return (
    <div dir="rtl" className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Icon className="size-8" />
        </div>

        <h1 className="text-2xl font-bold">{neverPaid ? "التجربة المجانية خلصت" : "اشتراكك متوقف"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {neverPaid
            ? "كل حاجة عملتها في متجرك محفوظة زي ما هي. فعّل اشتراكك وكمّل من مكان ما وقفت."
            : "متجرك مش بيستقبل طلبات دلوقتي، بس كل بياناتك محفوظة. اشحن وهيرجع يشتغل فورًا."}
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">باقتك</p>
              <p className="font-semibold">{store?.plan?.name ?? "—"}</p>
            </div>
            <p className="text-lg font-bold tabular-nums">
              {formatMoney(price)} <span className="text-sm font-normal text-muted-foreground">/ {cycleWord}</span>
            </p>
          </div>
          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">رصيدك</dt>
              <dd className="font-medium tabular-nums">{formatMoney(balance)}</dd>
            </div>
            {shortfall > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">ناقصك</dt>
                <dd className="font-medium tabular-nums text-amber-700 dark:text-amber-400">{formatMoney(shortfall)}</dd>
              </div>
            )}
          </dl>
          {shortfall > 0 && store?.autoRenew && (
            <p className="mt-3 text-xs text-muted-foreground">أول ما الرصيد يوصل، الاشتراك بيتفعّل لوحده.</p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button asChild size="lg" className="w-full gap-2">
            <Link href={shortfall > 0 ? `/balance/topup?amount=${Math.ceil(shortfall / 100)}` : "/change-plan"}>
              <Wallet className="size-4" />
              {shortfall > 0 ? `اشحن ${formatMoney(shortfall)} وفعّل` : "فعّل اشتراكك من الرصيد"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/change-plan">قارن الباقات واختار</Link>
          </Button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MessageCircle className="size-3.5" />
          محتاج مساعدة؟
          <Link href="/support" className="font-medium text-primary underline-offset-2 hover:underline">
            كلّم الدعم
          </Link>
        </p>
      </div>
    </div>
  );
}
