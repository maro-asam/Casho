import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import type { FollowUpRow } from "@/lib/leads/queries";
import { repLabel } from "@/lib/leads/queries";
import { fmtDateTime, fmtWhen, whatsappLink } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { DueChip, LeadPriorityTag, LeadStatusTag } from "./lead-ui";
import { CompleteFollowUpDialog, FollowUpMenu } from "./lead-work-actions";

/** Follow-up list rows with quick complete / reschedule — the same for the admin and the rep. */
export function FollowUpRows({ rows, now, detailBase, showRep }: { rows: FollowUpRow[]; now: Date; detailBase: string; showRep: boolean }) {
  return (
    <ul className="apple-rows">
      {rows.map((f) => {
        const pending = f.status === "PENDING";
        const first = f.lead.ownerName?.split(/\s+/)[0];
        return (
          <li key={f.id} className="flex items-start gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link href={`${detailBase}/${f.lead.id}`} className="truncate text-[15px] font-semibold hover:text-primary">
                  {f.lead.businessName}
                </Link>
                <LeadStatusTag status={f.lead.status} quiet />
                {f.lead.priority === "HOT" || f.lead.priority === "HIGH" ? <LeadPriorityTag priority={f.lead.priority} /> : null}
              </div>
              <p className="text-[13px]">
                {pending ? (
                  <DueChip at={f.dueAt} now={now} label={`${fmtWhen(f.dueAt, now)} · ${fmtDateTime(f.dueAt)}`} />
                ) : (
                  <span className="text-muted-foreground">خلصت {f.closedAt ? fmtWhen(f.closedAt, now) : ""}</span>
                )}
              </p>
              {f.note && <p className="line-clamp-2 text-[14px] text-foreground/85">{f.note}</p>}
              {f.outcome && <p className="text-[13px] text-muted-foreground">النتيجة: {f.outcome}</p>}
              <p className="text-[12px] text-muted-foreground">
                {[f.lead.ownerName, showRep ? (repLabel(f.lead.assignedRep) ?? "متابعة الإدارة") : null].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <a href={`tel:${f.lead.phone}`} aria-label={`اتصل بـ${f.lead.businessName}`} className={cn(appleButton.tinted, "size-9 px-0 text-primary")}>
                <Phone className="size-4" />
              </a>
              <a
                href={whatsappLink(f.lead.whatsapp || f.lead.phone, `أهلًا${first ? ` ${first}` : ""}، معاك فريق كاشو.`)}
                target="_blank"
                rel="noreferrer"
                aria-label={`واتساب ${f.lead.businessName}`}
                className={cn(appleButton.tinted, "size-9 bg-(--sys-green)/12 px-0 text-(--sys-green)")}
              >
                <MessageCircle className="size-4" />
              </a>
              {pending && (
                <>
                  <CompleteFollowUpDialog followUpId={f.id} compact />
                  <FollowUpMenu followUpId={f.id} dueAt={f.dueAt} />
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
