import Link from "next/link";
import { Suspense } from "react";
import { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Package,
  Plus,
  Star,
  Store,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import ProductsTable from "./_components/ProductsTable";
import ProductFilters from "./_components/ProductFilters";

export const metadata: Metadata = {
  title: "المنتجات",
  description: "إدارة منتجات المتجر وعرضها وتعديلها وحذفها",
};

const PAGE_SIZE = 12;

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: "default" | "success" | "warning";
};

function StatCard({ icon: Icon, label, value, variant }: StatCardProps) {
  const iconClass = {
    default: "bg-muted text-muted-foreground",
    success:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    warning:
      "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  }[variant];

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type MerchantProductsRouteProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    category?: string;
    status?: string;
  }>;
};

const MerchantProductsRoute = async ({
  searchParams,
}: MerchantProductsRouteProps) => {
  const userId = await requireUserId();
  const resolved = await searchParams;

  const currentPage = Math.max(Number(resolved?.page || "1"), 1);
  const q = resolved?.q?.trim() ?? "";
  const categoryFilter = resolved?.category?.trim() ?? "";
  const statusFilter = resolved?.status ?? "";

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
              يجب إنشاء متجر أولًا حتى تتمكن من إدارة المنتجات وإضافتها.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [totalProducts, activeCount, outOfStockCount, featuredCount, categories] =
    await Promise.all([
      prisma.product.count({ where: { storeId: store.id } }),
      prisma.product.count({ where: { storeId: store.id, isActive: true } }),
      prisma.product.count({
        where: { storeId: store.id, stock: 0, isActive: true },
      }),
      prisma.product.count({ where: { storeId: store.id, isFeatured: true } }),
      prisma.category.findMany({
        where: { storeId: store.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const where = {
    storeId: store.id,
    ...(q && { name: { contains: q, mode: "insensitive" as const } }),
    ...(categoryFilter && { categoryId: categoryFilter }),
    ...(statusFilter === "active"
      ? { isActive: true }
      : statusFilter === "inactive"
        ? { isActive: false }
        : {}),
  };

  const filteredTotal = await prisma.product.count({ where });
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const skip = (safePage - 1) * PAGE_SIZE;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      image: true,
      isActive: true,
      isFeatured: true,
      category: { select: { name: true } },
    },
  });

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    return `/dashboard/products?${params.toString()}`;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Package}
        title="المنتجات"
        badge={totalProducts}
        description={
          <>
            إدارة منتجات متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
        actionLabel="إضافة منتج"
        actionHref="/products/new"
      />

      {totalProducts > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Package}
            label="إجمالي المنتجات"
            value={totalProducts}
            variant="default"
          />
          <StatCard
            icon={CheckCircle2}
            label="منتجات نشطة"
            value={activeCount}
            variant="success"
          />
          <StatCard
            icon={AlertTriangle}
            label="نفاد المخزون"
            value={outOfStockCount}
            variant={outOfStockCount > 0 ? "warning" : "default"}
          />
          <StatCard
            icon={Star}
            label="منتجات مميزة"
            value={featuredCount}
            variant="default"
          />
        </div>
      )}

      {totalProducts === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-90 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">لا توجد منتجات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة أول منتج داخل متجرك ليظهر للعملاء وتبدأ في إدارة
              منتجاتك بشكل أفضل.
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link href="/products/new">
                <Plus className="ms-2 size-4" />
                إضافة أول منتج
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Suspense
            fallback={
              <div className="h-10 animate-pulse rounded-xl bg-muted" />
            }
          >
            <ProductFilters categories={categories} />
          </Suspense>

          {products.length === 0 ? (
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
              <ProductsTable products={products} />

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
                    منتج
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
                        className={
                          safePage <= 1 ? "pointer-events-none opacity-50" : ""
                        }
                      >
                        <ChevronRight className="me-1 size-4" />
                        السابق
                      </Link>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }).map(
                        (_, i) => {
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
                        },
                      )}
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
                        className={
                          safePage >= totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
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
};

export default MerchantProductsRoute;
