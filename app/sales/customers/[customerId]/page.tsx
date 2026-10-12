import { notFound } from "next/navigation";
import { CustomerDetail } from "@/components/sales/customer-detail";
import { requireSalesRep } from "@/lib/sales/guard";
import { getAttributedCustomer } from "@/lib/sales/queries";

export default async function SalesCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  const rep = await requireSalesRep();
  const { customerId } = await params;

  // Scoped lookup: another rep's customer id is indistinguishable from a missing one.
  const detail = await getAttributedCustomer({ salesRepId: rep.salesRepId }, customerId);
  if (!detail) notFound();

  return <CustomerDetail detail={detail} />;
}
