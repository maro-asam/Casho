import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Tag, ChevronRight, ChevronLeft } from "lucide-react";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import DeleteCategoryButton from "./_components/DeleteCategoryButton";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

type CategoriesPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const PAGE_SIZE = 6;

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
        <Card className="border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-muted">
              <FolderOpen className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولًا حتى تتمكن من إدارة التصنيفات وإضافة المنتجات.
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
    },
  });

  return (
    <div className="space-y-6 p-6" dir="rtl">
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
        actionHref="/dashboard/categories/new"
      />

      {categories.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-bold">لا توجد تصنيفات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة أول تصنيف لتنظيم منتجاتك بشكل أفضل وتسهيل التصفح على
              العملاء داخل المتجر.
            </p>

            <Button asChild className="mt-6">
              <Link href="/dashboard/categories/new">
                <Plus className="me-2 size-4" />
                إضافة أول تصنيف
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((cat, index) => (
              <Card
                key={cat.id}
                className="border bg-background shadow-sm transition hover:shadow-md"
              >
                <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary">
                          <Tag className="size-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">
                          {cat.name}
                        </h3>
                        <Badge variant="secondary">
                          #{(safePage - 1) * PAGE_SIZE + index + 1}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate rounded-md bg-muted px-2 py-1 font-mono text-xs">
                          {cat.slug}
                        </span>
                        <Badge variant="outline">Slug</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <DeleteCategoryButton
                      categoryId={cat.id}
                      storeId={store.id}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
                  disabled={safePage <= 1}
                >
                  <Link
                    href={`/dashboard/categories?page=${safePage - 1}`}
                    aria-disabled={safePage <= 1}
                    className={
                      safePage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <ChevronRight className="me-2 size-4" />
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
                    <ChevronLeft className="ms-2 size-4" />
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