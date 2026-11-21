import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { LeadDetailView } from "@/components/leads/lead-detail";
import { REP_STATUS_TARGETS, checkStatusChange, type LeadActor } from "@/lib/leads/workflow";
import { getLeadDetail } from "@/lib/leads/queries";
import { requireSalesRep } from "@/lib/sales/guard";
import { cn } from "@/lib/utils";

export default async function RepLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  const rep = await requireSalesRep();
  const actor: LeadActor = { kind: "rep", userId: rep.userId, salesRepId: rep.salesRepId };
  const { leadId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(leadId)) notFound();

  // Scoped lookup: another rep's lead (or an archived one) is indistinguishable from a missing one.
  const detail = await getLeadDetail(actor, leadId);
  if (!detail) notFound();
  const { lead } = detail;
  const repName = rep.name?.trim() || rep.email.split("@")[0];
  const first = lead.ownerName?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-4">
      <Link href="/sales/leads" className={cn(appleButton.plain, "mx-0 -ms-2")}>
        <ChevronRight className="size-4" strokeWidth={2.2} />
        ليداتي
      </Link>
      <LeadDetailView
        detail={detail}
        viewer="rep"
        now={new Date()}
        statusTargets={REP_STATUS_TARGETS.filter((s) => checkStatusChange(actor, lead, s).ok)}
        canWork
        greeting={`أهلًا${first ? ` ${first}` : ""}، معاك ${repName} من كاشو.`}
      />
    </div>
  );
}
