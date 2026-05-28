import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

import {
  FolderOpen,
  Plus,
  Tag,
  ChevronRight,
  ChevronLeft,
  Package,
  Pencil,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import DeleteCategoryButton from "./_components/DeleteCategoryButton";

export const metadata: Metadata = {
  title: "إدارة التصنيفات",
};

type CategoriesPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

const PAGE_SIZE = 9;

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const userId = await requireUserId();
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(Number(resolvedSearchParams?.page || "1"), 1);

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
              <FolderOpen className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولًا حتى تتمكن من إدارة التصنيفات.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCategories = await prisma.category.count({
    where: { storeId: store.id },
  });

  const totalPages = Math.max(Math.ceil(totalCategories / PAGE_SIZE), 1);
  const safePage = Math.min(currentPage, totalPages);

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Tag}
        title="التصنيفات"
        badge={totalCategories}
        description={
          <>
            إدارة تصنيفات متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
        actionLabel="إضافة تصنيف جديد"
        actionHref="/categories/new"
      />

      {categories.length === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-semibold">لا توجد تصنيفات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة أول تصنيف لتنظيم منتجاتك بشكل أفضل وتسهيل التصفح على
              العملاء داخل المتجر.
            </p>

            <Button asChild className="mt-6 rounded-xl">
              <Link href="/categories/new">
                <Plus className="me-2 size-4" />
                إضافة أول تصنيف
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="group rounded-xl border bg-background shadow-sm transition-shadow hover:shadow-md p-0"
              >
                <CardContent className="p-0">
                  {/* Image Banner */}
                  <div className="relative h-36 w-full overflow-hidden rounded-t-xl bg-muted">
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Tag className="size-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{cat.name}</h3>
                        <span className="mt-0.5 block truncate rounded-md font-mono text-xs text-muted-foreground">
                          {cat.slug}
                        </span>
                      </div>

                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-lg"
                      >
                        <Package className="me-1 size-3" />
                        {cat._count.products}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-end gap-1 border-t pt-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                      >
                        <Link href={`/dashboard/categories/${cat.id}/edit`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>

                      <DeleteCategoryButton
                        categoryId={cat.id}
                        storeId={store.id}
                        categoryName={cat.name}
                        productCount={cat._count.products}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                الصفحة{" "}
                <span className="font-medium text-foreground">{safePage}</span>{" "}
                من{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>
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
                    href={`/dashboard/categories?page=${safePage - 1}`}
                    aria-disabled={safePage <= 1}
                    className={
                      safePage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <ChevronRight className="me-1.5 size-4" />
                    السابق
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isActive = page === safePage;
                    return (
                      <Button
                        key={page}
                        asChild
                        variant={isActive ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 rounded-xl text-sm"
                      >
                        <Link href={`/dashboard/categories?page=${page}`}>
                          {page}
                        </Link>
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
                    href={`/dashboard/categories?page=${safePage + 1}`}
                    aria-disabled={safePage >= totalPages}
                    className={
                      safePage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  >
                    التالي
                    <ChevronLeft className="ms-1.5 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
