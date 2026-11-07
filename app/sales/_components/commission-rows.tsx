import { Gift, Repeat, UserPlus } from "lucide-react";
import { StatusText } from "@/components/saas-page";
import type { listCommissions } from "@/lib/sales/queries";
import { CAMPAIGN_REASON_LABELS, type CampaignReason } from "@/lib/sales/campaign";
import { formatRateBps } from "@/lib/sales/rules";
import { COMMISSION_STATUS_META, KIND_LABELS, fmtDate, fmtMoney } from "@/lib/sales/format";
import { cn } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listCommissions>>["rows"][number];

const netOf = (row: Row) => row.amount + row.adjustments.reduce((s, a) => s + a.amount, 0);

/** One row per commission: who paid, how it was computed, what you get and where it stands. */
export function CommissionRows({ rows }: { rows: Row[] }) {
  return (
    <ul className="apple-rows border-t-[0.5px] border-border [--row-inset:72px]">
      {rows.map((row) => {
        const customer = row.attribution.customer;
        const title = customer.stores[0]?.name ?? customer.name ?? customer.email;
        const bonus = row.kind === "BONUS";
        const Icon = bonus ? Gift : row.kind === "ACQUISITION" ? UserPlus : Repeat;
        const tile = bonus
          ? "bg-[#ffd60a]/22 text-[#b25000] dark:text-[#ffd60a]"
          : row.kind === "ACQUISITION"
            ? "bg-primary/12 text-primary"
            : "bg-(--sys-teal)/14 text-[#008b94] dark:text-(--sys-teal)";
        const campaignLabel = row.campaignReason ? CAMPAIGN_REASON_LABELS[row.campaignReason as CampaignReason | "BONUS"] : null;
        const net = netOf(row);
        const muted = row.status === "REJECTED" || row.status === "REVERSED";
        return (
          <li key={row.id} className="flex items-center gap-3 px-5 py-3">
            <span
              aria-hidden
              className={cn("grid size-10 shrink-0 place-items-center rounded-full", tile)}
            >
              <Icon className="size-[18px]" strokeWidth={2} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{bonus ? (campaignLabel ?? KIND_LABELS.BONUS) : title}</p>
              <p className="truncate text-[13px] text-muted-foreground">
                {bonus ? (
                  <>اتحقق مع دفعة {title} · {fmtDate(row.paymentAt)}</>
                ) : (
                  <>
                    {KIND_LABELS[row.kind]} · <span dir="ltr">{formatRateBps(row.rateBps)}</span> من {fmtMoney(row.basisAmount)} · {fmtDate(row.paymentAt)}
                  </>
                )}
              </p>
              {campaignLabel && !bonus && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-foreground/75">
                  <span aria-hidden className="size-1.5 rounded-full bg-[#a855f7]" />
                  {campaignLabel}
                </p>
              )}
              {(row.statusReason || row.payout || row.adjustments.length > 0) && (
                <p className="truncate text-[12px] text-muted-foreground">
                  {row.payout && `اتصرفت ${fmtDate(row.payout.paidAt)}`}
                  {row.adjustments.length > 0 && `${row.payout ? " · " : ""}أصلية ${fmtMoney(row.amount)} و${row.adjustments.length} تسوية`}
                  {row.statusReason && `${row.payout || row.adjustments.length ? " · " : ""}${row.statusReason}`}
                </p>
              )}
            </div>

            <div className="shrink-0 space-y-0.5 text-end">
              <p className={cn("text-[17px] leading-[22px] font-bold tabular-nums", muted && "text-muted-foreground line-through")}>
                {fmtMoney(net)}
              </p>
              <StatusText tone={COMMISSION_STATUS_META[row.status].tone} className="text-[12px]">
                {COMMISSION_STATUS_META[row.status].label}
              </StatusText>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
