import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { prisma } from "@/lib/prisma";
import AdminShell from "./_components/admin-shell";

export const metadata: Metadata = {
  title: { default: "لوحة الإدارة — كاشو", template: "%s — إدارة كاشو" },
  robots: { index: false, follow: false },
};

async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    unstable_rethrow(error); // keep the /login redirect
    notFound(); // signed in but not an admin: don't reveal the panel exists
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();

  // Queue sizes for the sidebar badges — the work waiting on an admin.
  const [viewer, topups, services, support] = await Promise.all([
    prisma.user.findUnique({ where: { id: admin.id }, select: { id: true, name: true, email: true, role: true } }),
    prisma.topupRequest.count({ where: { status: "PENDING" } }),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.supportRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <AdminShell viewer={viewer ?? { ...admin, name: null }} badges={{ topups, services, support }}>
      {children}
    </AdminShell>
  );
}
