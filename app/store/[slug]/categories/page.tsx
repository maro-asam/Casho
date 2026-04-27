import { getStoreCategories } from "@/lib/store.queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  FolderOpen,
  MousePointer2,
  PackageSearch,
  ShieldAlert,
  Store as StoreIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@prisma/client";

export default async function StoreCategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getStoreCategories(slug);
  if (!data) return notFound();

  const { store, categories } = data;

  if (store.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    return (
      <div
        className="wrapper min-h-[70vh] flex items-center justify-center py-10"
        dir="rtl"
      >
        <Card className="w-full max-w-xl rounded-xl border-destructive/20 bg-background shadow-sm">
          <CardContent className="flex flex-col items-center text-center p-10 space-y-5">
            <div className="flex size-16 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">المتجر غير مفعل حاليًا</h1>
              <p className="text-sm text-muted-foreground leading-7">
                لا يمكن عرض التصنيفات لأن اشتراك المتجر غير نشط في الوقت الحالي.
              </p>
            </div>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/store/${store.slug}`}>
                <ArrowRight className="size-4" />
                الرجوع للمتجر
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="wrapper py-10 space-y-8" dir="rtl">
      <section className="relative overflow-hidden rounded-xl border bg-background p-6 md:p-8">
        <div className="absolute inset-0 bg-linear-to-l from-primary/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="rounded-xl px-3 py-1">
              <StoreIcon className="size-4" />
              تصنيفات المتجر
            </Badge>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                تصفح تصنيفات {store.name}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                اختر التصنيف المناسب واستعرض المنتجات بسهولة داخل المتجر.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/store/${store.slug}`}>
              <ArrowRight className="size-4" />
              الرجوع للمتجر
            </Link>
          </Button>
        </div>
      </section>

      <section className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold md:text-2xl">كل التصنيفات</h2>
          <p className="text-sm text-muted-foreground">
            عدد التصنيفات: {categories.length}
          </p>
        </div>
      </section>

      {categories.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-70 flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageSearch className="size-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">لا توجد تصنيفات بعد</h3>
              <p className="max-w-md text-sm leading-7 text-muted-foreground">
                لم يتم إضافة أي تصنيفات لهذا المتجر حتى الآن. يمكنك الرجوع للصفحة
                الرئيسية واستعراض المنتجات مباشرة.
              </p>
            </div>

            <Button asChild className="rounded-xl">
              <Link href={`/store/${store.slug}`}>
                <ArrowRight className="size-4" />
                العودة للمتجر
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/store/${store.slug}/products?category=${category.slug}`}
              className="group"
            >
              <Card className="h-full p-0 overflow-hidden rounded-xl border bg-background transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden p-6">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                          <FolderOpen className="size-7" />
                        </div>

                        <Badge
                          variant="outline"
                          className="rounded-xl text-xs px-3 py-1"
                        >
                          #{index + 1}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold leading-snug transition-colors group-hover:text-primary">
                          {category.name}
                        </h3>

                        <p className="text-sm leading-7 text-muted-foreground">
                          اضغط لعرض المنتجات الموجودة داخل هذا التصنيف.
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t pt-4 text-sm">
                        <span className="text-muted-foreground">
                          استعراض المنتجات
                        </span>

                        <div className="flex items-center gap-2 font-medium text-primary">
                          <MousePointer2 className="size-4" />
                          دخول
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}