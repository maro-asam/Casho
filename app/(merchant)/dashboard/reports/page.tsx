import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Download } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, Segmented, Unavailable, appleButton, readParam, type SearchParamsRecord } from "@/components/saas-page";
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
      <LargeTitle
        title={tr("التقارير")}
        subtitle={
          <>
            {multiBranch && <span className="text-foreground">{scope.branch ? scope.branch.name : tr("كل الفروع")} · </span>}
            {data.range.label}
            <span className="text-(--label-3)">{" "}{tr("· مقارنة بـ {0}", data.range.previousLabel)}</span>
          </>
        }
        actions={
          <>
            <BranchSwitcher
              branches={branches}
              value={scope.branch?.id ?? "all"}
              allowAll
              className="h-11 rounded-full border-0 bg-card px-4 text-[15px] font-normal shadow-none"
            />
            {data.hasEverSold && (
              <a href={`/api/export/reports?${exportQuery}`} download className={appleButton.gray}>
                <Download className="size-4 text-muted-foreground" />
                Excel
              </a>
            )}
          </>
        }
      >
        {scope.branch && multiBranch && (
          <p className="text-[13px] text-muted-foreground">{tr("مبيعات الكاشير في الفرع ده بس — طلبات المتجر الأونلاين بتظهر في «كل الفروع».")}</p>
        )}
      </LargeTitle>

      {!data.hasEverSold ? (
        <div className="apple-card">
          <Unavailable
            icon={BarChart3}
            title={tr("التقارير هتظهر مع أول طلب")}
            description={tr("أول ما يوصلك طلب من المتجر أو تبيع من الكاشير، هتلاقي هنا المبيعات والأرباح والعملاء والمخزون بالتفصيل.")}
            action={
              <Link href="/pos" className={`${appleButton.filled} h-9 px-4`}>
                {tr("افتح الكاشير")}
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Filters in one row above the content: section on one side, period on the other. */}
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Segmented
              label={tr("أقسام التقارير")}
              param="tab"
              basePath={BASE_PATH}
              searchParams={params}
              segments={tabs.map((t) => ({ label: t.label, value: t.value === "overview" ? undefined : t.value }))}
            />
            <RangePicker preset={range.preset} fromKey={range.fromKey} toKey={range.toKey} todayKey={cairoDayKey(new Date())} />
          </div>

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
