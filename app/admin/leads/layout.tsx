import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { assertLeadAdmin } from "@/lib/leads/access";
import { LargeTitle, appleButton } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { LeadsAdminNav } from "./_components/leads-admin-nav";

export const metadata = { title: "الليدز" };

export default async function AdminLeadsLayout({ children }: { children: ReactNode }) {
  assertLeadAdmin(await requireAdminPage());
  const now = new Date();
  // Badges: overdue follow-ups anywhere, and paying merchants waiting to be matched to a lead.
  const [overdue, matches] = await Promise.all([
    prisma.leadFollowUp.count({ where: { status: "PENDING", dueAt: { lt: now }, lead: { deletedAt: null, archivedAt: null } } }).catch(() => 0),
    prisma.leadConversionMatch.count({ where: { status: "OPEN" } }).catch(() => 0),
  ]);

  return (
    <div className="space-y-6">
      <LargeTitle
        title="الليدز"
        subtitle="التجار اللي لسه مسجلوش: مين جايبهم، مين بيكلمهم، ووصلوا لفين. أول ما الواحد فيهم يدفع اشتراك بيتحسب تحويل لوحده."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/leads/imports" className={cn(appleButton.gray, "h-10")}>
              <Upload className="size-4" />
              استيراد
            </Link>
            <Link href="/admin/leads/new" className={cn(appleButton.filled, "h-10")}>
              <Plus className="size-4" strokeWidth={2.4} />
              ليد جديد
            </Link>
          </div>
        }
      />
      <LeadsAdminNav overdue={overdue} matches={matches} />
      {children}
    </div>
  );
}
