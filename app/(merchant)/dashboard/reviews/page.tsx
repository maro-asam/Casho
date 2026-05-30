import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  MessageSquare,
  Package,
  Star,
  Store,
  TriangleAlert,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import ReviewsTable from "./_components/ReviewsTable";
import ReviewFilters from "./_components/ReviewFilters";
import ReviewFormDialog from "./_components/ReviewFormDialog";

export const metadata: Metadata = {
  title: "المراجعات",
  description: "إدارة مراجعات وتقييمات عملاء منتجات متجرك",
};

const PAGE_SIZE = 15;

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  variant: "default" | "success" | "warning" | "amber";
};

function StatCard({ icon: Icon, label, value, variant }: StatCardProps) {
  const cls = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    warning: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  }[variant];

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cls}`}>
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type ReviewsRouteProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    product?: string;
    rating?: string;
  }>;
};

export default async function ReviewsRoute({ searchParams }: ReviewsRouteProps) {
  const userId = await requireUserId();
  const resolved = await searchParams;

  const currentPage = Math.max(Number(resolved?.page || "1"), 1);
  const q = resolved?.q?.trim() ?? "";
  const productFilter = resolved?.product?.trim() ?? "";
  const ratingFilter = resolved?.rating?.trim() ?? "";

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Store className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولاً حتى تتمكن من إدارة المراجعات.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [totalReviews, productsWithReviews, products] = await Promise.all([
    prisma.productReview.count({ where: { storeId: store.id } }),
    prisma.productReview.groupBy({
      by: ["productId"],
      where: { storeId: store.id },
      _count: true,
      _avg: { rating: true },
    }),
    prisma.product.findMany({
      where: { storeId: store.id, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const avgRating =
    productsWithReviews.length > 0
      ? productsWithReviews.reduce((sum, p) => sum + (p._avg.rating ?? 0), 0) /
        productsWithReviews.length
      : 0;

  const fiveStarCount = await prisma.productReview.count({
    where: { storeId: store.id, rating: 5 },
  });
  const fiveStarPct = totalReviews > 0
    ? Math.round((fiveStarCount / totalReviews) * 100)
    : 0;

  const where = {
    storeId: store.id,
    ...(productFilter ? { productId: productFilter } : {}),
    ...(ratingFilter ? { rating: Number(ratingFilter) } : {}),
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const filteredTotal = await prisma.productReview.count({ where });
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const skip = (safePage - 1) * PAGE_SIZE;

  const reviews = await prisma.productReview.findMany({
    where,
    orderBy: { reviewDate: "desc" },
    skip,
    take: PAGE_SIZE,
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
      product: { select: { id: true, name: true } },
    },
  });

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (productFilter) params.set("product", productFilter);
    if (ratingFilter) params.set("rating", ratingFilter);
    params.set("page", String(page));
    return `/dashboard/reviews?${params.toString()}`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardSectionHeader
          icon={Star}
          title="المراجعات"
          badge={totalReviews}
          description={
            <>
              إدارة مراجعات متجر{" "}
              <span className="font-semibold text-foreground">{store.name}</span>
            </>
          }
        />
        <ReviewFormDialog mode="create" products={products} />
      </div>

      {/* Stats */}
      {totalReviews > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={MessageSquare}
            label="إجمالي المراجعات"
            value={totalReviews}
            variant="default"
          />
          <StatCard
            icon={Star}
            label="متوسط التقييم"
            value={avgRating.toFixed(1)}
            variant="amber"
          />
          <StatCard
            icon={Package}
            label="منتجات بمراجعات"
            value={productsWithReviews.length}
            variant="success"
          />
          <StatCard
            icon={TriangleAlert}
            label="نسبة 5 نجوم"
            value={`${fiveStarPct}%`}
            variant={fiveStarPct > 80 ? "warning" : "default"}
          />
        </div>
      )}

      {/* High 5-star warning */}
      {totalReviews >= 3 && fiveStarPct > 80 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              تحذير: نسبة عالية من تقييمات 5 نجوم ({fiveStarPct}%)
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
              قد تبدو المراجعات غير طبيعية للعملاء. يُنصح بتنويع التقييمات لتحقيق مصداقية أعلى.
            </p>
          </div>
        </div>
      )}

      {/* Empty state — no products */}
      {products.length === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <Package className="size-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">لا توجد منتجات بعد</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إضافة منتجات أولاً حتى تتمكن من إضافة مراجعات عليها.
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link href="/dashboard/products/new">إضافة منتج</Link>
            </Button>
          </CardContent>
        </Card>
      ) : totalReviews === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-90 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <Star className="size-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">لا توجد مراجعات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة مراجعات على منتجاتك لتعزيز ثقة العملاء وزيادة المبيعات.
            </p>
            <div className="mt-6">
              <ReviewFormDialog mode="create" products={products} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Suspense
            fallback={<div className="h-10 animate-pulse rounded-xl bg-muted" />}
          >
            <ReviewFilters products={products} />
          </Suspense>

          {reviews.length === 0 ? (
            <Card className="rounded-xl border-dashed">
              <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <FolderOpen className="size-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">لا توجد نتائج</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  جرب تغيير الفلاتر أو كلمة البحث
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <ReviewsTable reviews={reviews} products={products} />

              {totalPages > 1 && (
                <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    عرض{" "}
                    <span className="font-medium text-foreground">
                      {skip + 1}–{Math.min(skip + PAGE_SIZE, filteredTotal)}
                    </span>{" "}
                    من{" "}
                    <span className="font-medium text-foreground">
                      {filteredTotal}
                    </span>{" "}
                    مراجعة
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={safePage <= 1}
                    >
                      <Link
                        href={buildPageUrl(safePage - 1)}
                        aria-disabled={safePage <= 1}
                        className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
                      >
                        <ChevronRight className="me-1 size-4" />
                        السابق
                      </Link>
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                        const page = i + 1;
                        const isActive = page === safePage;
                        return (
                          <Button
                            key={page}
                            asChild
                            variant={isActive ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8 rounded-lg text-xs"
                          >
                            <Link href={buildPageUrl(page)}>{page}</Link>
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={safePage >= totalPages}
                    >
                      <Link
                        href={buildPageUrl(safePage + 1)}
                        aria-disabled={safePage >= totalPages}
                        className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      >
                        التالي
                        <ChevronLeft className="ms-1 size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
