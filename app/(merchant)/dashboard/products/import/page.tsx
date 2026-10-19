import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Upload } from "lucide-react";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
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
      <DashboardSectionHeader
        icon={Upload}
        title={tr("استيراد منتجات")}
        description={tr("ارفع ملف CSV أو Excel لإضافة منتجات بالجملة دفعة واحدة")}
        actionLabel={tr("عودة للمنتجات")}
        actionHref="/dashboard/products"
      />
      <Link
        href="/integrations/shopify"
        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <ShoppingBag className="size-4.5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">{tr("عندك متجر على Shopify؟")}</span>
            <span className="block text-xs text-muted-foreground">{tr("انقل المنتجات والعملاء والطلبات مباشرةً من غير ملفات")}</span>
          </span>
        </span>
        <ArrowLeft className="size-4 shrink-0 text-muted-foreground ltr:-scale-x-100" />
      </Link>
      <ImportProductsForm />
    </div>
  );
}
