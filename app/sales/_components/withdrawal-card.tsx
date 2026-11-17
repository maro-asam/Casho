import Link from "next/link";
import { Banknote, ChevronLeft, Clock, History } from "lucide-react";
import { Card, StatusText, appleButton } from "@/components/saas-page";
import { fmtDate, fmtMoney } from "@/lib/sales/format";
import type { RepWithdrawal } from "@/lib/sales/queries";
import { WITHDRAWAL_STATUS_META } from "@/lib/sales/withdrawal";
import { cn } from "@/lib/utils";
import { CancelWithdrawalButton, WithdrawButton } from "./withdrawal";

const openOf = (withdrawals: RepWithdrawal[]) => withdrawals.find((w) => w.status === "PENDING") ?? null;

function IconBubble({ pending }: { pending: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full",
        pending ? "bg-(--sys-orange)/14 text-(--sys-orange)" : "bg-(--sys-green)/14 text-[#248a3d] dark:text-(--sys-green)",
      )}
    >
      {pending ? <Clock className="size-[18px]" strokeWidth={2} /> : <Banknote className="size-[18px]" strokeWidth={2} />}
    </span>
  );
}

/** /sales/commissions: the withdraw button, or the open request with its cancel. */
export function WithdrawalCard({ payable, withdrawals }: { payable: number; withdrawals: RepWithdrawal[] }) {
  const open = openOf(withdrawals);
  return (
    <section aria-label="سحب الأرباح" className="apple-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <IconBubble pending={!!open} />
        {open ? (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">طلبت سحب {fmtMoney(open.amount)} — مستني الإدارة</p>
            <p className="truncate text-[13px] text-muted-foreground">
              {open.method} · <bdi>{open.account}</bdi> · {fmtDate(open.createdAt)}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">{payable > 0 ? `تقدر تسحب ${fmtMoney(payable)} دلوقتي` : "مفيش مستحق تسحبه دلوقتي"}</p>
            <p className="text-[13px] text-muted-foreground">
              {payable > 0
                ? "اختار المحفظة أو الحساب، والإدارة بتحوّل وبيوصلك إشعار."
                : "أول ما عمولة تتعتمد هتقدر تطلب سحبها من هنا."}
            </p>
          </div>
        )}
      </div>
      {open ? <CancelWithdrawalButton requestId={open.id} /> : <WithdrawButton payable={payable} last={withdrawals[0]} className="shrink-0" />}
    </section>
  );
}

/** Overview "فلوسك" card: the same action, compact — an open request links to the details. */
export function WithdrawalInline({ payable, withdrawals }: { payable: number; withdrawals: RepWithdrawal[] }) {
  const open = openOf(withdrawals);
  if (open) {
    return (
      <Link href="/sales/commissions" className={cn(appleButton.tinted, "mt-3 max-w-full")}>
        <Clock className="size-4 shrink-0 text-(--sys-orange)" strokeWidth={2} />
        <span className="truncate">طلب سحب {fmtMoney(open.amount)} مستني الإدارة</span>
        <ChevronLeft className="size-4 shrink-0" strokeWidth={2.2} />
      </Link>
    );
  }
  if (payable <= 0) return null;
  return <WithdrawButton payable={payable} last={withdrawals[0]} className="mt-3 h-10" />;
}

/** Closed requests (paid / rejected / canceled), newest first. */
export function WithdrawalHistory({ withdrawals }: { withdrawals: RepWithdrawal[] }) {
  const closed = withdrawals.filter((w) => w.status !== "PENDING");
  if (!closed.length) return null;
  return (
    <Card title="طلبات السحب" subtitle="اللي طلبته قبل كده وإيه اللي حصل فيه" icon={History}>
      <ul className="apple-rows pb-2 [--row-inset:20px]">
        {closed.map((w) => {
          const meta = WITHDRAWAL_STATUS_META[w.status];
          // The payout settles what's payable when it's recorded, which can differ from what was asked.
          const paidOther = w.payout && w.payout.amount !== w.amount ? w.payout.amount : null;
          return (
            <li key={w.id} className="flex min-h-11 items-start justify-between gap-3 px-5 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="text-[15px]">
                  {fmtDate(w.createdAt)} · {w.method}
                </p>
                <StatusText tone={meta.tone}>{meta.label}</StatusText>
                {w.status === "REJECTED" && w.decisionReason && <p className="text-[13px] text-muted-foreground">السبب: {w.decisionReason}</p>}
                {paidOther !== null && <p className="text-[13px] text-muted-foreground">اتصرف {fmtMoney(paidOther)} — المستحق وقت التحويل</p>}
              </div>
              <span className={cn("shrink-0 text-[17px] font-semibold tabular-nums", w.status !== "PAID" && "text-muted-foreground")}>
                {fmtMoney(w.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
