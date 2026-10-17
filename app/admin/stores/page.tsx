import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Store } from "lucide-react";
import { Prisma, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  StatusPill,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { th, theadRow } from "../_components/admin-ui";
import { SUBSCRIPTION_META, fmtDate, fmtMoney, fmtRelative, pickEnum } from "../_lib/format";

export const metadata: Metadata = { title: "المتاجر" };

const PAGE_SIZE = 20;
const BASE_PATH = "/admin/stores";
const EXPIRING = "EXPIRING"; // pseudo-status: active, renews within 7 days
const SORTS = { newest: "الأحدث", balance: "الرصيد الأعلى", ending: "ينتهي أولًا" } as const;

export default async function AdminStoresPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const rawStatus = readParam(params, "status");
  const status = pickEnum(SubscriptionStatus, rawStatus);
  const expiring = rawStatus === EXPIRING;
  const planParam = readParam(params, "plan");
  const sortParam = readParam(params, "sort");
  const sort = sortParam && sortParam in SORTS ? (sortParam as keyof typeof SORTS) : "newest";

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const planId = plans.some((p) => p.id === planParam) ? planParam : undefined;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);

  const baseWhere: Prisma.StoreWhereInput = {
    ...(planId && { planId }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { customDomain: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { phone_number: { contains: q } } },
      ],
    }),
  };
  const expiringWhere: Prisma.StoreWhereInput = {
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    subscriptionEndsAt: { gte: now, lte: in7Days },
  };
  const where: Prisma.StoreWhereInput = {
    ...baseWhere,
    ...(status && { subscriptionStatus: status }),
    ...(expiring && expiringWhere),
  };

  const [grouped, expiringCount, total] = await Promise.all([
    prisma.store.groupBy({ by: ["subscriptionStatus"], where: baseWhere, _count: { _all: true } }),
    prisma.store.count({ where: { ...baseWhere, ...expiringWhere } }),
    prisma.store.count({ where }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.subscriptionStatus, g._count._all])) as Partial<Record<SubscriptionStatus, number>>;
  const all = grouped.reduce((s, g) => s + g._count._all, 0);

  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const orderBy: Prisma.StoreOrderByWithRelationInput[] =
    sort === "balance"
      ? [{ balance: "desc" }]
      : sort === "ending"
        ? [{ subscriptionEndsAt: { sort: "asc", nulls: "last" } }]
        : [{ createdAt: "desc" }];

  const stores = await prisma.store.findMany({
    where,
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
      billingCycle: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      createdAt: true,
      plan: { select: { name: true } },
      user: { select: { email: true, name: true } },
      _count: { select: { orders: true, products: true } },
    },
  });

  const filtered = !!(q || status || expiring || planId);

  return (
    <div className="space-y-6">
      <PageHeader title="المتاجر" description="كل المتاجر على المنصة: الاشتراك، الرصيد، والنشاط. افتح أي متجر عشان تديره." />

      <div className="space-y-4">
        <FilterTabs
          label="حالة الاشتراك"
          param="status"
          basePath={BASE_PATH}
          searchParams={params}
          tabs={[
            { label: "الكل", count: all },
            { label: SUBSCRIPTION_META.ACTIVE.label, value: "ACTIVE", count: counts.ACTIVE ?? 0 },
            { label: "تنتهي خلال ٧ أيام", value: EXPIRING, count: expiringCount },
            { label: SUBSCRIPTION_META.GRACE_PERIOD.label, value: "GRACE_PERIOD", count: counts.GRACE_PERIOD ?? 0 },
            { label: SUBSCRIPTION_META.PAST_DUE.label, value: "PAST_DUE", count: counts.PAST_DUE ?? 0 },
            { label: SUBSCRIPTION_META.INACTIVE.label, value: "INACTIVE", count: counts.INACTIVE ?? 0 },
            { label: SUBSCRIPTION_META.CANCELED.label, value: "CANCELED", count: counts.CANCELED ?? 0 },
          ]}
        />

        <DataCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث بالاسم أو الرابط أو بريد المالك أو موبايله" className="sm:max-w-sm" />
              <div className="flex gap-2">
                <SelectFilter param="plan" allLabel="كل الباقات" label="الباقة" options={plans.map((p) => ({ value: p.id, label: p.name }))} />
                <SelectFilter param="sort" allLabel={SORTS.newest} label="الترتيب" options={[{ value: "balance", label: SORTS.balance }, { value: "ending", label: SORTS.ending }]} />
              </div>
            </>
          }
          footer={total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="متجر" />}
        >
          {stores.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="مفيش متاجر بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={Store} title="مفيش متاجر لسه" description="أول ما تاجر يسجّل ويعمل متجره هيظهر هنا." />
            )
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theadRow}>
                      <th className={cn(th, "ps-4")}>المتجر</th>
                      <th className={cn(th, "hidden lg:table-cell")}>المالك</th>
                      <th className={th}>الباقة</th>
                      <th className={th}>الاشتراك</th>
                      <th className={cn(th, "hidden xl:table-cell")}>النشاط</th>
                      <th className={cn(th, "text-left")}>الرصيد</th>
                      <th className={cn(th, "hidden pe-4 text-left lg:table-cell")}>اتعمل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stores.map((store) => (
                      <tr key={store.id} className="relative transition-colors hover:bg-muted/40">
                        <td className="py-3 ps-4">
                          <Link href={`${BASE_PATH}/${store.slug}`} className="font-medium after:absolute after:inset-0">
                            {store.name}
                          </Link>
                          <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                            {store.slug}
                          </p>
                        </td>
                        <td className="hidden max-w-56 py-3 lg:table-cell">
                          <p className="truncate">{store.user.name ?? "—"}</p>
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">
                            {store.user.email}
                          </p>
                        </td>
                        <td className="py-3">
                          <p>{store.plan?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{store.billingCycle === "YEARLY" ? "سنوي" : "شهري"}</p>
                        </td>
                        <td className="py-3">
                          <StatusPill tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusPill>
                          {store.subscriptionEndsAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {store.subscriptionEndsAt > now ? "ينتهي" : "انتهى"} {fmtRelative(store.subscriptionEndsAt, now)}
                            </p>
                          )}
                        </td>
                        <td className="hidden py-3 text-xs text-muted-foreground xl:table-cell">
                          {store._count.products} منتج · {store._count.orders} طلب
                        </td>
                        <td className="py-3 text-left font-medium tabular-nums">{fmtMoney(store.balance)}</td>
                        <td className="hidden py-3 pe-4 text-left text-muted-foreground lg:table-cell">{fmtDate(store.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border md:hidden">
                {stores.map((store) => (
                  <li key={store.id} className="relative px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`${BASE_PATH}/${store.slug}`} className="min-w-0 font-medium after:absolute after:inset-0">
                        <span className="block truncate">{store.name}</span>
                      </Link>
                      <span className="shrink-0 font-medium tabular-nums">{fmtMoney(store.balance)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {store.user.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusPill tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusPill>
                      <span>{store.plan?.name ?? "بدون باقة"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DataCard>
      </div>
    </div>
  );
}
