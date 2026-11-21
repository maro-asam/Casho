import type { ReactNode } from "react";
import type { LeadPriority, LeadStatus } from "@prisma/client";
import { Flame } from "lucide-react";
import { StatusText, Tag } from "@/components/saas-page";
import { PRIORITY_META, STATUS_META } from "@/lib/leads/constants";
import { cn } from "@/lib/utils";

/** Server-safe building blocks shared by the admin and the Sales lead pages. */

export function LeadStatusTag({ status, quiet = false }: { status: LeadStatus; quiet?: boolean }) {
  const meta = STATUS_META[status];
  return quiet ? <StatusText tone={meta.tone}>{meta.label}</StatusText> : <Tag tone={meta.tone}>{meta.label}</Tag>;
}

export function LeadPriorityTag({ priority, score }: { priority: LeadPriority; score?: number }) {
  const meta = PRIORITY_META[priority];
  return (
    <Tag tone={meta.tone}>
      {priority === "HOT" && <Flame className="-ms-0.5 size-3" strokeWidth={2.4} />}
      {meta.label}
      {score !== undefined && <span className="tabular-nums text-muted-foreground">· {new Intl.NumberFormat("ar-EG").format(score)}</span>}
    </Tag>
  );
}

/** A 0–100 meter: the number carries it, the bar is a glance. */
export function ScoreMeter({ score, className }: { score: number; className?: string }) {
  const tone = score >= 75 ? "bg-(--sys-red)" : score >= 50 ? "bg-(--sys-orange)" : score >= 25 ? "bg-primary" : "bg-(--sys-gray)";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-(--fill-3)" aria-hidden>
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${Math.max(4, score)}%` }} />
      </span>
      <span className="text-[13px] tabular-nums text-muted-foreground">{new Intl.NumberFormat("ar-EG").format(score)}/١٠٠</span>
    </span>
  );
}

/** Section heading inside a detail card group. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 pb-2">
      <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{children}</h2>
      {action}
    </div>
  );
}

/** "Due" chip: red when overdue, orange today, quiet later. */
export function DueChip({ at, now, label }: { at: Date | null; now: Date; label: string | null }) {
  if (!at || !label) return <span className="text-muted-foreground">—</span>;
  const overdue = at.getTime() < now.getTime();
  const soon = !overdue && at.getTime() - now.getTime() < 24 * 3_600_000;
  return (
    <span className={cn("whitespace-nowrap text-[13px] tabular-nums", overdue ? "font-medium text-(--sys-red)" : soon ? "text-(--sys-orange)" : "text-muted-foreground")}>
      {label}
    </span>
  );
}
