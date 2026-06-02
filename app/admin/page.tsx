import Link from "next/link";
import {
  Store,
  Wallet,
  CheckCircle2,
  Ban,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAdminDashboardData } from "@/actions/admin/admin-dashboard.actions";
import { SubscriptionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import AdminDashboardCharts from "./_components/admin-dashboard-charts";

function fmt(v: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(v / 100);
}
function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(d);
}
function statusLabel(s: SubscriptionStatus) {
  const map: Record<SubscriptionStatus, string> = {
    ACTIVE: "نشط", GRACE_PERIOD: "فترة سماح",
    PAST_DUE: "متأخر", CANCELED: "ملغي", INACTIVE: "غير مفعل",
  };
  return map[s] ?? s;
}
function statusCls(s: SubscriptionStatus) {
  switch (s) {
    case "ACTIVE":       return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    case "GRACE_PERIOD": return "bg-amber-500/10  text-amber-700  border-amber-500/20";
    case "PAST_DUE":     return "bg-rose-500/10   text-rose-700   border-rose-500/20";
    case "CANCELED":     return "bg-zinc-500/10   text-zinc-600   border-zinc-500/20";
    default:             return "bg-muted          text-muted-foreground border-border";
  }
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const stats = [
    { label: "إجمالي المتاجر",       value: data.stats.totalStores,          icon: Store,            color: "text-primary      bg-primary/10"      },
    { label: "المتاجر النشطة",        value: data.stats.activeStores,         icon: CheckCircle2,     color: "text-emerald-600  bg-emerald-500/10"  },
    { label: "طلبات شحن معلقة",      value: data.stats.pendingTopupRequests,  icon: Wallet,           color: "text-amber-600    bg-amber-500/10"    },
    { label: "إجمالي الشحنات",        value: fmt(data.analytics.totalApprovedTopupsAmount), icon: CircleDollarSign, color: "text-sky-600 bg-sky-500/10" },
    { label: "شحنات هذا الشهر",      value: fmt(data.analytics.thisMonthApprovedTopupsAmount), icon: TrendingUp, color: "text-violet-600 bg-violet-500/10" },
    { label: "متاجر غير مفعلة",      value: data.stats.inactiveStores,        icon: Ban,              color: "text-zinc-500     bg-zinc-500/10"     },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-muted-foreground">نظرة شاملة على أداء المنصة</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          بيانات مباشرة
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</p>
              </div>
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", s.color)}>
                <s.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminDashboardCharts
        monthlyTopups={data.analytics.monthlyTopups}
        statusBreakdown={data.analytics.statusBreakdown}
        topStoresByTopups={data.analytics.topStoresByTopups}
      />

      {/* Latest stores */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">أحدث المتاجر</h2>
            <p className="text-sm text-muted-foreground">آخر المتاجر المضافة</p>
          </div>
          <Link href="/admin/stores" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted">
            عرض الكل <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {data.latestStores.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">لا توجد متاجر بعد</div>
        ) : (
          <div className="divide-y">
            {data.latestStores.map((store) => (
              <Link
                key={store.id}
                href={`/admin/stores/${store.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-muted/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{store.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{store.user.email}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant="outline" className={cn("hidden rounded-full border text-xs sm:inline-flex", statusCls(store.subscriptionStatus))}>
                    {statusLabel(store.subscriptionStatus)}
                  </Badge>
                  <span className="hidden text-sm text-muted-foreground md:block">{fmtDate(store.createdAt)}</span>
                  <span className="rounded-lg bg-muted px-2.5 py-1 text-sm font-medium">{fmt(store.balance)}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
