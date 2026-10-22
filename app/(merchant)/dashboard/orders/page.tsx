import Link from "next/link";
import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import { SearchX, ShoppingCart, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  Segmented,
  SearchInput,
  SelectFilter,
  Unavailable,
  appleButton,
  readPage,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { canAskToConfirm, orderConfirmUrl } from "@/lib/orders/whatsapp-confirm";
import { ExportOrdersButton } from "./_components/export-orders-button";
import { buildOrderWhere, parseOrderFilters } from "./_components/order-filters";
import { ORDER_CHANNELS, ORDER_STATUSES } from "./_components/order-meta";
import { OrdersTable, type OrderRow } from "./_components/orders-table";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("الطلبات"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/orders";

type OrdersRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

const OrdersRoute = async ({ searchParams }: OrdersRouteProps) => {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true, customDomain: true, customDomainStatus: true },
  });

  if (!store) {
    return (
      <div className="apple-card" dir={tdir()}>
        <Unavailable
          icon={Store}
          title={tr("لسه معندكش متجر")}
          description={tr("أنشئ متجرك الأول عشان تستقبل الطلبات وتتابعها من هنا.")}
        />
      </div>
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const filters = parseOrderFilters(params);
  const { q, status, source } = filters;
  const baseWhere = buildOrderWhere(store.id, filters, { withStatus: false });

  // Tab counts respect search + channel, so they always match what the tab shows.
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    where: baseWhere,
    _count: { _all: true },
  });
  const countFor = (s: OrderStatus) => statusCounts.find((c) => c.status === s)?._count._all ?? 0;
  const allCount = statusCounts.reduce((sum, c) => sum + c._count._all, 0);
  const total = status ? countFor(status) : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const [orders, storeHasOrders] = await Promise.all([
    prisma.order.findMany({
      where: buildOrderWhere(store.id, filters),
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        phone: true,
        status: true,
        source: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        riskLevel: true,
        confirmationStatus: true,
        returnedAt: true,
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
    }),
    // Only needed to tell "no orders yet" apart from "no matches".
    allCount > 0 ? Promise.resolve(true) : prisma.order.count({ where: { storeId: store.id } }).then((n) => n > 0),
  ]);

  const rows: OrderRow[] = orders.map((order) => ({
    id: order.id,
    fullName: order.fullName,
    phone: order.phone,
    status: order.status,
    source: order.source,
    total: order.total,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    firstProduct: order.items[0]?.product.name ?? null,
    otherProducts: Math.max(0, order.items.length - 1),
    riskLevel: order.riskLevel,
    awaitingCode: order.confirmationStatus === "PENDING" && order.status === "PENDING",
    returned: order.status === "CANCELED" && order.returnedAt !== null,
    customerConfirmed: order.confirmationStatus === "CONFIRMED",
    confirmUrl: canAskToConfirm(order) ? orderConfirmUrl(store, order.id) : null,
  }));

  const hasFilters = Boolean(q || status || source);

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("الطلبات")}
        subtitle={tr("تابع طلبات المتجر الأونلاين والكاشير وغيّر حالتها من مكان واحد.")}
        actions={<ExportOrdersButton />}
      />

      {!storeHasOrders ? (
        <div className="apple-card">
          <Unavailable
            icon={ShoppingCart}
            title={tr("لسه مفيش طلبات")}
            description={tr("أول ما عميل يطلب من متجرك أو تبيع من الكاشير، الطلب هيظهر هنا وتقدر تتابعه لحد ما يتسلّم.")}
            action={
              <Link href="/pos" className={appleButton.tinted}>
                {tr("افتح الكاشير")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label={tr("حالة الطلب")}
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: tr("الكل"), count: allCount },
              ...ORDER_STATUSES.map((s) => ({ label: s.label, value: s.value, count: countFor(s.value) })),
            ]}
          />

          <section className="apple-card overflow-hidden">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <SearchInput
                placeholder={tr("ابحث بالاسم أو الموبايل أو رقم الطلب")}
                className="sm:max-w-sm"
                inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
              />
              <SelectFilter
                label={tr("القناة")}
                param="source"
                allLabel={tr("كل القنوات")}
                className="h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-40"
                options={Object.entries(ORDER_CHANNELS).map(([value, { label }]) => ({ value, label }))}
              />
            </div>

            {rows.length > 0 ? (
              <OrdersTable orders={rows} storeId={store.id} storeName={store.name} />
            ) : (
              <Unavailable
                icon={SearchX}
                title={tr("مفيش طلبات بالفلاتر دي")}
                description={q ? tr("مفيش نتايج لـ \"{0}\". جرّب اسم أو رقم تاني.", q) : tr("جرّب حالة أو قناة تانية.")}
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
                <Pager
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  basePath={BASE_PATH}
                  searchParams={params}
                  noun={tr("طلب")}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default OrdersRoute;
