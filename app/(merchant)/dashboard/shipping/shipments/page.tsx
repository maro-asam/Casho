import Link from "next/link";
import type { Metadata } from "next";
import { Banknote, PackageCheck, Plug, SearchX, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  SearchInput,
  Segmented,
  Unavailable,
  appleButton,
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
import { ShippingTabs } from "../_components/shipping-tabs";
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
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول عشان تشحن طلباتك وتتابعها من هنا.")} />
      </div>
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

  const filterClass = "h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-40";

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("الشحنات")}
        subtitle={tr("كل شحنات متجرك مع كل الشركات، وحالتها وتحصيلها، في مكان واحد.")}
        actions={
          <>
            {dueIdsOnPage.length > 0 && <CollectAllButton ids={dueIdsOnPage} label={tr("استلمت فلوس الـ {0}", nf.format(dueIdsOnPage.length))} />}
            <Link href="/shipping/integrations" className={appleButton.gray}>
              <Plug className="size-4" />
              {tr("شركات الشحن")}
            </Link>
          </>
        }
      />
      <ShippingTabs active="shipments" />

      {/* Cash the carriers still hold — the one number merchants chase. */}
      {codDueAmount > 0 && filters.cod !== "due" && (
        <Link href={`${BASE_PATH}?cod=due`} className="apple-card apple-press flex items-center gap-4 p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-(--sys-orange) text-white">
            <Banknote className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-muted-foreground">{tr("عند شركات الشحن دلوقتي")}</span>
            <span className="block text-[24px] leading-tight font-bold tabular-nums">{money.format(codDueAmount / 100)}</span>
            <span className="block text-[13px] text-muted-foreground">
              {tr("{0} من {1} شحنة", money.format(codDueAmount / 100), nf.format(codDue._count._all))} · {tr("اتسلّمت ولسه فلوسها ماوصلتكش.")}
            </span>
          </span>
          <span className="hidden text-[15px] text-primary sm:block">{tr("فلوس عند الشركة")}</span>
        </Link>
      )}

      {!storeHasShipments ? (
        <div className="apple-card">
          <Unavailable
            icon={PackageCheck}
            title={tr("لسه مفيش شحنات")}
            description={
              connectedKeys.size > 0
                ? tr("افتح أي طلب واضغط اشحن — الشحنة هتظهر هنا وتتابع حالتها وتحصيلها.")
                : tr("اربط شركة الشحن اللي بتتعامل معاها، وبعدين اشحن أي طلب من صفحته.")
            }
            action={
              <Link href={connectedKeys.size > 0 ? "/orders" : "/shipping/integrations"} className={appleButton.filled}>
                {connectedKeys.size > 0 ? tr("روح للطلبات") : tr("اربط شركة شحن")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label={tr("حالة الشحنة")}
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: tr("الكل"), count: allCount },
              ...SHIPMENT_TABS.map((t) => ({ label: t.label, value: t.value, count: countFor(t.statuses) })),
            ]}
          />
          <section className="apple-card overflow-hidden">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:px-5">
              <SearchInput
                placeholder={tr("رقم التتبع، اسم العميل أو موبايله")}
                className="sm:max-w-sm sm:flex-1"
                inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
              />
              <div className="flex gap-2 sm:ms-auto">
                {carrierOptions.length > 1 && (
                  <SelectFilter param="carrier" allLabel={tr("كل الشركات")} label={tr("شركة الشحن")} options={carrierOptions} className={filterClass} />
                )}
                <SelectFilter
                  param="cod"
                  allLabel={tr("كل التحصيل")}
                  label={tr("التحصيل")}
                  className={filterClass}
                  options={[
                    { value: "due", label: tr("فلوس عند الشركة") },
                    { value: "collected", label: tr("وصلتني") },
                  ]}
                />
              </div>
            </div>

            {rows.length > 0 ? (
              <ShipmentsTable rows={rows} />
            ) : (
              <Unavailable
                icon={SearchX}
                title={tr("مفيش شحنات بالفلاتر دي")}
                description={tr("جرّب كلمة بحث تانية أو امسح الفلاتر.")}
                className="border-t-[0.5px] border-border"
                action={
                  hasFilters && (
                    <Link href={BASE_PATH} className={appleButton.tinted}>
                      {tr("مسح الفلاتر")}
                    </Link>
                  )
                }
              />
            )}

            {total > 0 && (
              <div className="border-t-[0.5px] border-border">
                <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("شحنة")} />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
