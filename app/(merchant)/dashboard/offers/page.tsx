import Link from "next/link";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { ArrowUpRight, Plus, SearchX, Store } from "lucide-react";

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
import { isOfferType } from "@/lib/offers/offer-pricing";
import { prisma } from "@/lib/prisma";
import { OFFER_TYPE_META } from "./_components/offer-meta";
import { UrlOfferDialog, type EditableOffer } from "./_components/offer-form-dialog";
import { OffersTable, type OfferRow } from "./_components/offers-table";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("Upsell و Cross-sell"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/offers";

const PRODUCT_SELECT = { id: true, name: true, image: true, price: true, isActive: true } as const;

export default async function OffersRoute({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول وبعدها اعمل عروض Upsell و Cross-sell.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  // ── Filters (all in the URL) ─────────────────────────────────────────
  const q = readParam(params, "q");
  const typeParam = readParam(params, "type");
  const type = isOfferType(typeParam) ? typeParam : undefined;
  const stateParam = readParam(params, "state");
  const state = stateParam === "active" || stateParam === "paused" ? stateParam : undefined;
  const editId = readParam(params, "edit");
  const newType = readParam(params, "new");
  const dialogMode = editId ? "edit" : newType ? "new" : null;

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

  const [typeCounts, storeOfferCount, editRow] = await Promise.all([
    prisma.productOffer.groupBy({ by: ["type"], where: baseWhere, _count: { _all: true } }),
    prisma.productOffer.count({ where: { storeId: store.id } }),
    editId
      ? prisma.productOffer.findFirst({ where: { id: editId, storeId: store.id }, include: { offerProduct: { select: PRODUCT_SELECT } } })
      : Promise.resolve(null),
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
  const triggerIds = [...new Set([...offers.flatMap((o) => o.triggerProductIds), ...(editRow?.triggerProductIds ?? [])])];
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

  const editing: EditableOffer | null = editRow
    ? {
        id: editRow.id,
        type: editRow.type,
        name: editRow.name,
        headline: editRow.headline,
        isActive: editRow.isActive,
        priority: editRow.priority,
        discountType: editRow.discountType,
        discountValue: editRow.discountValue,
        offerProduct: editRow.offerProduct,
        triggers: editRow.triggerProductIds.flatMap((id) => triggerProducts.find((p) => p.id === id) ?? []),
      }
    : null;

  const hasFilters = Boolean(q || type || state);
  const currentPage = readParam(params, "page");
  const newHref = (t: string) => hrefWith(BASE_PATH, params, { new: t, edit: null, page: currentPage });
  const editHref = (id: string) => hrefWith(BASE_PATH, params, { edit: id, new: null, page: currentPage });

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("Upsell و Cross-sell")}
        description={tr("زوّد متوسط قيمة الطلب: اعرض ترقية، أو منتج مكمّل، أو بديل أوفر في اللحظة اللي العميل بيضيف فيها للسلة.")}
        actions={
          storeOfferCount > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={newHref(type ?? "CROSS_SELL")} scroll={false}>
                <Plus className="size-4" />
                {tr("عرض جديد")}
              </Link>
            </Button>
          )
        }
      />

      {storeOfferCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold">{tr("ابدأ بأول عرض")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr("العرض بيظهر للعميل أول ما يضيف منتج للسلة — ولو وافق، السعر المخفّض بيتحسب في السلة والطلب تلقائي.")}
            </p>
          </div>
          <ul className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-3">
            {OFFER_TYPE_META.map((m) => (
              <li key={m.value}>
                <Link
                  href={newHref(m.value)}
                  scroll={false}
                  className="group flex h-full flex-col rounded-lg border border-border bg-card p-4 text-start transition-colors hover:border-primary"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{m.label}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </span>
                  <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{m.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label={tr("نوع العرض")}
            param="type"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: tr("الكل"), count: allCount },
              ...OFFER_TYPE_META.map((m) => ({ label: m.short, value: m.value, count: countFor(m.value) })),
            ]}
          />

          <DataCard
            toolbar={
              <>
                <SearchInput placeholder={tr("ابحث باسم العرض أو المنتج")} />
                <SelectFilter
                  label={tr("الحالة")}
                  param="state"
                  allLabel={tr("كل الحالات")}
                  options={[
                    { value: "active", label: tr("شغّال") },
                    { value: "paused", label: tr("متوقف") },
                  ]}
                />
              </>
            }
            footer={
              total > 0 ? (
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("عرض")} />
              ) : undefined
            }
          >
            {rows.length > 0 ? (
              <OffersTable offers={rows} editHref={editHref} />
            ) : (
              <EmptyState
                icon={SearchX}
                title={tr("مفيش عروض بالفلاتر دي")}
                description={q ? tr("مفيش عرض فيه \"{0}\".", q) : tr("جرّب نوع أو حالة تانية.")}
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

      <UrlOfferDialog mode={dialogMode} newType={isOfferType(newType) ? newType : "CROSS_SELL"} offer={editing} />
    </div>
  );
}
