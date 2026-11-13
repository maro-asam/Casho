import type { ReactNode } from "react";
import { Gift, Minus } from "lucide-react";
import { StatusText } from "@/components/saas-page";
import type { RepAdjustmentRow } from "@/lib/sales/queries";
import { fmtDate, fmtSignedMoney } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { CardEmpty } from "./sales-summary";

export const REP_ADJUSTMENT_LABELS = { BONUS: "مكافأة", DEDUCTION: "خصم" } as const;

/** Where the entry stands: waiting for the next payout, settled by one, or canceled. */
function stateOf(row: RepAdjustmentRow) {
  if (row.canceledAt) return { tone: "neutral" as const, label: "ملغي" };
  if (row.payout) return { tone: "success" as const, label: `اتسوّى في صرف ${fmtDate(row.payout.paidAt)}` };
  return { tone: "info" as const, label: "داخل في الصرف الجاي" };
}

/** Bonuses (+) and deductions (−) on a rep's account, with the reason the rep sees. */
export function RepAdjustmentRows({
  rows,
  empty,
  action,
}: {
  rows: RepAdjustmentRow[];
  empty: ReactNode;
  /** Trailing control per row (the admin's cancel button). */
  action?: (row: RepAdjustmentRow) => ReactNode;
}) {
  if (rows.length === 0) return <CardEmpty>{empty}</CardEmpty>;
  return (
    <ul className="apple-rows pb-2 [--row-inset:72px]">
      {rows.map((row) => {
        const bonus = row.kind === "BONUS";
        const canceled = !!row.canceledAt;
        const state = stateOf(row);
        return (
          <li key={row.id} className="flex items-center gap-3 px-5 py-3">
            <span
              aria-hidden
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full",
                canceled
                  ? "bg-(--fill-3) text-muted-foreground"
                  : bonus
                    ? "bg-(--sys-green)/14 text-[#248a3d] dark:text-(--sys-green)"
                    : "bg-(--sys-red)/12 text-(--sys-red)",
              )}
            >
              {bonus ? <Gift className="size-[18px]" strokeWidth={2} /> : <Minus className="size-[18px]" strokeWidth={2.4} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">
                {REP_ADJUSTMENT_LABELS[row.kind]}
                <span className="ms-1.5 text-[13px] font-normal text-muted-foreground">{fmtDate(row.createdAt)}</span>
              </p>
              <p className="text-[13px] leading-[18px] text-foreground/80">{row.reason}</p>
              <div className="flex flex-wrap items-center gap-x-2 pt-0.5">
                <StatusText tone={state.tone} className="text-[12px]">
                  {state.label}
                </StatusText>
                {row.cancelReason && <span className="truncate text-[12px] text-muted-foreground">{row.cancelReason}</span>}
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 text-[17px] font-bold tabular-nums",
                canceled ? "font-normal text-muted-foreground line-through" : bonus ? "text-[#248a3d] dark:text-(--sys-green)" : "text-(--sys-red)",
              )}
            >
              {fmtSignedMoney(row.amount)}
            </span>
            {action?.(row)}
          </li>
        );
      })}
    </ul>
  );
}
