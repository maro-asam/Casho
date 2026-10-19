import Link from "next/link";
import type { Metadata } from "next";
import { PackageCheck, SearchX, Store, Truck } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  readPage,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { CARRIERS, carrierDisplayName, getCarrier } from "@/lib/shipping/carriers";
import { governorateName } from "@/constants/egypt-governorates";
import { CollectAllButton } from "./_components/cod-buttons";
import { SHIPMENT_TABS, buildShipmentWhere, parseShipmentFilters } from "./_components/shipment-filters";
import { ShipmentsTable, type ShipmentRow } from "./_components/shipments-table";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("الشحنات"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/shipping/shipments";
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const nf = lazyIntl.number();

export default async function ShipmentsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول عشان تشحن طلباتك وتتابعها من هنا.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const filters = parseShipmentFilters(params);
  const baseWhere = buildShipmentWhere(store.id, filters, { withTab: false });

  const [statusCounts, codDue] = await Promise.all([
    prisma.shipment.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.shipment.aggregate({
      where: { storeId: store.id, status: "DELIVERED", codAmount: { gt: 0 }, codCollectedAt: null },
      _sum: { codAmount: true },
      _count: { _all: true },
    }),
  ]);
  const countFor = (statuses: readonly string[]) =>
    statusCounts.filter((c) => statuses.includes(c.status)).reduce((sum, c) => sum + c._count._all, 0);
  const allCount = statusCounts.reduce((sum, c) => sum + c._count._all, 0);
  const activeTab = SHIPMENT_TABS.find((t) => t.value === filters.tab);
  const total = activeTab ? countFor(activeTab.statuses) : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const [shipments, storeHasShipments, connected] = await Promise.all([
    prisma.shipment.findMany({
      where: buildShipmentWhere(store.id, filters),
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderId: true,
        provider: true,
        courierName: true,
        trackingNumber: true,
        trackingUrl: true,
        status: true,
        codAmount: true,
        codCollectedAt: true,
        createdAt: true,
        order: { select: { fullName: true, governorate: true } },
      },
    }),
    allCount > 0 ? Promise.resolve(true) : prisma.shipment.count({ where: { storeId: store.id } }).then((n) => n > 0),
    prisma.shippingIntegration.findMany({ where: { storeId: store.id }, select: { provider: true } }),
  ]);

  const rows: ShipmentRow[] = shipments.map((s) => ({
    id: s.id,
    orderId: s.orderId,
    provider: s.provider,
    courierName: s.courierName ?? carrierDisplayName(getCarrier(s.provider), {}, s.provider),
    trackingNumber: s.trackingNumber,
    trackingUrl: s.trackingUrl,
    status: s.status,
    codAmount: s.codAmount,
    codCollectedAt: s.codCollectedAt,
    customer: s.order?.fullName ?? null,
    destination: governorateName(s.order?.governorate),
    createdAt: s.createdAt,
  }));

  const connectedKeys = new Set(connected.map((c) => c.provider.toUpperCase()));
  const carrierOptions = CARRIERS.filter((c) => connectedKeys.has(c.key)).map((c) => ({ value: c.key, label: c.nameAr }));
  const hasFilters = Boolean(filters.q || filters.tab || filters.carrier || filters.cod);
  const codDueAmount = codDue._sum.codAmount ?? 0;
  const dueIdsOnPage = filters.cod === "due" ? rows.map((r) => r.id) : [];

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("الشحنات")}
        description={
          codDueAmount > 0 ? (
            <>
              {tr("عند شركات الشحن دلوقتي")}{" "}
              <Link href={`${BASE_PATH}?cod=due`} className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400">
                {tr("{0} من {1} شحنة", money.format(codDueAmount / 100), nf.format(codDue._count._all))}
              </Link>{" "}{tr("اتسلّمت ولسه فلوسها ماوصلتكش.")}
            </>
          ) : (
            tr("كل شحنات متجرك مع كل الشركات، وحالتها وتحصيلها، في مكان واحد.")
          )
        }
        actions={
          <>
            {dueIdsOnPage.length > 0 && <CollectAllButton ids={dueIdsOnPage} label={tr("استلمت فلوس الـ {0}", nf.format(dueIdsOnPage.length))} />}
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
              <Link href="/shipping/integrations">
                <Truck className="size-4" />
                {tr("شركات الشحن")}
              </Link>
            </Button>
          </>
        }
      />

      {!storeHasShipments ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={PackageCheck}
            title={tr("لسه مفيش شحنات")}
            description={
              connectedKeys.size > 0
                ? tr("افتح أي طلب واضغط اشحن — الشحنة هتظهر هنا وتتابع حالتها وتحصيلها.")
                : tr("اربط شركة الشحن اللي بتتعامل معاها، وبعدين اشحن أي طلب من صفحته.")
            }
            action={
              <Button asChild variant="outline" size="sm">
                <Link href={connectedKeys.size > 0 ? "/orders" : "/shipping/integrations"}>
                  {connectedKeys.size > 0 ? tr("روح للطلبات") : tr("اربط شركة شحن")}
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label={tr("حالة الشحنة")}
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: tr("الكل"), count: allCount },
              ...SHIPMENT_TABS.map((t) => ({ label: t.label, value: t.value, count: countFor(t.statuses) })),
            ]}
          />
          <DataCard
            toolbar={
              <>
                <SearchInput placeholder={tr("رقم التتبع، اسم العميل أو موبايله")} />
                {carrierOptions.length > 1 && (
                  <SelectFilter param="carrier" allLabel={tr("كل الشركات")} label={tr("شركة الشحن")} options={carrierOptions} />
                )}
                <SelectFilter
                  param="cod"
                  allLabel={tr("كل التحصيل")}
                  label={tr("التحصيل")}
                  options={[
                    { value: "due", label: tr("فلوس عند الشركة") },
                    { value: "collected", label: tr("وصلتني") },
                  ]}
                />
              </>
            }
            footer={
              total > 0 && (
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("شحنة")} />
              )
            }
          >
            {rows.length > 0 ? (
              <ShipmentsTable rows={rows} />
            ) : (
              <EmptyState
                icon={SearchX}
                title={tr("مفيش شحنات بالفلاتر دي")}
                description={tr("جرّب كلمة بحث تانية أو امسح الفلاتر.")}
                action={
                  hasFilters && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={BASE_PATH}>{tr("مسح الفلاتر")}</Link>
                    </Button>
                  )
                }
              />
            )}
          </DataCard>
        </div>
      )}
    </div>
  );
}
