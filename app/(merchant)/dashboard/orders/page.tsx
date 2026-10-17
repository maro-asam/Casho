import Link from "next/link";
import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import { SearchX, ShoppingCart, Store } from "lucide-react";

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
import { ExportOrdersButton } from "./_components/export-orders-button";
import { buildOrderWhere, parseOrderFilters } from "./_components/order-filters";
import { ORDER_CHANNELS, ORDER_STATUSES } from "./_components/order-meta";
import { OrdersTable, type OrderRow } from "./_components/orders-table";

export const metadata: Metadata = {
  title: "الطلبات",
};

const PAGE_SIZE = 20;
const BASE_PATH = "/orders";

type OrdersRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

const OrdersRoute = async ({ searchParams }: OrdersRouteProps) => {
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title="لسه معندكش متجر"
        description="أنشئ متجرك الأول عشان تستقبل الطلبات وتتابعها من هنا."
        className="rounded-xl border border-dashed border-border"
      />
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
  }));

  const hasFilters = Boolean(q || status || source);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="الطلبات"
        description="تابع طلبات المتجر الأونلاين والكاشير وغيّر حالتها من مكان واحد."
        actions={<ExportOrdersButton />}
      />

      {!storeHasOrders ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={ShoppingCart}
            title="لسه مفيش طلبات"
            description="أول ما عميل يطلب من متجرك أو تبيع من الكاشير، الطلب هيظهر هنا وتقدر تتابعه لحد ما يتسلّم."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/pos">افتح الكاشير</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label="حالة الطلب"
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: "الكل", count: allCount },
              ...ORDER_STATUSES.map((s) => ({ label: s.label, value: s.value, count: countFor(s.value) })),
            ]}
          />

          <DataCard
            toolbar={
              <>
                <SearchInput placeholder="ابحث بالاسم أو الموبايل أو رقم الطلب" />
                <SelectFilter
                  label="القناة"
                  param="source"
                  allLabel="كل القنوات"
                  options={Object.entries(ORDER_CHANNELS).map(([value, { label }]) => ({ value, label }))}
                />
              </>
            }
            footer={
              total > 0 ? (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  basePath={BASE_PATH}
                  searchParams={params}
                  noun="طلب"
                />
              ) : undefined
            }
          >
            {rows.length > 0 ? (
              <OrdersTable orders={rows} storeId={store.id} />
            ) : (
              <EmptyState
                icon={SearchX}
                title="مفيش طلبات بالفلاتر دي"
                description={q ? `مفيش نتايج لـ "${q}". جرّب اسم أو رقم تاني.` : "جرّب حالة أو قناة تانية."}
                action={
                  hasFilters && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={BASE_PATH}>مسح الفلاتر</Link>
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
};

export default OrdersRoute;
