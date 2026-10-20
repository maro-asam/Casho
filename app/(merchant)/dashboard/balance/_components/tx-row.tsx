import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { BalanceTransactionType } from "@prisma/client";

import { toneDotClass } from "@/components/saas-page";
import { formatMoney, formatSigned, txMeta } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { tr, trv } from "@/lib/i18n/dashboard";

export type TxRowData = {
  id: string;
  type: BalanceTransactionType;
  amount: number;
  note: string | null;
  reference?: string | null;
  balanceBefore?: number;
  balanceAfter: number;
};

/** Wallet-style transaction row: tone-colored glyph, label + note, signed amount trailing. */
export function TxRow({ t, date, showBefore }: { t: TxRowData; date: string; showBefore?: boolean }) {
  const meta = txMeta(t.type);
  const credit = t.amount > 0;
  const Icon = credit ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-white", toneDotClass(meta.tone))}>
        <Icon className="size-[18px]" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{meta.label}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {t.note ? `${trv(t.note)} · ${date}` : date}
          {t.reference && (
            <span className="font-mono" dir="ltr">
              {" "}#{t.reference.slice(0, 10)}
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-end">
        <p dir="ltr" className={cn("text-[15px] font-semibold tabular-nums", credit && "text-(--sys-green)")}>
          {formatSigned(t.amount)}
        </p>
        <p className="text-[12px] text-muted-foreground tabular-nums">
          {showBefore && t.balanceBefore !== undefined && <span className="hidden lg:inline">{formatMoney(t.balanceBefore)} ← </span>}
          {tr("الرصيد {0}", formatMoney(t.balanceAfter))}
        </p>
      </div>
    </li>
  );
}
