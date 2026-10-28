import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { Unavailable, StatusText } from "@/components/saas-page";
import { CopyButton } from "@/components/sales/copy-button";
import { CommissionBreakdown, ExpiringCohorts, Panel, SalesKpis } from "@/components/sales/sales-summary";
import { buildReferralLink } from "@/lib/sales/attribution";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/sales/format";
import { getSalesSummary, listSalesReps } from "@/lib/sales/queries";
import { TIER_LABELS } from "@/lib/sales/rules";
import { CreateRepDialog } from "./_components/sales-dialogs";

export default async function AdminSalesPage() {
  await requireAdmin();
  const [summary, reps] = await Promise.all([getSalesSummary({ all: true }), listSalesReps()]);

  return (
    <div className="space-y-6">
      <SalesKpis summary={summary} scope="program" />

      <Panel
        title="المندوبين"
        description="المستوى بيتحسب من عدد العملاء المؤهلين حاليًا. الإيراد = اشتراكات العملاء المنسوبين حاليًا (خصم − مرتجع)."
        actions={<CreateRepDialog />}
        flush
      >
        {reps.length === 0 ? (
          <Unavailable icon={Users} title="مفيش مندوبين لسه" description="ضيف أول مندوب وابعتله رابط الدخول من صفحته." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="h-9 border-b-[0.5px] border-border text-right text-[13px] text-muted-foreground">
                  <th className="ps-4 font-medium">المندوب</th>
                  <th className="font-medium">رابط إحالة التجار</th>
                  <th className="font-medium">المستوى</th>
                  <th className="font-medium">تسجيلات</th>
                  <th className="font-medium">مكتسبين</th>
                  <th className="font-medium">مؤهلين</th>
                  <th className="hidden font-medium lg:table-cell">التحويل</th>
                  <th className="hidden text-left font-medium xl:table-cell">الإيراد</th>
                  <th className="text-left font-medium">اكتساب / تجديد</th>
                  <th className="pe-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {reps.map((rep) => (
                  <tr key={rep.id} className="transition hover:bg-muted/30">
                    <td className="py-3 ps-4">
                      <p className="font-medium">{rep.user.name ?? rep.user.email}</p>
                      <p dir="ltr" className="text-right text-xs text-muted-foreground">
                        {rep.user.email}
                      </p>
                      {rep.status === "DISABLED" && <StatusText tone="danger" className="mt-1">موقوف</StatusText>}
                    </td>
                    <td className="py-3">
                      {rep.user.referralCode && (
                        <div className="flex items-center gap-2">
                          <code dir="ltr" className="font-mono text-xs">
                            {rep.user.referralCode}
                          </code>
                          <CopyButton value={buildReferralLink(rep.user.referralCode)} label="رابط التجار" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-xs">{TIER_LABELS[rep.level]}</td>
                    <td className="py-3 tabular-nums">{fmtNum(rep.signups)}</td>
                    <td className="py-3 tabular-nums">{fmtNum(rep.acquired)}</td>
                    <td className="py-3 tabular-nums">{fmtNum(rep.eligible)}</td>
                    <td className="hidden py-3 tabular-nums lg:table-cell">{fmtPct(rep.conversionRate)}</td>
                    <td className="hidden py-3 text-left tabular-nums xl:table-cell">{fmtMoney(rep.revenueNet)}</td>
                    <td className="py-3 text-left text-xs tabular-nums">
                      {fmtMoney(rep.acquisitionCommissions)}
                      <span className="block text-muted-foreground">{fmtMoney(rep.renewalCommissions)}</span>
                    </td>
                    <td className="py-3 pe-4 text-left">
                      <Link href={`/admin/sales/reps/${rep.id}`} className="apple-press relative z-10 inline-flex h-8 items-center gap-1 rounded-full bg-muted px-3 text-[13px] text-primary hover:bg-muted/70">
                        التفاصيل <ArrowUpRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <CommissionBreakdown summary={summary} />
        <ExpiringCohorts summary={summary} />
      </div>
    </div>
  );
}
