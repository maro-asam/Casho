import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { BadgeCheck, MessageSquareText, Plus, SearchX, Store } from "lucide-react";

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
import { prisma } from "@/lib/prisma";
import { UrlReviewDialog, type EditableReview } from "./_components/review-form-dialog";
import { ReviewsTable, type ReviewRow } from "./_components/reviews-table";
import { Stars } from "./_components/stars";
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
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول عشان تتابع آراء عملائك.")} />
      </div>
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

  const [products, reviewedProducts, summary, distribution, verifiedCount] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.productReview.groupBy({ by: ["productId"], where: { storeId: store.id }, _count: { _all: true } }),
    prisma.productReview.aggregate({ where: { storeId: store.id }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.productReview.groupBy({ by: ["rating"], where: { storeId: store.id }, _count: { _all: true } }),
    prisma.productReview.count({ where: { storeId: store.id, verifiedPurchase: true } }),
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

  const average = summary._avg.rating ?? 0;
  const storeCountFor = (r: number) => distribution.find((d) => d.rating === r)?._count._all ?? 0;
  const pct = lazyIntl.number({ style: "percent", maximumFractionDigits: 0 });
  const filterClass = "h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-44";

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("المراجعات")}
        subtitle={tr("آراء عملائك على المنتجات — بتظهر في صفحة كل منتج وبتزوّد الثقة.")}
        actions={
          storeReviewCount > 0 &&
          products.length > 0 && (
            <Link href={newHref} scroll={false} className={appleButton.filled}>
              <Plus className="size-4" />
              {tr("إضافة مراجعة")}
            </Link>
          )
        }
      />

      {storeReviewCount === 0 ? (
        <div className="apple-card">
          <Unavailable
            icon={MessageSquareText}
            title={tr("لسه مفيش مراجعات")}
            description={
              products.length
                ? tr("لو عميل بعتلك رأيه على الواتساب أو الإنستجرام، سجّله هنا — ولو ربطته بطلبه هيظهر بعلامة \"مشتري موثق\".")
                : tr("ضيف منتجاتك الأول، وبعدها تقدر تسجّل آراء العملاء عليها.")
            }
            action={
              products.length ? (
                <Link href={newHref} scroll={false} className={appleButton.filled}>
                  <Plus className="size-4" />
                  {tr("ضيف أول مراجعة")}
                </Link>
              ) : (
                <Link href="/products/new" className={appleButton.tinted}>
                  {tr("ضيف منتج")}
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* Ratings & Reviews — App Store summary. */}
          <section className="apple-card grid gap-6 p-6 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10" aria-label={tr("ملخص التقييمات")}>
            <div className="flex flex-col items-center justify-center text-center md:items-start md:text-start">
              <p className="text-[64px] leading-none font-bold tabular-nums ltr:tracking-[-0.03em]">{avgFormat.format(average)}</p>
              <p className="mt-1 text-[15px] font-semibold text-muted-foreground">{tr("من ٥")}</p>
              <Stars rating={average} size="md" className="mt-2" />
            </div>
            <div className="min-w-0 space-y-3">
              <ul className="space-y-1.5" aria-label={tr("توزيع التقييمات")}>
                {RATINGS.map((r) => {
                  const count = storeCountFor(r);
                  const share = storeReviewCount ? count / storeReviewCount : 0;
                  return (
                    <li key={r}>
                      <Link
                        href={hrefWith(BASE_PATH, params, { rating: r, page: null })}
                        scroll={false}
                        className="group flex items-center gap-3 rounded-full"
                        aria-label={tr("{0} نجوم: {1} مراجعة", r, nf.format(count))}
                      >
                        <span className="flex w-16 shrink-0 justify-end" dir="ltr">
                          <Stars rating={r} className="[&>svg]:size-2.5" />
                        </span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--fill-3)">
                          <span
                            className="block h-full rounded-full bg-foreground/70 transition-colors group-hover:bg-(--sys-orange)"
                            style={{ width: `${Math.max(share * 100, count ? 2 : 0)}%` }}
                          />
                        </span>
                        <span className="w-10 shrink-0 text-end text-[12px] text-muted-foreground tabular-nums">{nf.format(count)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                <span>{tr("{0} مراجعة على {1} منتج", nf.format(storeReviewCount), nf.format(reviewedProducts.length))}</span>
                <span className="inline-flex items-center gap-1">
                  <BadgeCheck className="size-3.5 text-(--sys-green)" />
                  {tr("{0} من مشترين موثقين", pct.format(verifiedCount / storeReviewCount))}
                </span>
              </p>
            </div>
          </section>

          <div className="space-y-4">
            <Segmented
              label={tr("التقييم")}
              param="rating"
              basePath={BASE_PATH}
              searchParams={params}
              segments={[{ label: tr("الكل"), count: allCount }, ...RATINGS.map((r) => ({ label: `${nf.format(r)} ★`, value: String(r), count: countFor(r) }))]}
            />

            <section className="apple-card overflow-hidden">
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:px-5">
                <SearchInput
                  placeholder={tr("ابحث باسم العميل أو المنتج أو كلام المراجعة")}
                  className="sm:max-w-sm sm:flex-1"
                  inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
                />
                <div className="flex gap-2 sm:ms-auto">
                  <SelectFilter
                    label={tr("المنتج")}
                    param="product"
                    allLabel={tr("كل المنتجات")}
                    className={filterClass}
                    options={reviewedNames.map((p) => ({ value: p.id, label: p.name }))}
                  />
                  <SelectFilter
                    label={tr("التوثيق")}
                    param="verified"
                    allLabel={tr("الكل")}
                    className={filterClass}
                    options={[
                      { value: "yes", label: tr("مشتري موثق") },
                      { value: "no", label: tr("غير موثق") },
                    ]}
                  />
                </div>
              </div>

              {rows.length > 0 ? (
                <div className="border-t-[0.5px] border-border">
                  <ReviewsTable reviews={rows} storeSlug={store.slug} editHref={editHref} />
                </div>
              ) : (
                <Unavailable
                  icon={SearchX}
                  title={tr("مفيش مراجعات بالفلاتر دي")}
                  description={q ? tr("مفيش نتايج لـ \"{0}\". جرّب كلمة تانية.", q) : tr("جرّب تقييم أو منتج تاني.")}
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
                  <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("مراجعة")} />
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <UrlReviewDialog mode={dialogMode} review={editing} products={products} defaultProductId={product} />
    </div>
  );
}
