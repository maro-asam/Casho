import { redirect } from "next/navigation";
import { Metadata } from "next";
import { FilePenLine } from "lucide-react";

import { prisma } from "@/lib/prisma";

import EditProductForm from "@/app/(merchant)/_components/products/EditProductForm";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

export const metadata: Metadata = {
  title: "تعديل المنتج",
};

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!store) {
    redirect("/");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: store.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      image: true,
      images: true,
      brand: true,
      stock: true,
      sizes: true,
      colors: true,
      tags: true,
      weight: true,
      isActive: true,
      isFeatured: true,
      hasVariants: true,
      categoryId: true,
    },
  });
  if (!product) {
    redirect("/dashboard/products");
  }

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <DashboardSectionHeader
        icon={FilePenLine}
        title="تعديل المنتج"
        description={
          <>
            تعديل بيانات المنتج داخل متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
      />

      <div className="mx-auto w-full max-w-3xl">
        <Card className="rounded-md shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FilePenLine className="size-6" />
            </div>

            <div>
              <CardTitle className="text-xl">بيانات المنتج</CardTitle>
              <CardDescription className="mt-1 leading-6">
                عدّل الاسم والسعر والصورة والتصنيف وحالة المنتج، ثم احفظ
                التغييرات.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <EditProductForm product={product} categories={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
