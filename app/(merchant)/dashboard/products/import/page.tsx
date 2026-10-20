import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { LargeTitle } from "@/components/saas-page";
import ImportProductsForm from "../_components/ImportProductsForm";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("استيراد منتجات"),
  description: tr("استيراد منتجات بالجملة من ملف CSV أو Excel"),
};
}

export default async function ImportProductsPage() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        eyebrow={
          <Link
            href="/products"
            className="apple-press -ms-1.5 mb-1 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
            {tr("المنتجات")}
          </Link>
        }
        title={tr("استيراد منتجات")}
        subtitle={tr("ارفع ملف CSV أو Excel لإضافة منتجات بالجملة دفعة واحدة")}
      />

      <Link
        href="/integrations/shopify"
        className="apple-card flex min-h-16 items-center gap-3.5 px-4 py-3 transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-(--sys-green) text-white">
          <ShoppingBag className="size-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-5 font-semibold">{tr("عندك متجر على Shopify؟")}</span>
          <span className="block text-[13px] text-muted-foreground">{tr("انقل المنتجات والعملاء والطلبات مباشرةً من غير ملفات")}</span>
        </span>
        <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
      </Link>

      <ImportProductsForm />
    </div>
  );
}
