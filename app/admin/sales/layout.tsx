import type { ReactNode } from "react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { PageHeader } from "@/components/saas-page";
import { SalesAdminNav } from "./_components/sales-admin-nav";

export default async function AdminSalesLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="فريق المبيعات" description="المندوبين، العملاء المنسوبين، العمولات والصرف. كل المبالغ بالجنيه المصري ومصدرها دفتر رصيد المتاجر." />
      <SalesAdminNav />
      {children}
    </div>
  );
}
