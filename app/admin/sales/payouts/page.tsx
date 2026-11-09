import Link from "next/link";
import { Banknote } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { KpiStrip } from "@/app/admin/_components/admin-ui";
import { Card, StatusText, Unavailable } from "@/components/saas-page";
import { CardEmpty, Monogram } from "@/components/sales/sales-summary";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime, fmtMoney, fmtNum } from "@/lib/sales/format";
import { getPayableItems, listPayouts } from "@/lib/sales/queries";
import { RecordPayoutDialog } from "../_components/sales-dialogs";

export default async function AdminSalesPayoutsPage() {
  await requireAdmin();

  const reps = await prisma.salesRep.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, user: { select: { name: true, email: true } } },
  });
  const [payables, payouts, paid] = await Promise.all([
    Promise.all(reps.map((r) => getPayableItems(prisma, r.id))),
    listPayouts({ all: true }, 100),
    prisma.salesPayout.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
  ]);

  // Who's owed the most comes first; nothing owed sinks to the bottom.
  const rows = reps.map((rep, i) => ({ rep, payable: payables[i] })).sort((a, b) => b.payable.total - a.payable.total);
  const owedTotal = rows.reduce((s, r) => s + Math.max(0, r.payable.total), 0);
  const owedCount = rows.filter((r) => r.payable.total > 0).length;
  const last = payouts[0];

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          {
            label: "مستحق دلوقتي",
            value: fmtMoney(owedTotal),
            hint: owedCount > 0 ? `لـ ${fmtNum(owedCount)} ${owedCount === 1 ? "مندوب" : "مندوبين"}` : "مفيش حد مستني صرف",
          },
          {
            label: "اتصرف من أول يوم",
            value: fmtMoney(paid._sum.amount ?? 0),
            hint: `على ${fmtNum(paid._count._all)} تحويل`,
          },
          {
            label: "آخر صرف",
            value: last ? fmtMoney(last.amount) : "—",
            hint: last ? `${last.salesRep.user.name ?? last.salesRep.user.email} · ${fmtDate(last.paidAt)}` : "لسه مفيش صرف",
          },
        ]}
      />

      <Card
        title="المستحق لكل مندوب"
        subtitle="العمولات المعتمدة اللي لسه متصرفتش ± التسويات. سجّل الصرف بعد التحويل الفعلي — تغيير الحالة لوحده مش معناه إن الفلوس وصلت."
      >
        {rows.length === 0 ? (
          <CardEmpty>مفيش مندوبين لسه.</CardEmpty>
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:72px]">
            {rows.map(({ rep, payable }) => {
              const name = rep.user.name ?? rep.user.email;
              const owed = payable.total > 0;
              return (
                <li key={rep.id} className="flex items-center gap-3 px-5 py-3">
                  <Monogram name={name} muted={rep.status === "DISABLED"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        href={`/admin/sales/reps/${rep.id}`}
                        className="truncate text-[15px] font-semibold hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {name}
                      </Link>
                      {rep.status === "DISABLED" && (
                        <StatusText tone="danger" className="text-[12px]">
                          موقوف
                        </StatusText>
                      )}
                    </div>
                    <p className="text-[13px] text-muted-foreground tabular-nums">
                      {owed
                        ? `${fmtNum(payable.commissionIds.length)} عمولة${payable.adjustmentIds.length ? ` · ${fmtNum(payable.adjustmentIds.length)} تسوية` : ""}`
                        : "مفيش مستحقات"}
                    </p>
                  </div>
                  <span className={owed ? "text-[17px] font-bold tabular-nums" : "text-[15px] text-muted-foreground tabular-nums"}>
                    {fmtMoney(payable.total)}
                  </span>
                  <RecordPayoutDialog salesRepId={rep.id} repName={name} payable={payable.total} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="سجل الصرف" subtitle="آخر ١٠٠ تحويل متسجل، الأحدث الأول.">
        {payouts.length === 0 ? (
          <Unavailable icon={Banknote} title="مفيش صرف متسجل لسه" description="أول ما تسجّل تحويل لمندوب هيظهر هنا بتاريخه ومرجعه." className="py-12" />
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:72px]">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-(--sys-green)/14 text-[#248a3d] dark:text-(--sys-green)">
                  <Banknote className="size-[18px]" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{p.salesRep.user.name ?? p.salesRep.user.email}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {fmtDate(p.paidAt)} · {p.method}
                    {p.reference && (
                      <>
                        {" · "}
                        <span dir="ltr" className="font-mono text-[12px]">
                          {p.reference}
                        </span>
                      </>
                    )}
                  </p>
                  {p.note && <p className="truncate text-[12px] text-foreground/75">{p.note}</p>}
                </div>
                <div className="hidden w-44 shrink-0 md:block">
                  <p className="text-[13px] text-foreground/80 tabular-nums">
                    {fmtNum(p._count.commissions)} عمولة{p._count.adjustments ? ` · ${fmtNum(p._count.adjustments)} تسوية` : ""}
                  </p>
                  <p className="text-[12px] text-muted-foreground">سُجّل {fmtDateTime(p.createdAt)}</p>
                </div>
                <span className="w-28 shrink-0 text-end text-[17px] font-bold tabular-nums">{fmtMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
