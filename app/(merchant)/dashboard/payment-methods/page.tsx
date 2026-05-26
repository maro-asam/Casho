import type { Metadata } from "next";
import { Banknote, CreditCard, ShieldCheck, WalletCards, type LucideIcon } from "lucide-react";

import { GetPaymentMethodsSettingsAction } from "@/actions/payment-methods/payment-methods.actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import PaymentMethodsForm from "./_components/PaymentMethodsForm";

export const metadata: Metadata = {
  title: "طرق الدفع",
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  valueClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  valueClass?: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardDescription className="text-xs">{title}</CardDescription>
          <CardTitle className={cn("text-xl font-bold md:text-2xl", valueClass)}>{value}</CardTitle>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function PaymentMethodsPage() {
  const settings = await GetPaymentMethodsSettingsAction();

  const activeManualMethods = settings.enabledPaymentMethods.filter(
    (m) => m !== "kashier",
  ).length;
  const kashierActive = settings.enabledPaymentMethods.includes("kashier");

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 px-6 py-7 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-sky-500/8 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <WalletCards className="size-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">طرق الدفع</h1>
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                {settings.storeName}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              فعّل وسائل الدفع اللي هتظهر في متجرك — يدوية، محلية، أو بوابة دفع أونلاين.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="الطرق اليدوية المفعلة"
          value={String(activeManualMethods)}
          description="تحويلات بنكية ومحافظ إلكترونية ستظهر في الـ checkout."
          icon={Banknote}
        />
        <StatCard
          title="بوابة الدفع الأونلاين"
          value={kashierActive ? "مفعل" : "متوقف"}
          description="Kashier — دفع بالكارت أو المحفظة الرقمية بدون تحويل يدوي."
          icon={CreditCard}
          valueClass={kashierActive ? "text-emerald-600" : "text-muted-foreground"}
        />
        <StatCard
          title="إجمالي طرق الدفع"
          value={String(settings.enabledPaymentMethods.length)}
          description="وسائل دفع ظاهرة حاليًا للعملاء في صفحة الدفع."
          icon={ShieldCheck}
        />
      </div>

      {/* ── Form ── */}
      <PaymentMethodsForm initialSettings={settings} />
    </div>
  );
}
