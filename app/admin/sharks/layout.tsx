import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { PageHeader } from "@/components/saas-page";
import { SharksAdminNav } from "./_components/sharks-admin-nav";

export const metadata: Metadata = { title: "Casho Sharks" };

export default async function AdminSharksLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Casho Sharks"
        description="طلبات البرنامج، التقييم والقرارات، خطط الدعم، والقصص المنشورة. مفيش أي خطوة هنا بتحرّك فلوس أو بتعمل التزام مالي."
      />
      <SharksAdminNav />
      {children}
    </div>
  );
}
