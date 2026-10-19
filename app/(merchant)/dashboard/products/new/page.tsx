import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Plus, Tags } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import CreateProductForm from "../_components/CreateProductForm";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("إضافة منتج جديد"),
};
}

export default async function CreateNewProductPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) redirect("/");

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { storeId: store.id, isActive: true, type: "SIMPLE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, image: true },
    }),
  ]);

  if (categories.length === 0) {
    return (
      <div className="space-y-6" dir={tdir()}>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="size-4 ltr:-scale-x-100" />
          {tr("المنتجات")}
        </Link>
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={Tags}
            title={tr("محتاج تصنيف الأول")}
            description={tr("كل منتج لازم يبقى تحت تصنيف (زي: تيشيرتات، شنط، إكسسوارات) عشان العملاء يلاقوه بسهولة. ضيف تصنيف وارجع هنا.")}
            action={
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/categories/new">
                  <Plus className="size-4" />
                  {tr("إضافة تصنيف")}
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div dir={tdir()}>
      <CreateProductForm categories={categories} products={products} />
    </div>
  );
}
