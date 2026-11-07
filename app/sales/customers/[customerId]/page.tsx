import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageCircle } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { CustomerDetail } from "@/components/sales/customer-detail";
import { whatsappLink } from "@/lib/sales/format";
import { requireSalesRep } from "@/lib/sales/guard";
import { getAttributedCustomer } from "@/lib/sales/queries";
import { cn } from "@/lib/utils";

export default async function SalesCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  const rep = await requireSalesRep();
  const { customerId } = await params;

  // Scoped lookup: another rep's customer id is indistinguishable from a missing one.
  const detail = await getAttributedCustomer({ salesRepId: rep.salesRepId }, customerId);
  if (!detail) notFound();

  const { customer } = detail.attribution;
  const repName = rep.name?.trim() || rep.email.split("@")[0];
  const firstName = customer.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-4">
      <Link href="/sales/customers" className={cn(appleButton.plain, "mx-0 -ms-2")}>
        <ChevronRight className="size-4" strokeWidth={2.2} />
        عملائي
      </Link>
      <CustomerDetail
        detail={detail}
        headerActions={
          customer.phone_number && (
            <a
              href={whatsappLink(customer.phone_number, `أهلًا${firstName ? ` ${firstName}` : ""}، معاك ${repName} من كاشو.`)}
              target="_blank"
              rel="noreferrer"
              className={cn(appleButton.filled, "bg-(--sys-green) text-white hover:bg-(--sys-green)/90")}
            >
              <MessageCircle className="size-[18px]" />
              كلّمه على واتساب
            </a>
          )
        }
      />
    </div>
  );
}
