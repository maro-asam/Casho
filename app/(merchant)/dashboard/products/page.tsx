import Link from "next/link";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import {
  FolderOpen,
  Package,
  Plus,
  Star,
  Trash2,
  Store,
  Edit,
  ImageIcon,
  Tag,
  CircleDollarSign,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { DeleteProductAction } from "@/actions/products/products.actions";
import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import Image from "next/image";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  title: "المنتجات",
  description: "إدارة منتجات المتجر وعرضها وتعديلها وحذفها",
};

const PAGE_SIZE = 6;

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(price);
}

type MerchantProductsRouteProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const MerchantProductsRoute = async ({
  searchParams,
}: MerchantProductsRouteProps) => {
  const userId = await requireUserId();
  const resolvedSearchParams = await searchParams;

  const currentPage = Math.max(Number(resolvedSearchParams?.page || "1"), 1);

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Store className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولًا حتى تتمكن من إدارة المنتجات وإضافتها.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalProducts = await prisma.product.count({
    where: {
      storeId: store.id,
    },
  });

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const skip = (safePage - 1) * PAGE_SIZE;

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      image: true,
      isActive: true,
      isFeatured: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

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
        actionLabel="إضافة منتج جديد"
        actionHref="/dashboard/products/new"
      />

      {totalProducts === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-90 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-bold">لا توجد منتجات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة أول منتج داخل متجرك ليظهر للعملاء وتبدأ في إدارة
              منتجاتك بشكل أفضل.
            </p>

            <Button asChild className="mt-6 rounded-xl">
              <Link href="/dashboard/products/new">
                <Plus className="ms-2 size-4" />
                إضافة أول منتج
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden rounded-xl shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-70 text-right">
                        المنتج
                      </TableHead>
                      <TableHead className="text-right">التصنيف</TableHead>
                      <TableHead className="text-right">السعر</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التمييز</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {products.map((product) => (
                      <TableRow
                        key={product.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="py-4">
                          <div className="flex min-w-65 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                              {product.image ? (
                                <Image
                                  width={100}
                                  height={100}
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                                  <ImageIcon className="size-5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <p className="truncate font-semibold text-foreground">
                                {product.name}
                              </p>

                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Tag className="size-3.5" />
                                <span className="truncate">{product.slug}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="gap-1 whitespace-nowrap rounded-xl"
                          >
                            <Package className="size-3.5" />
                            {product.category.name}
                          </Badge>
                        </TableCell>

                        <TableCell className="whitespace-nowrap font-semibold">
                          <div className="flex items-center gap-1">
                            <CircleDollarSign className="size-4 text-muted-foreground" />
                            {formatPrice(product.price)}
                          </div>
                        </TableCell>

                        <TableCell>
                          {product.isActive ? (
                            <Badge className="gap-1 whitespace-nowrap rounded-xl">
                              <ShieldCheck className="size-3.5" />
                              نشط
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="whitespace-nowrap rounded-xl"
                            >
                              غير نشط
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {product.isFeatured ? (
                            <Badge
                              variant="outline"
                              className="gap-1 whitespace-nowrap rounded-xl"
                            >
                              <Star className="size-3.5" />
                              مميز
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Button
                              asChild
                              variant="secondary"
                              size="sm"
                              className="rounded-xl"
                            >
                              <Link
                                href={`/dashboard/products/${product.id}/edit`}
                              >
                                <Edit className="ms-1 size-4" />
                                تعديل
                              </Link>
                            </Button>

                            <form
                              action={async () => {
                                "use server";
                                await DeleteProductAction(product.id);
                                revalidatePath("/dashboard/products");
                              }}
                            >
                              <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                className="rounded-xl"
                              >
                                <Trash2 className="ms-1 size-4" />
                                حذف
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
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
                  className="rounded-xl"
                  disabled={safePage <= 1}
                >
                  <Link
                    href={`/dashboard/products?page=${safePage - 1}`}
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
                        className="rounded-xl"
                      >
                        <Link href={`/dashboard/products?page=${page}`}>
                          {page}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl"
                  disabled={safePage >= totalPages}
                >
                  <Link
                    href={`/dashboard/products?page=${safePage + 1}`}
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
};

export default MerchantProductsRoute;