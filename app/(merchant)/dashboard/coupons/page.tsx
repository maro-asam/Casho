import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Plus, SearchX, Store, TicketPercent } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  hrefWith,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { COUPON_STATUSES, couponStatus, couponStatusWhere, isCouponStatus } from "@/lib/coupons/coupon-status";
import { readPopupConfig } from "@/lib/popups/popup-config";
import { prisma } from "@/lib/prisma";
import { UrlCouponDialog, type EditableCoupon } from "./_components/coupon-form-dialog";
import { CouponsTable, type CouponRow } from "./_components/coupons-table";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("أكواد الخصم"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/coupons";

type CouponsRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function CouponsRoute({ searchParams }: CouponsRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول وبعدها اعمل أكواد خصم لعملائك.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const q = readParam(params, "q")?.toUpperCase();
  const statusParam = readParam(params, "status");
  const status = isCouponStatus(statusParam) ? statusParam : undefined;
  const typeParam = readParam(params, "type");
  const type = typeParam === "PERCENTAGE" || typeParam === "FIXED" ? typeParam : undefined;
  const editId = readParam(params, "edit");
  const dialogMode = editId ? "edit" : readParam(params, "new") ? "new" : null;
  const now = new Date();
  const limitField = prisma.coupon.fields.usageLimit;

  const baseWhere: Prisma.CouponWhereInput = {
    storeId: store.id,
    ...(q && { code: { contains: q, mode: "insensitive" } }),
    ...(type && { type }),
  };

  // Tab counts share search + type with the list, so each number matches its tab.
  const [statusCounts, storeCouponCount, editRow] = await Promise.all([
    Promise.all(COUPON_STATUSES.map((s) => prisma.coupon.count({ where: { AND: [baseWhere, couponStatusWhere(s.value, now, limitField)] } }))),
    prisma.coupon.count({ where: { storeId: store.id } }),
    editId ? prisma.coupon.findFirst({ where: { id: editId, storeId: store.id } }) : Promise.resolve(null),
  ]);
  const countFor = (s: string) => statusCounts[COUPON_STATUSES.findIndex((x) => x.value === s)] ?? 0;
  const allCount = statusCounts.reduce((a, b) => a + b, 0);
  const total = status ? countFor(status) : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const coupons = await prisma.coupon.findMany({
    where: status ? { AND: [baseWhere, couponStatusWhere(status, now, limitField)] } : baseWhere,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // Real sales per code + popups that hand the code out.
  const codes = coupons.map((c) => c.code);
  const [revenueRows, popups] = await Promise.all([
    codes.length
      ? prisma.order.groupBy({
          by: ["couponCode"],
          where: { storeId: store.id, couponCode: { in: codes }, status: { not: "CANCELED" } },
          _sum: { total: true },
        })
      : Promise.resolve([]),
    (async () => prisma.storePopup.findMany({ where: { storeId: store.id, type: "discount" }, select: { name: true, config: true } }))().catch(
      () => [],
    ),
  ]);

  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minSubtotal: c.minSubtotal,
    maxDiscount: c.maxDiscount,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    status: couponStatus(c, now),
    revenue: revenueRows.find((r) => r.couponCode === c.code)?._sum.total ?? 0,
    popupNames: popups.filter((p) => readPopupConfig(p.config).content.couponCode === c.code).map((p) => p.name),
  }));

  const editing: EditableCoupon | null = editRow
    ? {
        id: editRow.id,
        code: editRow.code,
        type: editRow.type,
        value: editRow.value,
        minSubtotal: editRow.minSubtotal,
        maxDiscount: editRow.maxDiscount,
        usageLimit: editRow.usageLimit,
        usedCount: editRow.usedCount,
        startsAt: editRow.startsAt?.toISOString() ?? null,
        expiresAt: editRow.expiresAt?.toISOString() ?? null,
        isActive: editRow.isActive,
      }
    : null;

  const hasFilters = Boolean(q || status || type);
  const currentPage = readParam(params, "page");
  const newHref = hrefWith(BASE_PATH, params, { new: 1, edit: null, page: currentPage });
  const editHref = (id: string) => hrefWith(BASE_PATH, params, { edit: id, new: null, page: currentPage });
  const storeUrl = buildStoreUrl(store.slug);
  const shareUrl = (code: string) => `${storeUrl}/?coupon=${encodeURIComponent(code)}`;

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("أكواد الخصم")}
        description={tr("اعمل أكواد للعروض والمؤثرين وحملات الواتساب — وكل كود ليه لينك بيطبّقه لوحده في السلة.")}
        actions={
          storeCouponCount > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={newHref} scroll={false}>
                <Plus className="size-4" />
                {tr("كود جديد")}
              </Link>
            </Button>
          )
        }
      />

      {storeCouponCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={TicketPercent}
            title={tr("لسه معملتش أكواد خصم")}
            description={tr("ابدأ بكود ترحيب لأول طلب، أو كود لمؤثر وتابع هو جاب كام طلب ومبيعات قد إيه.")}
            action={
              <Button asChild size="sm" className="gap-1.5">
                <Link href={newHref} scroll={false}>
                  <Plus className="size-4" />
                  {tr("اعمل أول كود")}
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label={tr("حالة الكود")}
            param="status"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: tr("الكل"), count: allCount },
              ...COUPON_STATUSES.map((s) => ({ label: s.label, value: s.value, count: countFor(s.value) })),
            ]}
          />

          <DataCard
            toolbar={
              <>
                <SearchInput placeholder={tr("ابحث بالكود")} />
                <SelectFilter
                  label={tr("نوع الخصم")}
                  param="type"
                  allLabel={tr("كل الأنواع")}
                  options={[
                    { value: "PERCENTAGE", label: tr("نسبة مئوية") },
                    { value: "FIXED", label: tr("مبلغ ثابت") },
                  ]}
                />
              </>
            }
            footer={
              total > 0 ? (
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("كود")} />
              ) : undefined
            }
          >
            {rows.length > 0 ? (
              <CouponsTable coupons={rows} editHref={editHref} shareUrl={shareUrl} />
            ) : (
              <EmptyState
                icon={SearchX}
                title={tr("مفيش أكواد بالفلاتر دي")}
                description={q ? tr("مفيش كود فيه \"{0}\".", q) : tr("جرّب حالة أو نوع تاني.")}
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

      <UrlCouponDialog mode={dialogMode} coupon={editing} />
    </div>
  );
}
