import type { ReactNode } from "react";
import { Gift, Repeat, UserPlus } from "lucide-react";
import { StatusText } from "@/components/saas-page";
import type { listCommissions } from "@/lib/sales/queries";
import { CAMPAIGN_REASON_LABELS, type CampaignReason } from "@/lib/sales/campaign";
import { formatRateBps, type SalesTier } from "@/lib/sales/rules";
import { COMMISSION_STATUS_META, KIND_LABELS, fmtCohort, fmtDate, fmtEligibleThrough, fmtMoney, fmtNum } from "@/lib/sales/format";
import { cn } from "@/lib/utils";
import { TIER } from "./tier";

type Row = Awaited<ReturnType<typeof listCommissions>>["rows"][number];

const netOf = (row: Row) => row.amount + row.adjustments.reduce((s, a) => s + a.amount, 0);

/** Kind glyph on a tinted circle — acquisition in the brand tint, renewal teal, bonus yellow. */
const KIND_TILE: Record<Row["kind"], { icon: typeof Gift; className: string }> = {
  ACQUISITION: { icon: UserPlus, className: "bg-primary/12 text-primary" },
  RENEWAL: { icon: Repeat, className: "bg-(--sys-teal)/14 text-[#008b94] dark:text-(--sys-teal)" },
  BONUS: { icon: Gift, className: "bg-[#ffd60a]/22 text-[#b25000] dark:text-[#ffd60a]" },
};

/**
 * Commission snapshots as rows: who paid, how it was computed, the net and where it stands.
 * Admin rows also show the rep, the tier position and the ledger reference; `actions` renders the row menu.
 */
export function CommissionsTable({ rows, showRep = false, actions }: { rows: Row[]; showRep?: boolean; actions?: (row: Row) => ReactNode }) {
  return (
    <ul className="apple-rows [--row-inset:72px]">
      {rows.map((row) => {
        const customer = row.attribution.customer;
        const title = customer.stores[0]?.name ?? customer.name ?? customer.email;
        const bonus = row.kind === "BONUS";
        const tile = KIND_TILE[row.kind];
        const Icon = tile.icon;
        const campaignLabel = row.campaignReason ? CAMPAIGN_REASON_LABELS[row.campaignReason as CampaignReason | "BONUS"] : null;
        const net = netOf(row);
        const dead = row.status === "REJECTED" || row.status === "REVERSED";
        const repName = row.salesRep.user.name ?? row.salesRep.user.email;
        const notes = [
          row.payout && `اتصرفت ${fmtDate(row.payout.paidAt)}`,
          row.adjustments.length > 0 && `أصلية ${fmtMoney(row.amount)} و${fmtNum(row.adjustments.length)} تسوية`,
          row.statusReason,
        ].filter(Boolean);

        return (
          <li key={row.id} className="flex items-center gap-3 px-5 py-3">
            <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full", tile.className)}>
              <Icon className="size-[18px]" strokeWidth={2} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{bonus ? (campaignLabel ?? KIND_LABELS.BONUS) : title}</p>
              <p className="truncate text-[13px] text-muted-foreground">
                {bonus ? (
                  <>اتحقق مع دفعة {title}</>
                ) : (
                  <>
                    {KIND_LABELS[row.kind]} · <span dir="ltr">{formatRateBps(row.rateBps)}</span> من {fmtMoney(row.basisAmount)}
                  </>
                )}
                {" · "}
                {fmtDate(row.paymentAt)}
                {showRep && <span className="sm:hidden"> · {repName}</span>}
              </p>
              {campaignLabel && !bonus && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-foreground/75">
                  <span aria-hidden className="size-1.5 rounded-full bg-[#a855f7]" />
                  {campaignLabel}
                </p>
              )}
              {notes.length > 0 && (
                <p className="truncate text-[12px] text-muted-foreground" title={row.adjustments.map((a) => `${fmtMoney(a.amount)} — ${a.reason}`).join("\n") || undefined}>
                  {notes.join(" · ")}
                </p>
              )}
            </div>

            {showRep && (
              <div className="hidden w-36 shrink-0 sm:block">
                <p className="truncate text-[15px]">{repName}</p>
                {row.tier && (
                  <p className={cn("flex items-center gap-1.5 truncate text-[12px] text-muted-foreground", TIER[row.tier as SalesTier].color)}>
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-(--tier)" />
                    {TIER[row.tier as SalesTier].number} · العميل {fmtNum(row.customerPosition ?? 0)}
                  </p>
                )}
              </div>
            )}

            <div className="hidden w-44 shrink-0 lg:block">
              <p className="truncate text-[13px] text-foreground/80">دفعة {fmtCohort(row.cohortMonth)}</p>
              <p className="truncate text-[12px] text-muted-foreground">مؤهل لحد {fmtEligibleThrough(row.eligibleUntil)}</p>
              <p dir="ltr" className="text-right font-mono text-[11px] text-(--label-3)" title="مرجع حركة الرصيد (SUBSCRIPTION_CHARGE)">
                {row.balanceTransactionId.slice(0, 8)}
              </p>
            </div>

            <div className="shrink-0 space-y-0.5 text-end sm:w-28">
              <p className={cn("text-[17px] leading-[22px] font-bold tabular-nums", dead && "font-semibold text-muted-foreground line-through")}>
                {fmtMoney(net)}
              </p>
              <StatusText tone={COMMISSION_STATUS_META[row.status].tone} className="text-[12px]">
                {COMMISSION_STATUS_META[row.status].label}
              </StatusText>
            </div>

            {actions && <div className="flex w-9 shrink-0 justify-center">{actions(row)}</div>}
          </li>
        );
      })}
    </ul>
  );
}
