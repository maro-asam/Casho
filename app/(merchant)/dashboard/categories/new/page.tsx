import Link from "next/link";
import { ArrowRight, FolderPlus, Tag } from "lucide-react";

import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import CreateCategoryForm from "../_components/CreateCategoryForm";

export default async function NewCategoryPage() {
  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FolderPlus className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولًا حتى تتمكن من إضافة التصنيفات.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-background p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tag className="size-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                إنشاء تصنيف جديد
              </h1>
              <p className="text-sm mt-2 text-muted-foreground">
                أضف تصنيفًا جديدًا لمتجر{" "}
                <span className="font-medium text-foreground">
                  {store.name}
                </span>
              </p>
            </div>
          </div>
        </div>

        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard/categories">
            <ArrowRight className="me-2 size-4" />
            الرجوع للتصنيفات
          </Link>
        </Button>
      </div>

      {/* Form Card */}
      <div className="mx-auto w-full max-w-2xl">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderPlus className="size-6" />
            </div>

            <div>
              <CardTitle className="text-xl">بيانات التصنيف</CardTitle>
              <CardDescription className="mt-1 leading-6">
                اكتب اسم التصنيف وسيتم إنشاؤه وربطه بمتجرك تلقائيًا لتنظيم
                المنتجات بشكل أفضل.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <CreateCategoryForm storeId={store.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
