import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { Panel } from "@/components/sales/sales-summary";
import { prisma } from "@/lib/prisma";
import { getCommissionRuleAt } from "@/lib/sales/engine";
import { fmtDateTime } from "@/lib/sales/format";
import { listSalesAuditLog } from "@/lib/sales/queries";
import { formatRateBps } from "@/lib/sales/rules";
import { AUDIT_LABELS } from "../_components/audit-labels";
import { RulesForm } from "../_components/rules-form";

export default async function AdminSalesRulesPage() {
  await requireAdmin();
  const [current, history, audit] = await Promise.all([
    getCommissionRuleAt(prisma),
    prisma.salesCommissionRule.findMany({ orderBy: { effectiveFrom: "desc" }, take: 20 }),
    listSalesAuditLog({}, 100),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="القواعد الحالية" description="أي تعديل بيتحفظ كنسخة جديدة ويبدأ من لحظة الحفظ.">
          <RulesForm rule={current} />
        </Panel>

        <Panel title="كيف بتتحسب العمولة" description="السياسة المعتمدة المطبّقة في الكود (lib/sales/rules.ts).">
          <ul className="list-disc space-y-2 ps-5 text-sm">
            <li>الأساس = مبلغ خصم الاشتراك من رصيد المتجر بالقرش (جنيه مصري فقط، مفيش ضرائب أو رسوم مسجلة).</li>
            <li>الاكتساب = أول خصم اشتراك في عمر حساب التاجر — مرة واحدة بس حتى لو عنده أكتر من متجر.</li>
            <li>نسبة الاكتساب حسب ترتيب العميل وسط عملاء المندوب المؤهلين وقت الدفع (عدد المؤهلين + 1) — نظام شرائح مش بأثر رجعي.</li>
            <li>التجديد = أي خصم اشتراك بعد الأول (بما فيه فرق الترقية) قبل نهاية أهلية العميل.</li>
            <li>الأهلية: من شهر أول دفعة (توقيت القاهرة) لحد أول يوم في الشهر رقم {current.eligibilityMonths} بعده.</li>
            <li>مرتجع رصيد بعد تخفيض الباقة بيعمل تسوية سالبة = المرتجع × نسبة آخر عمولة قبله (والصافي مبيقلش عن صفر).</li>
            <li>العمولات بتتعتمد تلقائيًا. لو المندوب موقوف بتتسجل معلّقة.</li>
          </ul>
        </Panel>
      </div>

      <Panel title="نسخ القواعد" flush>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="h-10 bg-muted/40 text-right text-xs text-muted-foreground">
                <th className="ps-4 font-medium">من</th>
                <th className="font-medium">المستوى 1</th>
                <th className="font-medium">المستوى 2</th>
                <th className="font-medium">المستوى 3</th>
                <th className="font-medium">التجديد</th>
                <th className="font-medium">الأهلية</th>
                <th className="pe-4 font-medium">السبب</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 ps-4">{fmtDateTime(r.effectiveFrom)}</td>
                  <td className="py-3 tabular-nums">
                    {formatRateBps(r.starterRateBps)} (1–{r.starterMaxPosition})
                  </td>
                  <td className="py-3 tabular-nums">
                    {formatRateBps(r.growthRateBps)} ({r.starterMaxPosition + 1}–{r.growthMaxPosition})
                  </td>
                  <td className="py-3 tabular-nums">
                    {formatRateBps(r.proRateBps)} ({r.growthMaxPosition + 1}+)
                  </td>
                  <td className="py-3 tabular-nums">{formatRateBps(r.renewalRateBps)}</td>
                  <td className="py-3 tabular-nums">{r.eligibilityMonths} شهور</td>
                  <td className="py-3 pe-4 text-xs text-muted-foreground">{r.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="سجل الإجراءات الإدارية والمالية" description="آخر 100 إجراء على المندوبين والنسب والعمولات والصرف." flush>
        <ul className="divide-y text-sm">
          {audit.map((log) => (
            <li key={log.id} className="px-4 py-2.5">
              <p>
                {AUDIT_LABELS[log.action] ?? log.action}
                <span className="ms-2 text-xs text-muted-foreground">
                  {log.actor ? log.actor.name ?? log.actor.email : "النظام"} · {fmtDateTime(log.createdAt)}
                </span>
              </p>
              {log.reason && <p className="text-xs text-muted-foreground">السبب: {log.reason}</p>}
            </li>
          ))}
          {audit.length === 0 && <li className="p-4 text-muted-foreground">مفيش إجراءات لسه.</li>}
        </ul>
      </Panel>
    </div>
  );
}
