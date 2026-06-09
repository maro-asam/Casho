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

export const metadata: Metadata = {
  title: "إدارة العملاء — CRM",
};

export default async function CRMDashboardPage() {
  const [stats, birthdays] = await Promise.all([
    GetCRMDashboardStatsAction(),
    GetUpcomingBirthdaysAction(14),
  ]);

  return (
    <div className="space-y-8" dir="rtl">
      <DashboardSectionHeader
        icon={UserCircle}
        title="إدارة العملاء (CRM)"
        description="تتبع وفهم وطوّر علاقاتك مع عملائك"
        badge={stats.totalCustomers}
        actionLabel="إضافة عميل"
        actionHref="/dashboard/crm/customers"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <CRMStatCard
          title="إجمالي العملاء"
          value={stats.totalCustomers.toLocaleString("ar-EG")}
          icon={Users}
          color="default"
        />
        <CRMStatCard
          title="عملاء جدد"
          value={stats.newThisMonth.toLocaleString("ar-EG")}
          subtitle="آخر 30 يوم"
          icon={TrendingUp}
          trend={{ value: stats.newGrowthPct, label: "مقارنةً بالسابق" }}
          color="blue"
        />
        <CRMStatCard
          title="عملاء نشطون"
          value={stats.activeCustomers.toLocaleString("ar-EG")}
          subtitle="لديهم طلبات هذا الشهر"
          icon={Star}
          color="green"
        />
        <CRMStatCard
          title="عملاء VIP"
          value={stats.vipCustomers.toLocaleString("ar-EG")}
          icon={UserCircle}
          color="amber"
        />
        <CRMStatCard
          title="في خطر"
          value={stats.atRiskCount.toLocaleString("ar-EG")}
          subtitle="لم يشتروا منذ 90 يوم"
          icon={AlertTriangle}
          color="red"
        />
        <CRMStatCard
          title="نقاط الولاء"
          value={stats.loyaltyStats.totalEarned.toLocaleString("ar-EG")}
          subtitle={`مُسترد: ${stats.loyaltyStats.totalRedeemed.toLocaleString("ar-EG")}`}
          icon={Gift}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Top Customers */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">أفضل العملاء إنفاقاً</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/crm/customers" className="flex items-center gap-1 text-xs text-muted-foreground">
                عرض الكل
                <ArrowLeft className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا يوجد عملاء بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.topCustomers.map((c, i) => (
                  <div key={c.customerId ?? i} className="flex items-center gap-4 px-6 py-3.5">
                    <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(c.customer?.name ?? c.customer?.phone ?? "؟")[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {c.customer?.name ?? c.customer?.phone ?? "عميل غير معروف"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.orderCount} طلبات
                      </p>
                    </div>
                    {c.customer?.status && (
                      <CustomerStatusBadge status={c.customer.status} />
                    )}
                    <div className="text-left ltr">
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
                <CardTitle className="text-sm font-semibold">أعياد الميلاد القادمة</CardTitle>
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
                  لا توجد أعياد ميلاد خلال الـ 14 يوم القادمة
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
                        {b.daysUntil === 0 ? "اليوم 🎂" : `${b.daysUntil} يوم`}
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
                <CardTitle className="text-sm font-semibold">ملخص الولاء</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-violet-500/5 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">نقاط مكتسبة</span>
                <span className="text-sm font-bold text-violet-600">
                  {stats.loyaltyStats.totalEarned.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">نقاط مستردة</span>
                <span className="text-sm font-bold text-emerald-600">
                  {stats.loyaltyStats.totalRedeemed.toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-500/5 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">معدل الاسترداد</span>
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
                <Link href="/dashboard/loyalty">إعدادات نظام النقاط</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { href: "/dashboard/crm/customers", label: "قائمة العملاء", icon: Users, color: "text-blue-500 bg-blue-500/10" },
          { href: "/dashboard/crm/segments", label: "الشرائح", icon: Star, color: "text-violet-500 bg-violet-500/10" },
          { href: "/dashboard/crm/tags", label: "العلامات", icon: Gift, color: "text-amber-500 bg-amber-500/10" },
          { href: "/dashboard/crm/analytics", label: "تحليلات CRM", icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
        ].map((item) => (
          <Card key={item.href} className="group hover:border-primary/30 transition-colors cursor-pointer">
            <Link href={item.href} className="flex items-center gap-3 p-4">
              <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${item.color}`}>
                <item.icon className="size-4.5" />
              </div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <ArrowLeft className="mr-auto size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
