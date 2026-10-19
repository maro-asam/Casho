import { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  UserCircle,
  TrendingUp,
  Gift,
  AlertTriangle,
  Star,
  Cake,
  ArrowLeft,
  Wallet,
} from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetCRMDashboardStatsAction } from "@/actions/crm/crm-analytics.actions";
import { GetUpcomingBirthdaysAction } from "@/actions/crm/customers.actions";
import { CRMStatCard } from "./_components/CRMStatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { CustomerStatusBadge } from "./_components/CustomerHealthBadge";
import { isEntitlementError } from "@/lib/entitlements";
import { UpgradeRequiredCard } from "@/components/entitlements/UpgradeRequiredCard";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("إدارة العملاء — CRM"),
};
}

export default async function CRMDashboardPage() {
  await loadDashboardLocale();
  let stats: Awaited<ReturnType<typeof GetCRMDashboardStatsAction>>;
  let birthdays: Awaited<ReturnType<typeof GetUpcomingBirthdaysAction>>;

  try {
    [stats, birthdays] = await Promise.all([
      GetCRMDashboardStatsAction(),
      GetUpcomingBirthdaysAction(14),
    ]);
  } catch (error) {
    if (isEntitlementError(error)) {
      return (
        <div className="space-y-8" dir={tdir()}>
          <DashboardSectionHeader icon={UserCircle} title={tr("إدارة العملاء (CRM)")} description={tr("تتبع وفهم وطوّر علاقاتك مع عملائك")} />
          <UpgradeRequiredCard
            title={tr("إدارة العملاء (CRM)")}
            description={tr("نظام إدارة العملاء غير متاح في باقتك الحالية.")}
            requiredPlanSlug={error.requiredPlan}
          />
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="space-y-8" dir={tdir()}>
      <DashboardSectionHeader
        icon={UserCircle}
        title={tr("إدارة العملاء (CRM)")}
        description={tr("تتبع وفهم وطوّر علاقاتك مع عملائك")}
        badge={stats.totalCustomers}
        actionLabel={tr("إضافة عميل")}
        actionHref="/dashboard/crm/customers"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <CRMStatCard
          title={tr("إجمالي العملاء")}
          value={stats.totalCustomers.toLocaleString(intlLocale())}
          icon={Users}
          color="default"
        />
        <CRMStatCard
          title={tr("عملاء جدد")}
          value={stats.newThisMonth.toLocaleString(intlLocale())}
          subtitle={tr("آخر 30 يوم")}
          icon={TrendingUp}
          trend={{ value: stats.newGrowthPct, label: tr("مقارنةً بالسابق") }}
          color="blue"
        />
        <CRMStatCard
          title={tr("عملاء نشطون")}
          value={stats.activeCustomers.toLocaleString(intlLocale())}
          subtitle={tr("لديهم طلبات هذا الشهر")}
          icon={Star}
          color="green"
        />
        <CRMStatCard
          title={tr("عملاء VIP")}
          value={stats.vipCustomers.toLocaleString(intlLocale())}
          icon={UserCircle}
          color="amber"
        />
        <CRMStatCard
          title={tr("في خطر")}
          value={stats.atRiskCount.toLocaleString(intlLocale())}
          subtitle={tr("لم يشتروا منذ 90 يوم")}
          icon={AlertTriangle}
          color="red"
        />
        <CRMStatCard
          title={tr("نقاط الولاء")}
          value={stats.loyaltyStats.totalEarned.toLocaleString(intlLocale())}
          subtitle={tr("مُسترد: {0}", stats.loyaltyStats.totalRedeemed.toLocaleString(intlLocale()))}
          icon={Gift}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Top Customers */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">{tr("أفضل العملاء إنفاقاً")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/crm/customers" className="flex items-center gap-1 text-xs text-muted-foreground">
                {tr("عرض الكل")}
                <ArrowLeft className="size-3 ltr:-scale-x-100" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{tr("لا يوجد عملاء بعد")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.topCustomers.map((c, i) => (
                  <div key={c.customerId ?? i} className="flex items-center gap-4 px-6 py-3.5">
                    <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(c.customer?.name ?? c.customer?.phone ?? tr("؟"))[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {c.customer?.name ?? c.customer?.phone ?? tr("عميل غير معروف")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tr("{0} طلبات", c.orderCount)}
                      </p>
                    </div>
                    {c.customer?.status && (
                      <CustomerStatusBadge status={c.customer.status} />
                    )}
                    <div className="text-end ltr">
                      <p className="text-sm font-semibold text-primary">
                        {formatMoneyFromPiasters(c.totalSpend)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming Birthdays */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Cake className="size-4 text-pink-500" />
                <CardTitle className="text-sm font-semibold">{tr("أعياد الميلاد القادمة")}</CardTitle>
              </div>
              {birthdays.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {birthdays.length}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {birthdays.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">
                  {tr("لا توجد أعياد ميلاد خلال الـ 14 يوم القادمة")}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {birthdays.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-xs font-bold text-pink-500">
                          {(b.name ?? b.phone)[0]}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{b.name ?? b.phone}</p>
                          <p className="text-[11px] text-muted-foreground">{b.phone}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-pink-500 font-medium">
                        {b.daysUntil === 0 ? tr("اليوم 🎂") : tr("{0} يوم", b.daysUntil)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-violet-500" />
                <CardTitle className="text-sm font-semibold">{tr("ملخص الولاء")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-violet-500/5 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{tr("نقاط مكتسبة")}</span>
                <span className="text-sm font-bold text-violet-600">
                  {stats.loyaltyStats.totalEarned.toLocaleString(intlLocale())}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{tr("نقاط مستردة")}</span>
                <span className="text-sm font-bold text-emerald-600">
                  {stats.loyaltyStats.totalRedeemed.toLocaleString(intlLocale())}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-500/5 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{tr("معدل الاسترداد")}</span>
                <span className="text-sm font-bold text-blue-600">
                  {stats.loyaltyStats.totalEarned > 0
                    ? Math.round(
                        (stats.loyaltyStats.totalRedeemed / stats.loyaltyStats.totalEarned) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-1" asChild>
                <Link href="/dashboard/loyalty">{tr("إعدادات نظام النقاط")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { href: "/dashboard/crm/customers", label: tr("قائمة العملاء"), icon: Users, color: "text-blue-500 bg-blue-500/10" },
          { href: "/dashboard/crm/segments", label: tr("الشرائح"), icon: Star, color: "text-violet-500 bg-violet-500/10" },
          { href: "/dashboard/crm/tags", label: tr("العلامات"), icon: Gift, color: "text-amber-500 bg-amber-500/10" },
          { href: "/dashboard/crm/analytics", label: tr("تحليلات CRM"), icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
        ].map((item) => (
          <Card key={item.href} className="group hover:border-primary/30 transition-colors cursor-pointer">
            <Link href={item.href} className="flex items-center gap-3 p-4">
              <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${item.color}`}>
                <item.icon className="size-4.5" />
              </div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <ArrowLeft className="ms-auto size-3.5 text-muted-foreground group-hover:text-primary transition-colors ltr:-scale-x-100" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
