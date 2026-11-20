import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPanelUser } from "@/lib/admin/page-guard";
import { isMediaBuyer } from "@/lib/admin/panel-roles";
import { prisma } from "@/lib/prisma";
import { countUnseenStores } from "@/lib/admin/new-stores";
import AdminShell from "./_components/admin-shell";
import { TeamTrafficMarker } from "@/components/analytics/TeamTrafficMarker";

export const metadata: Metadata = {
  title: { default: "لوحة الإدارة — كاشو", template: "%s — إدارة كاشو" },
  robots: { index: false, follow: false },
};

/**
 * Who gets the shell: admins, and media buyers (Analytics Center only — see
 * lib/admin/panel-roles.ts). This layout doesn't re-render on client navigation,
 * so it isn't what keeps a media buyer out of the rest: every page checks itself.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getPanelUser(); // signed out → /login
  if (!admin) notFound(); // signed in but not staff: don't reveal the panel exists

  if (isMediaBuyer(admin.role)) {
    const viewer = await prisma.user.findUnique({ where: { id: admin.id }, select: { id: true, name: true, email: true, role: true } });
    return (
      <AdminShell viewer={viewer ?? { ...admin, name: null }} badges={{}} analyticsOnly>
        <TeamTrafficMarker rootDomain={process.env.ROOT_DOMAIN || "casho.store"} />
        {children}
      </AdminShell>
    );
  }

  // Queue sizes for the sidebar badges — the work waiting on an admin — plus stores new since the last visit.
  const [viewer, stores, topups, services, support, sharks, sales] = await Promise.all([
    prisma.user.findUnique({ where: { id: admin.id }, select: { id: true, name: true, email: true, role: true } }),
    countUnseenStores(),
    prisma.topupRequest.count({ where: { status: "PENDING" } }),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.supportRequest.count({ where: { status: "PENDING" } }),
    // A badge must never take the whole panel down (e.g. code deployed before its migration).
    prisma.sharksApplication.count({ where: { status: "SUBMITTED" } }).catch(() => 0),
    prisma.salesWithdrawalRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  return (
    <AdminShell viewer={viewer ?? { ...admin, name: null }} badges={{ stores, topups, services, support, sharks, sales }}>
      {/* Staff browsers are left out of the Analytics Center's numbers. */}
      <TeamTrafficMarker rootDomain={process.env.ROOT_DOMAIN || "casho.store"} />
      {children}
    </AdminShell>
  );
}
