"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadPriority, LeadStatus } from "@prisma/client";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CalendarClock, GripVertical, Lock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bulkLeadStatusAction } from "@/actions/leads/admin-leads.actions";
import { STATUS_META } from "@/lib/leads/constants";
import { fmtWhen } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { SubmitRow, formValues, useLeadAction } from "./form-kit";
import { LeadPriorityTag } from "./lead-ui";
import { LostReasonFields } from "./lead-work-actions";
import { toneDotClass } from "@/components/saas-page";

export type PipelineCard = {
  id: string;
  businessName: string;
  ownerName: string | null;
  city: string | null;
  priority: LeadPriority;
  score: number;
  nextFollowUpAt: Date | null;
  repName: string | null;
  hasRep: boolean;
};
export type PipelineColumnData = { status: LeadStatus; count: number; leads: PipelineCard[] };

const nf = new Intl.NumberFormat("ar-EG");

function Card({ lead, status, now }: { lead: PipelineCard; status: LeadStatus; now: Date }) {
  const locked = status === "CONVERTED";
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, data: { from: status, hasRep: lead.hasRep }, disabled: locked });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <li ref={setNodeRef} style={style} className={cn("rounded-[14px] bg-card shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_0.5px_var(--border)]", isDragging && "relative z-50 shadow-xl")}>
      <div className="flex items-start gap-1.5 p-3">
        {locked ? (
          <Lock className="mt-0.5 size-3.5 shrink-0 text-(--label-3)" aria-label="التحويل مقفول" />
        ) : (
          <button type="button" {...listeners} {...attributes} aria-label={`اسحب ${lead.businessName} لمرحلة تانية`} className="-ms-1 mt-0.5 cursor-grab touch-none rounded text-(--label-3) hover:text-foreground active:cursor-grabbing">
            <GripVertical className="size-4" />
          </button>
        )}
        <Link href={`/admin/leads/${lead.id}`} className="min-w-0 flex-1 space-y-1.5">
          <p className="line-clamp-2 text-[14px] leading-[19px] font-semibold">{lead.businessName}</p>
          <p className="truncate text-[12px] text-muted-foreground">{[lead.ownerName, lead.city].filter(Boolean).join(" · ") || "—"}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <LeadPriorityTag priority={lead.priority} score={lead.score} />
          </div>
          <div className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
            <span className="truncate">{lead.repName ?? "مش متسند"}</span>
            {lead.nextFollowUpAt && (
              <span className={cn("inline-flex shrink-0 items-center gap-1", lead.nextFollowUpAt.getTime() < now.getTime() && "text-(--sys-red)")}>
                <CalendarClock className="size-3" />
                {fmtWhen(lead.nextFollowUpAt, now)}
              </span>
            )}
          </div>
        </Link>
      </div>
    </li>
  );
}

function Column({ column, now, hiddenCount }: { column: PipelineColumnData; now: Date; hiddenCount: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status, disabled: column.status === "CONVERTED" });
  const meta = STATUS_META[column.status];
  return (
    <section aria-label={meta.label} className="flex w-[17rem] shrink-0 flex-col">
      <header className="flex items-center justify-between gap-2 px-1.5 pb-2">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <span aria-hidden className={cn("size-2 rounded-full", toneDotClass(meta.tone))} />
          {meta.label}
        </h3>
        <span className="text-[13px] tabular-nums text-muted-foreground">{nf.format(column.count)}</span>
      </header>
      <ul
        ref={setNodeRef}
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-2 rounded-[18px] bg-(--fill-3)/60 p-2 transition-colors",
          isOver && "bg-primary/10 ring-2 ring-primary/40",
          column.status === "CONVERTED" && "bg-(--sys-green)/6",
        )}
      >
        {column.leads.map((l) => (
          <Card key={l.id} lead={l} status={column.status} now={now} />
        ))}
        {column.leads.length === 0 && <li className="px-2 py-6 text-center text-[12px] text-muted-foreground">{column.status === "CONVERTED" ? "بيتملى لوحده مع أول اشتراك" : "اسحب ليد هنا"}</li>}
        {hiddenCount > 0 && (
          <li className="px-2 py-1.5 text-center">
            <Link href={`/admin/leads/list?status=${column.status}`} className="text-[12px] text-primary">
              و{nf.format(hiddenCount)} كمان — افتحهم في القايمة
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}

/**
 * Admin Kanban. Dragging a card calls the same server action as the table's
 * bulk status change (rules re-checked there); LOST asks for the reason; the
 * CONVERTED column only fills itself from a paid subscription.
 */
export function PipelineBoard({ columns: initial, now }: { columns: PipelineColumnData[]; now: Date }) {
  const router = useRouter();
  const [columns, setColumns] = useState(initial);
  const [lostFor, setLostFor] = useState<{ id: string; from: LeadStatus } | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const [synced, setSynced] = useState(initial);
  if (initial !== synced) {
    setSynced(initial);
    setColumns(initial);
  }

  function move(id: string, from: LeadStatus, to: LeadStatus) {
    setColumns((cols) => {
      const card = cols.find((c) => c.status === from)?.leads.find((l) => l.id === id);
      if (!card) return cols;
      return cols.map((c) =>
        c.status === from
          ? { ...c, count: c.count - 1, leads: c.leads.filter((l) => l.id !== id) }
          : c.status === to
            ? { ...c, count: c.count + 1, leads: [card, ...c.leads] }
            : c,
      );
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const to = e.over?.id as LeadStatus | undefined;
    const from = e.active.data.current?.from as LeadStatus | undefined;
    const hasRep = e.active.data.current?.hasRep as boolean | undefined;
    const id = String(e.active.id);
    if (!to || !from || to === from) return;
    if (to === "CONVERTED") return toast.error("التحويل بيتسجل لوحده مع أول اشتراك — أو اربط الليد بحسابه من صفحته");
    if (to === "NEW" && hasRep) return toast.error("الليد متسند لمندوب — شيله من المندوب الأول");
    if (to === "ASSIGNED" && !hasRep) return toast.error("اسند الليد لمندوب الأول");
    if (to === "LOST") return setLostFor({ id, from });

    move(id, from, to);
    startTransition(async () => {
      const res = await bulkLeadStatusAction({ leadIds: [id], status: to });
      if (!res.success) {
        toast.error(res.message);
        move(id, to, from);
      } else {
        toast.success(`اتنقل لـ«${STATUS_META[to].label}»`);
        router.refresh();
      }
    });
  }

  const lost = useLeadAction(bulkLeadStatusAction, () => {
    if (lostFor) move(lostFor.id, lostFor.from, "LOST");
    setLostFor(null);
  });

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="relative -mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0" role="region" aria-label="مراحل الليدز" tabIndex={0}>
          <div className="flex min-w-max gap-3">
            {columns.map((c) => (
              <Column key={c.status} column={c} now={now} hiddenCount={Math.max(0, c.count - c.leads.length)} />
            ))}
          </div>
        </div>
      </DndContext>
      <Dialog open={!!lostFor} onOpenChange={(o) => !o && setLostFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>خسرنا الليد ده؟</DialogTitle>
            <DialogDescription>السبب بيتسجل في تاريخه، والمتابعات المفتوحة بتتلغي.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => lostFor && lost.submit({ ...formValues(e), leadIds: [lostFor.id], status: "LOST" })}>
            <LostReasonFields errors={lost.errors} />
            <SubmitRow pending={lost.pending} label="سجّل الخسارة" destructive />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
