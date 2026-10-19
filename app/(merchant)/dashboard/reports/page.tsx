import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Download } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, FilterTabs, PageHeader, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { BranchSwitcher } from "@/components/branch/BranchSwitcher";
import { requireBranchScope } from "@/lib/store/branch-context";
import { prisma } from "@/lib/prisma";
import { cairoDayKey, parseRange } from "./_lib/range";
import { getReportsData } from "./_lib/reports-data";
import type { ReportTab } from "./_lib/types";
import { RangePicker } from "./_components/range-picker";
import { TabCoupons } from "./_components/tab-coupons";
import { TabCustomers } from "./_components/tab-customers";
import { TabInventory } from "./_components/tab-inventory";
import { TabOverview } from "./_components/tab-overview";
import { TabPos } from "./_components/tab-pos";
import { PRODUCT_SORTS, TabProducts, type ProductSort } from "./_components/tab-products";
import { TabSales } from "./_components/tab-sales";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

const BASE_PATH = "/reports";
const TABS: { value: ReportTab; label: string }[] = [
  { value: "overview", get label() { return tr("نظرة عامة"); } },
  { value: "sales", get label() { return tr("المبيعات"); } },
  { value: "products", get label() { return tr("المنتجات"); } },
  { value: "customers", get label() { return tr("العملاء"); } },
  { value: "inventory", get label() { return tr("المخزون"); } },
  { value: "pos", get label() { return tr("الكاشير"); } },
  { value: "coupons", get label() { return tr("أكواد الخصم"); } },
];

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const params = await searchParams;
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) redirect("/");

  const range = parseRange({
    range: readParam(params, "range"),
    from: readParam(params, "from"),
    to: readParam(params, "to"),
    period: readParam(params, "period"),
  });
  const { scope, branches } = await requireBranchScope("view_analytics");
  const data = await getReportsData(store.id, range, scope.branchIds);
  const multiBranch = branches.length > 1;

  const rawTab = readParam(params, "tab");
  const tabs = TABS.filter((t) => t.value !== "pos" || data.pos);
  const tab: ReportTab = tabs.some((t) => t.value === rawTab) ? (rawTab as ReportTab) : "overview";
  const rawSort = readParam(params, "sort");
  const sort: ProductSort = PRODUCT_SORTS.includes(rawSort as ProductSort) ? (rawSort as ProductSort) : "sales";

  const exportQuery = new URLSearchParams({ range: range.preset, branch: scope.branch?.id ?? "all" });
  if (range.preset === "custom") {
    exportQuery.set("from", range.fromKey);
    exportQuery.set("to", range.toKey);
  }

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("التقارير")}
        description={
          <>
            {multiBranch && <span className="font-medium text-foreground">{scope.branch ? scope.branch.name : tr("كل الفروع")} · </span>}
            {data.range.label}
            <span className="text-muted-foreground/70">{" "}{tr("· مقارنة بـ {0}", data.range.previousLabel)}</span>
            {scope.branch && multiBranch && (
              <span className="block text-xs text-muted-foreground/70">{tr("مبيعات الكاشير في الفرع ده بس — طلبات المتجر الأونلاين بتظهر في «كل الفروع».")}</span>
            )}
          </>
        }
        actions={
          <>
            <BranchSwitcher branches={branches} value={scope.branch?.id ?? "all"} allowAll />
            <RangePicker preset={range.preset} fromKey={range.fromKey} toKey={range.toKey} todayKey={cairoDayKey(new Date())} />
            {data.hasEverSold && (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <a href={`/api/export/reports?${exportQuery}`} download>
                  <Download className="size-3.5" />
                  Excel
                </a>
              </Button>
            )}
          </>
        }
      />

      {!data.hasEverSold ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={BarChart3}
            title={tr("التقارير هتظهر مع أول طلب")}
            description={tr("أول ما يوصلك طلب من المتجر أو تبيع من الكاشير، هتلاقي هنا المبيعات والأرباح والعملاء والمخزون بالتفصيل.")}
            action={
              <Button asChild size="sm">
                <Link href="/pos">{tr("افتح الكاشير")}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <FilterTabs
            label={tr("أقسام التقارير")}
            param="tab"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={tabs.map((t) => ({ label: t.label, value: t.value === "overview" ? undefined : t.value }))}
          />

          {tab === "overview" && <TabOverview data={data} />}
          {tab === "sales" && <TabSales data={data} />}
          {tab === "products" && <TabProducts data={data} sort={sort} params={params} />}
          {tab === "customers" && <TabCustomers data={data} />}
          {tab === "inventory" && <TabInventory data={data} />}
          {tab === "pos" && data.pos && <TabPos pos={data.pos} />}
          {tab === "coupons" && <TabCoupons data={data} />}
        </>
      )}
    </div>
  );
}
