import Link from "next/link";
import { HandCoins } from "lucide-react";
import { Card, StatusText } from "@/components/saas-page";
import { Monogram } from "@/components/sales/sales-summary";
import { fmtDateTime, fmtMoney } from "@/lib/sales/format";
import type { listPendingWithdrawals } from "@/lib/sales/queries";
import { RecordPayoutDialog, RejectWithdrawalDialog } from "./sales-dialogs";

type Pending = Awaited<ReturnType<typeof listPendingWithdrawals>>[number];

/**
 * Open "طلب سحب الأرباح" requests: where to send the money, then record the
 * transfer (settles the request) or reject it with a reason. Hidden when empty.
 * `payables` = each rep's payable now, by salesRepId.
 */
export function WithdrawalRequests({ requests, payables, showRep = true }: { requests: Pending[]; payables: Map<string, number>; showRep?: boolean }) {
  if (!requests.length) return null;
  return (
    <Card
      title="طلبات سحب مستنية"
      subtitle="حوّل على الحساب اللي المندوب كتبه، وبعدين سجّل الصرف — ده بيقفل الطلب ويبعتله إشعار."
      icon={HandCoins}
    >
      <ul className="apple-rows pb-2 [--row-inset:72px]">
        {requests.map((r) => {
          const name = r.salesRep.user.name ?? r.salesRep.user.email;
          const payable = payables.get(r.salesRepId) ?? 0;
          return (
            <li key={r.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {showRep && <Monogram name={name} muted={r.salesRep.status === "DISABLED"} />}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                    {showRep && (
                      <Link href={`/admin/sales/reps/${r.salesRepId}`} className="truncate text-[15px] font-semibold hover:underline">
                        {name}
                      </Link>
                    )}
                    <StatusText tone="warning">طلب {fmtMoney(r.amount)}</StatusText>
                  </div>
                  <p className="text-[14px]">
                    {r.method}:{" "}
                    <bdi dir="auto" className="font-mono text-[13px] select-all">
                      {r.account}
                    </bdi>
                  </p>
                  {r.note && <p className="text-[13px] text-foreground/75">{r.note}</p>}
                  <p className="text-[12px] text-muted-foreground">
                    {fmtDateTime(r.createdAt)}
                    {payable !== r.amount && ` · المستحق دلوقتي ${fmtMoney(payable)}`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <RejectWithdrawalDialog requestId={r.id} repName={name} amount={r.amount} />
                <RecordPayoutDialog
                  salesRepId={r.salesRepId}
                  repName={name}
                  payable={payable}
                  request={{ amount: r.amount, method: r.method, account: r.account, note: r.note }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
