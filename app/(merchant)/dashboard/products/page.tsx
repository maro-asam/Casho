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
} from "lucide-react";

import { requireAuth } from "@/actions/auth/require.actions";
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
import DashboardSectionHeader from "../../_components/DashboardSectionHeader";

export const metadata: Metadata = {
  title: "المنتجات",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(price);
}

const MerchantProductsRoute = async () => {
  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      products: {
        orderBy: { createdAt: "desc" },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
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

  const totalProducts = store.products.length;

  return (
    <div className="space-y-6 p-6" dir="rtl">
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

      {store.products.length === 0 ? (
        <Card className="rounded-2xl border-dashed shadow-sm">
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-bold">لا توجد منتجات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة أول منتج داخل متجرك ليظهر للعملاء وتبدأ في إدارة
              منتجاتك بشكل أفضل.
            </p>

            <Button asChild className="mt-6 rounded-xl">
              <Link href="/dashboard/products/new">
                <Plus className="me-2 size-4" />
                إضافة أول منتج
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">التصنيف</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">مميز</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {store.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Package className="size-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="rounded-md">
                          {product.category.name}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-medium">
                        {formatPrice(product.price)}
                      </TableCell>

                      <TableCell>
                        {product.isActive ? (
                          <Badge className="rounded-md">نشط</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-md">
                            غير نشط
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {product.isFeatured ? (
                          <Badge variant="outline" className="rounded-md gap-1">
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
                        <div className="flex items-center justify-start gap-2">
                          <Button
                            type="submit"
                            variant="secondary"
                            size="sm"
                            className="rounded-xl"
                          >
                            <Edit className="me-2 size-4" />
                            تعديل
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
                              <Trash2 className="me-2 size-4" />
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
      )}
    </div>
  );
};

export default MerchantProductsRoute;
