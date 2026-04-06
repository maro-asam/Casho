import Link from "next/link";
import {
  Store,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Ban,
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminDashboardData } from "@/actions/admin/admin-dashboard.actions";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import AdminDashboardCharts from "./_components/admin-dashboard-charts";

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "نشط";
    case SubscriptionStatus.GRACE_PERIOD:
      return "فترة سماح";
    case SubscriptionStatus.PAST_DUE:
      return "متأخر";
    case SubscriptionStatus.CANCELED:
      return "ملغي";
    case SubscriptionStatus.INACTIVE:
    default:
      return "غير مفعل";
  }
}

function statusClasses(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case SubscriptionStatus.GRACE_PERIOD:
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case SubscriptionStatus.PAST_DUE:
      return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400";
    case SubscriptionStatus.CANCELED:
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400";
    case SubscriptionStatus.INACTIVE:
    default:
      return "border-muted bg-muted text-muted-foreground";
  }
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const cards = [
    {
      title: "إجمالي المتاجر",
      value: data.stats.totalStores.toLocaleString("ar-EG"),
      description: "كل المتاجر الموجودة على المنصة",
      icon: Store,
      iconWrap: "bg-primary/10 text-primary",
    },
    {
      title: "المتاجر النشطة",
      value: data.stats.activeStores.toLocaleString("ar-EG"),
      description: "المتاجر المفعلة حاليًا",
      icon: CheckCircle2,
      iconWrap: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "طلبات الشحن المعلقة",
      value: data.stats.pendingTopupRequests.toLocaleString("ar-EG"),
      description: "طلبات محتاجة مراجعة أو موافقة",
      icon: Wallet,
      iconWrap: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "إجمالي الشحنات الموافق عليها",
      value: formatPrice(data.analytics.totalApprovedTopupsAmount),
      description: "إجمالي قيمة الشحنات المعتمدة",
      icon: CircleDollarSign,
      iconWrap: "bg-sky-500/10 text-sky-600",
    },
    {
      title: "شحنات هذا الشهر",
      value: formatPrice(data.analytics.thisMonthApprovedTopupsAmount),
      description: "إجمالي ما تم اعتماده هذا الشهر",
      icon: TrendingUp,
      iconWrap: "bg-violet-500/10 text-violet-600",
    },
    {
      title: "المتاجر غير المفعلة",
      value: data.stats.inactiveStores.toLocaleString("ar-EG"),
      description: "تحتاج متابعة أو تفعيل",
      icon: Ban,
      iconWrap: "bg-zinc-500/10 text-zinc-600",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            نظرة سريعة على أداء المنصة، الشحنات، وحالة المتاجر.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          بيانات مباشرة من قاعدة البيانات
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="group rounded-[24px] border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardDescription className="text-xs md:text-sm">
                    {item.title}
                  </CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {item.value}
                  </CardTitle>
                </div>

                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                    item.iconWrap,
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <AdminDashboardCharts
        monthlyTopups={data.analytics.monthlyTopups}
        statusBreakdown={data.analytics.statusBreakdown}
        topStoresByTopups={data.analytics.topStoresByTopups}
      />

      <section className="grid gap-4 ">
        <Card className="rounded-[28px] border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-xl">أحدث المتاجر</CardTitle>
              <CardDescription>آخر المتاجر المضافة على المنصة.</CardDescription>
            </div>

            <Link
              href="/admin/stores"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              عرض الكل
              <ArrowUpRight className="size-4" />
            </Link>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.latestStores.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  لا توجد متاجر حتى الآن.
                </p>
              </div>
            ) : (
              data.latestStores.map((store) => (
                <Link
                  key={store.id}
                  href={`/admin/stores/${store.id}`}
                  className="group flex flex-col gap-4 rounded-lg border border-border/60 bg-background p-4 transition-all duration-200 hover:border-primary/20 hover:bg-muted/30 hover:shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="size-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{store.name}</h3>
                        <Badge
                          className={cn(
                            "rounded-full border font-medium",
                            statusClasses(store.subscriptionStatus),
                          )}
                          variant="outline"
                        >
                          {statusLabel(store.subscriptionStatus)}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {store.user.email}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        تم الإنشاء: {formatDate(store.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                      {formatPrice(store.balance)}
                    </div>

                    <div className="flex size-9 items-center justify-center rounded-lg border transition group-hover:bg-background">
                      <ArrowUpRight className="size-4" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
