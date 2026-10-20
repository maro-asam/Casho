import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Plus, SearchX, Store, TicketPercent } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  SearchInput,
  Segmented,
  SelectFilter,
  Unavailable,
  appleButton,
  hrefWith,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { COUPON_STATUSES, couponStatus, couponStatusWhere, isCouponStatus } from "@/lib/coupons/coupon-status";
import { readPopupConfig } from "@/lib/popups/popup-config";
import { prisma } from "@/lib/prisma";
import { UrlCouponDialog, type EditableCoupon } from "./_components/coupon-form-dialog";
import { CouponsTable, type CouponRow } from "./_components/coupons-table";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("أكواد الخصم"),
  };
}

const PAGE_SIZE = 20;
const BASE_PATH = "/coupons";
const nf = lazyIntl.number();
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });

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
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها اعمل أكواد خصم لعملائك.")} />
      </div>
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
  const [statusCounts, storeCouponCount, editRow, liveCount, usage, couponSales] = await Promise.all([
    Promise.all(COUPON_STATUSES.map((s) => prisma.coupon.count({ where: { AND: [baseWhere, couponStatusWhere(s.value, now, limitField)] } }))),
    prisma.coupon.count({ where: { storeId: store.id } }),
    editId ? prisma.coupon.findFirst({ where: { id: editId, storeId: store.id } }) : Promise.resolve(null),
    prisma.coupon.count({ where: { AND: [{ storeId: store.id }, couponStatusWhere("active", now, limitField)] } }),
    prisma.coupon.aggregate({ where: { storeId: store.id }, _sum: { usedCount: true } }),
    prisma.order.aggregate({
      where: { storeId: store.id, couponCode: { not: null }, status: { not: "CANCELED" } },
      _sum: { total: true },
      _count: { _all: true },
    }),
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

  const filterClass = "h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-40";
  const stats = [
    { label: tr("أكواد شغّالة"), value: nf.format(liveCount), hint: tr("من {0} كود", nf.format(storeCouponCount)) },
    { label: tr("مرات الاستخدام"), value: nf.format(usage._sum.usedCount ?? 0), hint: tr("على كل الأكواد") },
    {
      label: tr("مبيعات بالأكواد"),
      value: money.format((couponSales._sum.total ?? 0) / 100),
      hint: tr("{0} طلب استخدم كود", nf.format(couponSales._count._all)),
    },
  ];

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("أكواد الخصم")}
        subtitle={tr("اعمل أكواد للعروض والمؤثرين وحملات الواتساب — وكل كود ليه لينك بيطبّقه لوحده في السلة.")}
        actions={
          storeCouponCount > 0 && (
            <Link href={newHref} scroll={false} className={appleButton.filled}>
              <Plus className="size-4" />
              {tr("كود جديد")}
            </Link>
          )
        }
      />

      {storeCouponCount === 0 ? (
        <div className="apple-card">
          <Unavailable
            icon={TicketPercent}
            title={tr("لسه معملتش أكواد خصم")}
            description={tr("ابدأ بكود ترحيب لأول طلب، أو كود لمؤثر وتابع هو جاب كام طلب ومبيعات قد إيه.")}
            action={
              <Link href={newHref} scroll={false} className={appleButton.filled}>
                <Plus className="size-4" />
                {tr("اعمل أول كود")}
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[22px] bg-border/60 sm:grid-cols-3">
            {stats.map((m) => (
              <div key={m.label} className="flex flex-col bg-card px-5 py-4">
                <dt className="text-[13px] text-muted-foreground">{m.label}</dt>
                <dd className="mt-0.5 text-[28px] leading-[34px] font-bold tabular-nums">{m.value}</dd>
                <dd className="text-[12px] text-muted-foreground">{m.hint}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-4">
            <Segmented
              label={tr("حالة الكود")}
              param="status"
              basePath={BASE_PATH}
              searchParams={params}
              segments={[{ label: tr("الكل"), count: allCount }, ...COUPON_STATUSES.map((s) => ({ label: s.label, value: s.value, count: countFor(s.value) }))]}
            />

            <section className="apple-card overflow-hidden">
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:px-5">
                <SearchInput
                  placeholder={tr("ابحث بالكود")}
                  className="sm:max-w-sm sm:flex-1"
                  inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
                />
                <div className="flex gap-2 sm:ms-auto">
                  <SelectFilter
                    label={tr("نوع الخصم")}
                    param="type"
                    allLabel={tr("كل الأنواع")}
                    className={filterClass}
                    options={[
                      { value: "PERCENTAGE", label: tr("نسبة مئوية") },
                      { value: "FIXED", label: tr("مبلغ ثابت") },
                    ]}
                  />
                </div>
              </div>

              {rows.length > 0 ? (
                <div className="border-t-[0.5px] border-border">
                  <CouponsTable coupons={rows} editHref={editHref} shareUrl={shareUrl} />
                </div>
              ) : (
                <Unavailable
                  icon={SearchX}
                  title={tr("مفيش أكواد بالفلاتر دي")}
                  description={q ? tr("مفيش كود فيه \"{0}\".", q) : tr("جرّب حالة أو نوع تاني.")}
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
                  <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("كود")} />
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <UrlCouponDialog mode={dialogMode} coupon={editing} />
    </div>
  );
}
