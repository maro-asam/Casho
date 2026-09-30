import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Download } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, FilterTabs, PageHeader, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
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

const BASE_PATH = "/reports";
const TABS: { value: ReportTab; label: string }[] = [
  { value: "overview", label: "نظرة عامة" },
  { value: "sales", label: "المبيعات" },
  { value: "products", label: "المنتجات" },
  { value: "customers", label: "العملاء" },
  { value: "inventory", label: "المخزون" },
  { value: "pos", label: "الكاشير" },
  { value: "coupons", label: "الكوبونات" },
];

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
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
  const data = await getReportsData(store.id, range);

  const rawTab = readParam(params, "tab");
  const tabs = TABS.filter((t) => t.value !== "pos" || data.pos);
  const tab: ReportTab = tabs.some((t) => t.value === rawTab) ? (rawTab as ReportTab) : "overview";
  const rawSort = readParam(params, "sort");
  const sort: ProductSort = PRODUCT_SORTS.includes(rawSort as ProductSort) ? (rawSort as ProductSort) : "sales";

  const exportQuery = new URLSearchParams({ range: range.preset });
  if (range.preset === "custom") {
    exportQuery.set("from", range.fromKey);
    exportQuery.set("to", range.toKey);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="التقارير"
        description={
          <>
            {data.range.label}
            <span className="text-muted-foreground/70"> · مقارنة بـ {data.range.previousLabel}</span>
          </>
        }
        actions={
          <>
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
            title="التقارير هتظهر مع أول طلب"
            description="أول ما يوصلك طلب من المتجر أو تبيع من الكاشير، هتلاقي هنا المبيعات والأرباح والعملاء والمخزون بالتفصيل."
            action={
              <Button asChild size="sm">
                <Link href="/pos">افتح الكاشير</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <FilterTabs
            label="أقسام التقارير"
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
