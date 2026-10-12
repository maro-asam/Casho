import { notFound } from "next/navigation";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { CustomerDetail } from "@/components/sales/customer-detail";
import { prisma } from "@/lib/prisma";
import { getAttributedCustomer } from "@/lib/sales/queries";
import { AssignCustomerDialog } from "../../_components/sales-dialogs";

export default async function AdminSalesCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  await requireAdmin();
  const { customerId } = await params;

  const detail = await getAttributedCustomer({ all: true }, customerId);
  if (!detail) notFound();

  const reps = await prisma.salesRep.findMany({ select: { id: true, status: true, user: { select: { name: true, email: true } } } });
  const actorIds = detail.attribution.changes.map((c) => c.actorUserId);
  const actors = actorIds.length ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } }) : [];

  // Rep ids and admin user ids never collide (both uuids from different tables).
  const names = new Map<string, string>([
    ...reps.map((r) => [r.id, r.user.name ?? r.user.email] as [string, string]),
    ...actors.map((a) => [a.id, a.name ?? a.email] as [string, string]),
  ]);
  const activeReps = reps.filter((r) => r.status === "ACTIVE").map((r) => ({ id: r.id, label: r.user.name ?? r.user.email }));

  return (
    <CustomerDetail
      detail={detail}
      repNames={names}
      headerActions={
        <AssignCustomerDialog reps={activeReps} customerUserId={customerId} currentRepId={detail.attribution.salesRepId} triggerLabel="نقل لمندوب تاني" />
      }
    />
  );
}
