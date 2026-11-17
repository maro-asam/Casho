import type { ReactNode } from "react";
import { SalesCommissionStatus } from "@prisma/client";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { LargeTitle } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { SalesAdminNav } from "./_components/sales-admin-nav";

export default async function AdminSalesLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  // Work waiting on an admin: commissions to decide, reps asking to be paid.
  const [toReview, toPay] = await Promise.all([
    prisma.salesCommission.count({ where: { status: { in: [SalesCommissionStatus.PENDING, SalesCommissionStatus.ON_HOLD] } } }).catch(() => 0),
    prisma.salesWithdrawalRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  return (
    <div className="space-y-6">
      <LargeTitle title="فريق المبيعات" subtitle="المندوبين وعملاؤهم، العمولات وصرفها. كل المبالغ بالجنيه ومصدرها دفتر رصيد المتاجر." />
      <SalesAdminNav toReview={toReview} toPay={toPay} />
      {children}
    </div>
  );
}
