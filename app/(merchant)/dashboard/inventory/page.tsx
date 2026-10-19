import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Box,
  ClipboardList,
  Package,
  PackageSearch,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { GetInventoryOverviewAction, GetRestockRecommendations } from "@/actions/inventory/overview.actions";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { StockMovementBadge } from "./_components/StockMovementBadge";
import { InventoryStatCard } from "./_components/InventoryStatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { hasFeature, checkLimit, FEATURE_KEYS } from "@/lib/entitlements";
import { UpgradeRequiredCard } from "@/components/entitlements/UpgradeRequiredCard";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

function formatCurrency(egp: number) {
  return new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(egp);
}

async function OverviewCards() {
  const data = await GetInventoryOverviewAction();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <InventoryStatCard
        title={tr("إجمالي المنتجات")}
        value={data.totalProducts.toLocaleString(intlLocale())}
        icon={Package}
        subtext={tr("المنتجات النشطة")}
      />
      <InventoryStatCard
        title={tr("إجمالي المخزون")}
        value={data.totalStock.toLocaleString(intlLocale())}
        icon={Warehouse}
        subtext={tr("وحدة في المخزون")}
      />
      <InventoryStatCard
        title={tr("قيمة المخزون")}
        value={formatCurrency(data.inventoryValue)}
        icon={TrendingUp}
        iconColor="bg-emerald-500"
        subtext={tr("بسعر التكلفة")}
      />
      <InventoryStatCard
        title={tr("الإيرادات المتوقعة")}
        value={formatCurrency(data.potentialRevenue)}
        icon={TrendingUp}
        iconColor="bg-blue-500"
        subtext={tr("ربح متوقع: {0}", formatCurrency(data.expectedProfit))}
      />
      <InventoryStatCard
        title={tr("منخفض المخزون")}
        value={data.lowStockCount.toLocaleString(intlLocale())}
        icon={AlertTriangle}
        iconColor="bg-amber-500"
        subtext={tr("منتج يحتاج إعادة طلب")}
      />
      <InventoryStatCard
        title={tr("نفد المخزون")}
        value={data.outOfStockCount.toLocaleString(intlLocale())}
        icon={PackageSearch}
        iconColor="bg-red-500"
        subtext={tr("منتج غير متاح")}
      />
      <InventoryStatCard
        title={tr("الموردون")}
        value={data.supplierCount.toLocaleString(intlLocale())}
        icon={Users}
        subtext={tr("مورد نشط")}
      />
      <InventoryStatCard
        title={tr("طلبات شراء معلقة")}
        value={data.pendingPOCount.toLocaleString(intlLocale())}
        icon={ShoppingCart}
        subtext={tr("{0} تحويل معلق", data.pendingTransferCount)}
      />
    </div>
  );
}

async function RecentMovements() {
  const data = await GetInventoryOverviewAction();

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-semibold">{tr("آخر حركات المخزون")}</h2>
        <Link href="/dashboard/inventory/movements">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            {tr("عرض الكل")}{" "}<ArrowRight className="size-3.5 ltr:-scale-x-100" />
          </Button>
        </Link>
      </div>
      <div className="divide-y divide-border">
        {data.recentMovements.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">{tr("لا توجد حركات بعد")}</p>
        ) : (
          data.recentMovements.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3">
              <img
                src={m.product.image}
                alt={m.product.name}
                className="size-9 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.product.name}</p>
                {m.variant && <p className="text-xs text-muted-foreground">{m.variant.name}</p>}
                {m.note && <p className="truncate text-xs text-muted-foreground">{m.note}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StockMovementBadge type={m.type} />
                <span
                  className={
                    m.quantity >= 0
                      ? "text-xs font-semibold text-emerald-600"
                      : "text-xs font-semibold text-red-500"
                  }
                >
                  {m.quantity >= 0 ? "+" : ""}
                  {m.quantity}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

async function LowStockAlert() {
  const data = await GetInventoryOverviewAction();

  if (!data.lowStockProducts.length) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center justify-between border-b border-amber-200/60 px-5 py-4 dark:border-amber-900/30">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          <h2 className="font-semibold text-amber-800 dark:text-amber-400">
            {tr("تنبيه: مخزون منخفض ({0} منتج)", data.lowStockProducts.length)}
          </h2>
        </div>
        <Link href="/dashboard/inventory/movements">
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-amber-700">
            {tr("تفاصيل")}{" "}<ArrowRight className="size-3.5 ltr:-scale-x-100" />
          </Button>
        </Link>
      </div>
      <div className="divide-y divide-amber-200/60 dark:divide-amber-900/30">
        {data.lowStockProducts.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <img src={p.image} alt={p.name} className="size-8 rounded-md object-cover" />
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {tr("{0} متبقي", p.stock)}
              </p>
              <p className="text-xs text-muted-foreground">{tr("الحد: {0}", p.threshold)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function RestockRecommendations() {
  const recs = await GetRestockRecommendations();

  if (!recs.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Zap className="size-4 text-primary" />
        <h2 className="font-semibold">{tr("توصيات إعادة الطلب الذكية")}</h2>
      </div>
      <div className="divide-y divide-border">
        {recs.slice(0, 6).map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-3">
            <img src={r.image} alt={r.name} className="size-9 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {tr("متوسط المبيعات: {0} وحدة/يوم", r.avgDailySales)}
                {r.daysUntilStockout !== null && tr(" · ينفد خلال {0} يوم", r.daysUntilStockout)}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <Badge
                variant={r.urgency === "out_of_stock" ? "destructive" : r.urgency === "critical" ? "destructive" : "secondary"}
              >
                {r.urgency === "out_of_stock" ? tr("نفد") : r.urgency === "critical" ? tr("عاجل") : tr("منخفض")}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">{tr("اطلب: {0}", r.suggestedReorder)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <Link href="/dashboard/inventory/purchase-orders/new">
          <Button size="sm" variant="outline" className="gap-2">
            <ShoppingCart className="size-4" />
            {tr("إنشاء طلب شراء")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default async function InventoryDashboardPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  const inventoryEnabled = store ? await hasFeature(store.id, FEATURE_KEYS.INVENTORY) : false;

  if (!inventoryEnabled) {
    const { requiredPlan } = store
      ? await checkLimit(store.id, FEATURE_KEYS.INVENTORY)
      : { requiredPlan: null };
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{tr("إدارة المخزون")}</h1>
          <p className="text-sm text-muted-foreground">{tr("نظرة شاملة على مخزونك وحركاته")}</p>
        </div>
        <UpgradeRequiredCard
          title={tr("إدارة المخزون المتقدمة")}
          description={tr("الفروع، الموردون، وطلبات الشراء غير متاحة في باقتك الحالية.")}
          requiredPlanSlug={requiredPlan}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tr("إدارة المخزون")}</h1>
          <p className="text-sm text-muted-foreground">{tr("نظرة شاملة على مخزونك وحركاته")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/inventory/adjustments/new">
            <Button variant="outline" size="sm" className="gap-2">
              <ClipboardList className="size-4" />
              {tr("تسوية مخزون")}
            </Button>
          </Link>
          <Link href="/dashboard/inventory/purchase-orders/new">
            <Button variant="outline" size="sm" className="gap-2">
              <Truck className="size-4" />
              {tr("طلب شراء")}
            </Button>
          </Link>
          <Link href="/dashboard/inventory/transfers/new">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeftRight className="size-4" />
              {tr("تحويل فرع")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { href: "/dashboard/inventory/movements", icon: Box, label: tr("الحركات") },
          { href: "/dashboard/inventory/adjustments", icon: ClipboardList, label: tr("التسويات") },
          { href: "/dashboard/inventory/suppliers", icon: Users, label: tr("الموردون") },
          { href: "/dashboard/inventory/purchase-orders", icon: ShoppingCart, label: tr("طلبات الشراء") },
          { href: "/dashboard/inventory/transfers", icon: ArrowLeftRight, label: tr("التحويلات") },
          { href: "/dashboard/inventory/branches", icon: Warehouse, label: tr("الفروع") },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:bg-accent">
              <item.icon className="size-5 text-primary" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <OverviewCards />
      </Suspense>

      {/* Low Stock Alert */}
      <Suspense fallback={null}>
        <LowStockAlert />
      </Suspense>

      {/* Bottom grid: Restock + Recent Movements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
          <RestockRecommendations />
        </Suspense>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
          <RecentMovements />
        </Suspense>
      </div>
    </div>
  );
}
