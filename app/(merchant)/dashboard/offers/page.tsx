import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ChevronLeft, Plus, SearchX, Store, TrendingUp } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  SearchInput,
  Segmented,
  SelectFilter,
  Unavailable,
  appleButton,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { acceptRate, isOfferType } from "@/lib/offers/offer-pricing";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { OFFER_TYPE_META } from "./_components/offer-meta";
import { OffersTable, type OfferRow } from "./_components/offers-table";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("Upsell و Cross-sell"),
  };
}

const PAGE_SIZE = 20;
const BASE_PATH = "/offers";
const nf = lazyIntl.number({ maximumFractionDigits: 1 });
const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });

const newHref = (type: string) => `${BASE_PATH}/new?type=${encodeURIComponent(type)}`;
const editHref = (id: string) => `${BASE_PATH}/${id}/edit`;

const PRODUCT_SELECT = { id: true, name: true, image: true, price: true, isActive: true } as const;

export default async function OffersRoute({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });

  if (!store) {
    return (
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها اعمل عروض Upsell و Cross-sell.")} />
      </div>
    );
  }

  // ── Filters (all in the URL) ─────────────────────────────────────────
  const q = readParam(params, "q");
  const typeParam = readParam(params, "type");
  const type = isOfferType(typeParam) ? typeParam : undefined;
  const stateParam = readParam(params, "state");
  const state = stateParam === "active" || stateParam === "paused" ? stateParam : undefined;

  // Old dialog links (`?edit=<id>`, `?new=<TYPE>`) now open the full pages.
  const legacyEdit = readParam(params, "edit");
  if (legacyEdit) redirect(`${BASE_PATH}/${encodeURIComponent(legacyEdit)}/edit`);
  const legacyNew = readParam(params, "new");
  if (legacyNew) redirect(newHref(legacyNew));

  const baseWhere: Prisma.ProductOfferWhereInput = {
    storeId: store.id,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { offerProduct: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(state && { isActive: state === "active" }),
  };

  const [typeCounts, storeOfferCount, liveCount, funnel, storeSales] = await Promise.all([
    prisma.productOffer.groupBy({ by: ["type"], where: baseWhere, _count: { _all: true } }),
    prisma.productOffer.count({ where: { storeId: store.id } }),
    prisma.productOffer.count({ where: { storeId: store.id, isActive: true } }),
    prisma.productOffer.aggregate({ where: { storeId: store.id }, _sum: { views: true, accepts: true } }),
    prisma.$queryRaw<{ revenue: bigint | null; orders: bigint }[]>`
      SELECT SUM(oi."price" * oi."quantity")::bigint AS revenue, COUNT(DISTINCT oi."orderId")::bigint AS orders
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      JOIN "ProductOffer" po ON po."id" = oi."offerId"
      WHERE po."storeId" = ${store.id} AND o."status" <> 'CANCELED'`,
  ]);
  const countFor = (t: string) => typeCounts.find((c) => c.type === t)?._count._all ?? 0;
  const allCount = typeCounts.reduce((a, c) => a + c._count._all, 0);
  const total = type ? countFor(type) : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const offers = await prisma.productOffer.findMany({
    where: { ...baseWhere, ...(type && { type }) },
    orderBy: [{ isActive: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { offerProduct: { select: PRODUCT_SELECT } },
  });

  // Real sales per offer (non-canceled orders) + names of the trigger products.
  const ids = offers.map((o) => o.id);
  const triggerIds = [...new Set([...offers.flatMap((o) => o.triggerProductIds)])];
  const [salesRows, triggerProducts] = await Promise.all([
    ids.length
      ? prisma.$queryRaw<{ offerId: string; revenue: bigint; orders: bigint }[]>`
          SELECT oi."offerId", SUM(oi."price" * oi."quantity")::bigint AS revenue, COUNT(DISTINCT oi."orderId")::bigint AS orders
          FROM "OrderItem" oi
          JOIN "Order" o ON o."id" = oi."orderId"
          WHERE oi."offerId" IN (${Prisma.join(ids)}) AND o."status" <> 'CANCELED'
          GROUP BY oi."offerId"`
      : Promise.resolve([]),
    triggerIds.length
      ? prisma.product.findMany({ where: { id: { in: triggerIds }, storeId: store.id }, select: PRODUCT_SELECT })
      : Promise.resolve([]),
  ]);

  const rows: OfferRow[] = offers.map((o) => {
    const sales = salesRows.find((s) => s.offerId === o.id);
    return {
      id: o.id,
      type: o.type,
      name: o.name,
      isActive: o.isActive,
      discountType: o.discountType,
      discountValue: o.discountValue,
      views: o.views,
      accepts: o.accepts,
      revenue: Number(sales?.revenue ?? 0),
      orders: Number(sales?.orders ?? 0),
      offerProduct: o.offerProduct,
      triggers: o.triggerProductIds.flatMap((id) => triggerProducts.find((p) => p.id === id) ?? []),
    };
  });

  const hasFilters = Boolean(q || type || state);

  const views = funnel._sum.views ?? 0;
  const accepts = funnel._sum.accepts ?? 0;
  const sales = storeSales[0];
  const stats = [
    { label: tr("عروض شغّالة"), value: nf.format(liveCount), hint: tr("من {0} عرض", nf.format(storeOfferCount)) },
    {
      label: tr("نسبة القبول"),
      value: tr("{0}٪", nf.format(acceptRate(views, accepts))),
      hint: tr("{0} وافقوا من {1} شافوا العرض", nf.format(accepts), nf.format(views)),
    },
    {
      label: tr("مبيعات من العروض"),
      value: money.format(Number(sales?.revenue ?? 0) / 100),
      hint: tr("في {0} طلب", nf.format(Number(sales?.orders ?? 0))),
    },
  ];

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("Upsell و Cross-sell")}
        subtitle={tr("زوّد متوسط قيمة الطلب: اعرض ترقية، أو منتج مكمّل، أو بديل أوفر في اللحظة اللي العميل بيضيف فيها للسلة.")}
        actions={
          storeOfferCount > 0 && (
            <Link href={newHref(type ?? "CROSS_SELL")} className={appleButton.filled}>
              <Plus className="size-4" />
              {tr("عرض جديد")}
            </Link>
          )
        }
      />

      {storeOfferCount === 0 ? (
        <section className="space-y-2">
          <div className="apple-card overflow-hidden">
            <Unavailable
              icon={TrendingUp}
              title={tr("ابدأ بأول عرض")}
              description={tr("العرض بيظهر للعميل أول ما يضيف منتج للسلة — ولو وافق، السعر المخفّض بيتحسب في السلة والطلب تلقائي.")}
              className="pb-8"
            />
            <ul className="apple-rows border-t-[0.5px] border-border [--row-inset:72px]">
              {OFFER_TYPE_META.map((m) => (
                <li key={m.value}>
                  <Link
                    href={newHref(m.value)}
                   
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-(--fill-3)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-[9px] text-white", m.glyph)}>
                      <m.icon className="size-[18px]" strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{m.label}</span>
                      <span className="block text-[13px] leading-[18px] text-muted-foreground">{m.description}</span>
                    </span>
                    <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="px-5 text-[13px] text-muted-foreground">{tr("اختار نوع وابدأ — تقدر تغيّره بعدين من داخل العرض.")}</p>
        </section>
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
              label={tr("نوع العرض")}
              param="type"
              basePath={BASE_PATH}
              searchParams={params}
              segments={[
                { label: tr("الكل"), count: allCount },
                ...OFFER_TYPE_META.map((m) => ({ label: m.title, value: m.value, count: countFor(m.value) })),
              ]}
            />

            <section className="apple-card overflow-hidden">
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:px-5">
                <SearchInput
                  placeholder={tr("ابحث باسم العرض أو المنتج")}
                  className="sm:max-w-sm sm:flex-1"
                  inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
                />
                <div className="flex gap-2 sm:ms-auto">
                  <SelectFilter
                    label={tr("الحالة")}
                    param="state"
                    allLabel={tr("كل الحالات")}
                    className="h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-40"
                    options={[
                      { value: "active", label: tr("شغّال") },
                      { value: "paused", label: tr("متوقف") },
                    ]}
                  />
                </div>
              </div>

              {rows.length > 0 ? (
                <OffersTable offers={rows} editHref={editHref} />
              ) : (
                <Unavailable
                  icon={SearchX}
                  title={tr("مفيش عروض بالفلاتر دي")}
                  description={q ? tr("مفيش عرض فيه \"{0}\".", q) : tr("جرّب نوع أو حالة تانية.")}
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
                  <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("عرض")} />
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
