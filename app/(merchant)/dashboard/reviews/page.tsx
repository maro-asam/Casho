import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { MessageSquareText, Plus, SearchX, Star, Store } from "lucide-react";

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
import { prisma } from "@/lib/prisma";
import { UrlReviewDialog, type EditableReview } from "./_components/review-form-dialog";
import { ReviewsTable, type ReviewRow } from "./_components/reviews-table";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("المراجعات"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/reviews";
const RATINGS = [5, 4, 3, 2, 1] as const;
const nf = lazyIntl.number();
const avgFormat = lazyIntl.number({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
const cairoDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(d);

type ReviewsRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function ReviewsRoute({ searchParams }: ReviewsRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول عشان تتابع آراء عملائك.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const q = readParam(params, "q");
  const ratingParam = Number(readParam(params, "rating"));
  const rating = RATINGS.includes(ratingParam as (typeof RATINGS)[number]) ? ratingParam : undefined;
  const verifiedParam = readParam(params, "verified");
  const verified = verifiedParam === "yes" ? true : verifiedParam === "no" ? false : undefined;
  const productParam = readParam(params, "product");
  const editId = readParam(params, "edit");
  const dialogMode = editId ? "edit" : readParam(params, "new") ? "new" : null;

  const [products, reviewedProducts, summary] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.productReview.groupBy({ by: ["productId"], where: { storeId: store.id }, _count: { _all: true } }),
    prisma.productReview.aggregate({ where: { storeId: store.id }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const product = productParam && products.some((p) => p.id === productParam) ? productParam : undefined;

  const baseWhere: Prisma.ProductReviewWhereInput = {
    storeId: store.id,
    ...(product && { productId: product }),
    ...(verified !== undefined && { verifiedPurchase: verified }),
    ...(q && {
      OR: [
        { customerName: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  // Tab counts share search + facets with the list, so each number matches its tab.
  const [ratingCounts, editRow] = await Promise.all([
    prisma.productReview.groupBy({ by: ["rating"], where: baseWhere, _count: { _all: true } }),
    editId
      ? prisma.productReview.findFirst({
          where: { id: editId, storeId: store.id },
          select: {
            id: true,
            productId: true,
            customerName: true,
            customerAvatar: true,
            rating: true,
            title: true,
            content: true,
            verifiedPurchase: true,
            reviewDate: true,
            product: { select: { name: true } },
          },
        })
      : Promise.resolve(null),
  ]);
  const countFor = (r: number) => ratingCounts.find((c) => c.rating === r)?._count._all ?? 0;
  const allCount = ratingCounts.reduce((s, c) => s + c._count._all, 0);
  const total = rating ? countFor(rating) : allCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const reviews = await prisma.productReview.findMany({
    where: { ...baseWhere, ...(rating && { rating }) },
    orderBy: [{ reviewDate: "desc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      customerName: true,
      rating: true,
      title: true,
      content: true,
      verifiedPurchase: true,
      reviewDate: true,
      product: { select: { id: true, name: true, slug: true, image: true } },
    },
  });

  const rows: ReviewRow[] = reviews;
  const storeReviewCount = summary._count._all;
  const hasFilters = Boolean(q || rating || verified !== undefined || product);
  const currentPage = readParam(params, "page");
  const newHref = hrefWith(BASE_PATH, params, { new: 1, edit: null, page: currentPage });
  const editHref = (id: string) => hrefWith(BASE_PATH, params, { edit: id, new: null, page: currentPage });

  const editing: EditableReview | null = editRow
    ? {
        id: editRow.id,
        productId: editRow.productId,
        productName: editRow.product.name,
        customerName: editRow.customerName,
        customerAvatar: editRow.customerAvatar,
        rating: editRow.rating,
        title: editRow.title,
        content: editRow.content,
        verifiedPurchase: editRow.verifiedPurchase,
        reviewDate: cairoDay(editRow.reviewDate),
      }
    : null;

  const reviewedNames = products.filter((p) => reviewedProducts.some((r) => r.productId === p.id));

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("المراجعات")}
        description={
          storeReviewCount > 0 ? (
            <span className="inline-flex flex-wrap items-center gap-x-1.5">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground tabular-nums">{avgFormat.format(summary._avg.rating ?? 0)}</span>
              {tr("متوسط من {0} مراجعة على {1} منتج", nf.format(storeReviewCount), nf.format(reviewedProducts.length))}
            </span>
          ) : (
            tr("آراء عملائك على المنتجات — بتظهر في صفحة كل منتج وبتزوّد الثقة.")
          )
        }
        actions={
          storeReviewCount > 0 &&
          products.length > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={newHref} scroll={false}>
                <Plus className="size-4" />
                {tr("إضافة مراجعة")}
              </Link>
            </Button>
          )
        }
      />

      {storeReviewCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={MessageSquareText}
            title={tr("لسه مفيش مراجعات")}
            description={
              products.length
                ? tr("لو عميل بعتلك رأيه على الواتساب أو الإنستجرام، سجّله هنا — ولو ربطته بطلبه هيظهر بعلامة \"مشتري موثق\".")
                : tr("ضيف منتجاتك الأول، وبعدها تقدر تسجّل آراء العملاء عليها.")
            }
            action={
              products.length ? (
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={newHref} scroll={false}>
                    <Plus className="size-4" />
                    {tr("ضيف أول مراجعة")}
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/products/new">{tr("ضيف منتج")}</Link>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label={tr("التقييم")}
            param="rating"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: tr("الكل"), count: allCount },
              ...RATINGS.map((r) => ({ label: `${nf.format(r)} ★`, value: String(r), count: countFor(r) })),
            ]}
          />

          <DataCard
            toolbar={
              <>
                <SearchInput placeholder={tr("ابحث باسم العميل أو المنتج أو كلام المراجعة")} />
                <div className="flex gap-2">
                  <SelectFilter
                    label={tr("المنتج")}
                    param="product"
                    allLabel={tr("كل المنتجات")}
                    options={reviewedNames.map((p) => ({ value: p.id, label: p.name }))}
                  />
                  <SelectFilter
                    label={tr("التوثيق")}
                    param="verified"
                    allLabel={tr("الكل")}
                    className="sm:w-36"
                    options={[
                      { value: "yes", label: tr("مشتري موثق") },
                      { value: "no", label: tr("غير موثق") },
                    ]}
                  />
                </div>
              </>
            }
            footer={
              total > 0 ? (
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("مراجعة")} />
              ) : undefined
            }
          >
            {rows.length > 0 ? (
              <ReviewsTable reviews={rows} storeSlug={store.slug} editHref={editHref} />
            ) : (
              <EmptyState
                icon={SearchX}
                title={tr("مفيش مراجعات بالفلاتر دي")}
                description={q ? tr("مفيش نتايج لـ \"{0}\". جرّب كلمة تانية.", q) : tr("جرّب تقييم أو منتج تاني.")}
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

      <UrlReviewDialog mode={dialogMode} review={editing} products={products} defaultProductId={product} />
    </div>
  );
}
