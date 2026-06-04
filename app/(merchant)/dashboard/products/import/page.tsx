import { Metadata } from "next";
import { Upload } from "lucide-react";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import ImportProductsForm from "../_components/ImportProductsForm";

export const metadata: Metadata = {
  title: "استيراد منتجات",
  description: "استيراد منتجات بالجملة من ملف CSV أو Excel",
};

export default function ImportProductsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Upload}
        title="استيراد منتجات"
        description="ارفع ملف CSV أو Excel لإضافة منتجات بالجملة دفعة واحدة"
        actionLabel="عودة للمنتجات"
        actionHref="/dashboard/products"
      />
      <ImportProductsForm />
    </div>
  );
}
