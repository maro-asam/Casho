import Link from "next/link";
import { ArrowUpRight, Building2, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

function fmt(v: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(v / 100);
}
function fmtDate(d: Date) {
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

export default async function AdminStoresPage() {
  await requireAdmin();

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true,
      balance: true, subscriptionStatus: true, createdAt: true,
      user: { select: { email: true } },
    },
  });

  const active   = stores.filter((s) => s.subscriptionStatus === "ACTIVE").length;
  const inactive = stores.filter((s) => s.subscriptionStatus === "INACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">المتاجر</h1>
        <p className="mt-1 text-sm text-muted-foreground">إدارة كل المتاجر المسجلة على المنصة</p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "إجمالي المتاجر", value: stores.length, color: "text-primary bg-primary/10",        icon: Store       },
          { label: "نشطة",            value: active,         color: "text-emerald-600 bg-emerald-500/10", icon: Building2   },
          { label: "غير مفعلة",      value: inactive,       color: "text-zinc-500 bg-zinc-500/10",       icon: Building2   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </div>
              <div className={cn("flex size-10 items-center justify-center rounded-lg", s.color)}>
                <s.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">كل المتاجر</h2>
          <p className="text-sm text-muted-foreground">{stores.length} متجر مسجل</p>
        </div>

        {stores.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">لا توجد متاجر بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-right text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">المتجر</th>
                  <th className="px-6 py-3 font-medium">الـ Slug</th>
                  <th className="px-6 py-3 font-medium">الحالة</th>
                  <th className="px-6 py-3 font-medium">الرصيد</th>
                  <th className="px-6 py-3 font-medium">تاريخ الإنشاء</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {stores.map((store) => (
                  <tr key={store.id} className="transition hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Building2 className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-xs text-muted-foreground">{store.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{store.slug}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("rounded-full border text-xs", statusCls(store.subscriptionStatus))}>
                        {statusLabel(store.subscriptionStatus)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-medium">{fmt(store.balance)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{fmtDate(store.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/stores/${store.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted"
                      >
                        عرض <ArrowUpRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
