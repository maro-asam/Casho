import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, PackagePlus, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";

import CreateProductForm from "@/app/(merchant)/_components/products/CreateProductForm";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  title: "إضافة منتج جديد",
};

export default async function CreateNewProductPage() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) redirect("/");

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <DashboardSectionHeader
        icon={PackagePlus}
        title="إضافة منتج جديد"
        description={
          <>
            أضف منتجًا جديدًا إلى متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
      />

      {categories.length === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-bold">لا توجد تصنيفات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              لازم تضيف تصنيف واحد على الأقل قبل إنشاء منتج جديد، عشان تقدر تربط
              المنتج بالقسم المناسب داخل متجرك.
            </p>

            <Button asChild className="mt-6 rounded-xl">
              <Link href="/dashboard/categories/new">
                <Plus className="me-2 size-4" />
                إضافة تصنيف جديد
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto w-full max-w-3xl">
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PackagePlus className="size-6" />
              </div>

              <div>
                <CardTitle className="text-xl">بيانات المنتج</CardTitle>
                <CardDescription className="mt-1 leading-6">
                  أدخل بيانات المنتج بشكل واضح، واختر التصنيف المناسب له، ثم
                  أضفه ليظهر داخل متجرك للعملاء.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <CreateProductForm categories={categories} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
