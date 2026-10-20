import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Plus, Tags } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Unavailable, appleButton } from "@/components/saas-page";
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
      <div className="space-y-4 pt-2" dir={tdir()}>
        <Link
          href="/products"
          className="apple-press -ms-1.5 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
          {tr("المنتجات")}
        </Link>
        <div className="apple-card">
          <Unavailable
            icon={Tags}
            title={tr("محتاج تصنيف الأول")}
            description={tr("كل منتج لازم يبقى تحت تصنيف (زي: تيشيرتات، شنط، إكسسوارات) عشان العملاء يلاقوه بسهولة. ضيف تصنيف وارجع هنا.")}
            action={
              <Link href="/categories/new" className={`${appleButton.filled} h-9 px-4`}>
                <Plus className="size-4" strokeWidth={2.4} />
                {tr("إضافة تصنيف")}
              </Link>
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
