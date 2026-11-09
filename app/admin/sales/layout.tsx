import type { ReactNode } from "react";
import { SalesCommissionStatus } from "@prisma/client";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { LargeTitle } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { SalesAdminNav } from "./_components/sales-admin-nav";

export default async function AdminSalesLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  // Commissions waiting on a decision — the one count worth showing in the tabs.
  const toReview = await prisma.salesCommission
    .count({ where: { status: { in: [SalesCommissionStatus.PENDING, SalesCommissionStatus.ON_HOLD] } } })
    .catch(() => 0);

  return (
    <div className="space-y-6">
      <LargeTitle title="فريق المبيعات" subtitle="المندوبين وعملاؤهم، العمولات وصرفها. كل المبالغ بالجنيه ومصدرها دفتر رصيد المتاجر." />
      <SalesAdminNav toReview={toReview} />
      {children}
    </div>
  );
}
