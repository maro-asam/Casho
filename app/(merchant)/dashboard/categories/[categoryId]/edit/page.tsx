import { redirect } from "next/navigation";
import { Metadata } from "next";
import { FilePenLine, Tag } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import EditCategoryForm from "@/app/(merchant)/dashboard/categories/_components/EditCategoryForm";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "تعديل التصنيف",
};

type EditCategoryPageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { categoryId } = await params;
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) redirect("/");

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId: store.id },
    select: { id: true, name: true, slug: true, image: true },
  });

  if (!category) redirect("/categories");

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={FilePenLine}
        title="تعديل التصنيف"
        description={
          <>
            تعديل بيانات التصنيف داخل متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
      />

      <div className="mx-auto w-full max-w-xl">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tag className="size-6" />
            </div>

            <div>
              <CardTitle className="text-xl">بيانات التصنيف</CardTitle>
              <CardDescription className="mt-1 leading-6">
                عدّل اسم التصنيف أو صورته ثم احفظ التغييرات.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <EditCategoryForm
              categoryId={category.id}
              storeId={store.id}
              defaultName={category.name}
              defaultImage={category.image}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
