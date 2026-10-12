import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { StatusPill } from "@/components/saas-page";
import { Panel } from "@/components/sales/sales-summary";
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
  const [payables, payouts] = await Promise.all([
    Promise.all(reps.map((r) => getPayableItems(prisma, r.id))),
    listPayouts({ all: true }, 100),
  ]);

  return (
    <div className="space-y-6">
      <Panel
        title="المستحق لكل مندوب"
        description="العمولات المعتمدة غير المدفوعة ± التسويات. الصرف بيتسجل بعد التحويل الفعلي — تغيير الحالة لوحده مش معناه إن الفلوس اتدفعت."
        flush
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 bg-muted/40 text-right text-xs text-muted-foreground">
              <th className="ps-4 font-medium">المندوب</th>
              <th className="font-medium">بنود</th>
              <th className="text-left font-medium">المستحق</th>
              <th className="pe-4" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {reps.map((rep, i) => {
              const p = payables[i];
              const name = rep.user.name ?? rep.user.email;
              return (
                <tr key={rep.id}>
                  <td className="py-3 ps-4">
                    {name}
                    {rep.status === "DISABLED" && <StatusPill tone="danger" className="ms-2">موقوف</StatusPill>}
                  </td>
                  <td className="py-3 tabular-nums text-muted-foreground">
                    {fmtNum(p.commissionIds.length)} عمولة · {fmtNum(p.adjustmentIds.length)} تسوية
                  </td>
                  <td className="py-3 text-left font-medium tabular-nums">{fmtMoney(p.total)}</td>
                  <td className="py-3 pe-4 text-left">
                    <RecordPayoutDialog salesRepId={rep.id} repName={name} payable={p.total} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel title="سجل الصرف" description="آخر 100 عملية صرف مسجلة." flush>
        {payouts.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">مفيش صرف متسجل لسه.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="h-10 bg-muted/40 text-right text-xs text-muted-foreground">
                  <th className="ps-4 font-medium">التاريخ</th>
                  <th className="font-medium">المندوب</th>
                  <th className="font-medium">الطريقة والمرجع</th>
                  <th className="hidden font-medium md:table-cell">البنود</th>
                  <th className="pe-4 text-left font-medium">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 ps-4">
                      {fmtDate(p.paidAt)}
                      <span className="block text-xs text-muted-foreground">سُجّل {fmtDateTime(p.createdAt)}</span>
                    </td>
                    <td className="py-3">{p.salesRep.user.name ?? p.salesRep.user.email}</td>
                    <td className="py-3">
                      {p.method}
                      {p.reference && (
                        <span dir="ltr" className="block text-right font-mono text-xs text-muted-foreground">
                          {p.reference}
                        </span>
                      )}
                      {p.note && <span className="block text-xs text-muted-foreground">{p.note}</span>}
                    </td>
                    <td className="hidden py-3 text-xs text-muted-foreground md:table-cell">
                      {fmtNum(p._count.commissions)} عمولة · {fmtNum(p._count.adjustments)} تسوية
                    </td>
                    <td className="py-3 pe-4 text-left font-medium tabular-nums">{fmtMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
