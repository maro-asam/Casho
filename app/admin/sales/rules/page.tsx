import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { Card, Tag } from "@/components/saas-page";
import { AuditRows, CardEmpty, TierLadder } from "@/components/sales/sales-summary";
import { prisma } from "@/lib/prisma";
import { getCommissionRuleAt } from "@/lib/sales/engine";
import { fmtDateTime, fmtNum } from "@/lib/sales/format";
import { listSalesAuditLog } from "@/lib/sales/queries";
import { formatRateBps } from "@/lib/sales/rules";
import { AUDIT_LABELS } from "../_components/audit-labels";
import { RulesForm } from "../_components/rules-form";

/** The written policy as a numbered list — one rule per row. */
function PolicyCard({ policy }: { policy: string[] }) {
  return (
    <Card title="إزاي العمولة بتتحسب" subtitle="السياسة المطبّقة في الكود (lib/sales/rules.ts).">
      <ol className="apple-rows pb-2 [--row-inset:56px]">
        {policy.map((line, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-2.5">
            <span
              aria-hidden
              className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-(--fill-3) text-[12px] font-semibold text-foreground/80 tabular-nums"
            >
              {fmtNum(i + 1)}
            </span>
            <p className="text-[15px] leading-[22px]">{line}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default async function AdminSalesRulesPage() {
  await requireAdmin();
  const [current, history, audit] = await Promise.all([
    getCommissionRuleAt(prisma),
    prisma.salesCommissionRule.findMany({ orderBy: { effectiveFrom: "desc" }, take: 20 }),
    listSalesAuditLog({}, 100),
  ]);
  const since = history.find((r) => r.id === current.id)?.effectiveFrom;

  const policy = [
    "الأساس = مبلغ خصم الاشتراك من رصيد المتجر بالقرش (جنيه مصري بس، من غير ضرايب أو رسوم).",
    "الاكتساب = أول خصم اشتراك في عمر حساب التاجر — مرة واحدة بس حتى لو عنده أكتر من متجر.",
    "نسبة الاكتساب حسب ترتيب العميل وسط عملاء المندوب المؤهلين وقت الدفع (عدد المؤهلين + ١) — شرائح، مش بأثر رجعي.",
    "التجديد = أي خصم اشتراك بعد الأول (بما فيه فرق الترقية) قبل نهاية أهلية العميل.",
    `الأهلية من شهر أول دفعة (توقيت القاهرة) لحد أول يوم في الشهر رقم ${fmtNum(current.eligibilityMonths)} بعده.`,
    "مرتجع رصيد بعد تخفيض الباقة بيعمل تسوية سالبة = المرتجع × نسبة آخر عمولة قبله، والصافي مبيقلش عن صفر.",
    "العمولات بتتعتمد تلقائيًا. لو المندوب موقوف بتتسجل معلّقة.",
  ];

  return (
    <div className="space-y-6">
      {/* What's in force (and why) on one side, the editor on the other. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TierLadder rule={current} title="القواعد الحالية" subtitle={since ? `سارية من ${fmtDateTime(since)}` : undefined} />
          <PolicyCard policy={policy} />
        </div>
        <Card title="تعديل القواعد" subtitle="كل حفظ بيعمل نسخة جديدة تبدأ من لحظتها، والقديمة بتفضل في السجل." className="lg:sticky lg:top-24">
          <RulesForm rule={current} />
        </Card>
      </div>

      <Card title="نسخ القواعد" subtitle="آخر ٢٠ نسخة، الأحدث الأول.">
        {history.length === 0 ? (
          <CardEmpty>مفيش نسخ.</CardEmpty>
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:20px]">
            {history.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-semibold">
                    {fmtDateTime(r.effectiveFrom)}
                    {r.id === current.id && <Tag tone="success">الحالية</Tag>}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{r.note ?? "—"}</p>
                </div>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] tabular-nums sm:justify-end">
                  {[
                    ["م١", formatRateBps(r.starterRateBps), `١–${fmtNum(r.starterMaxPosition)}`],
                    ["م٢", formatRateBps(r.growthRateBps), `${fmtNum(r.starterMaxPosition + 1)}–${fmtNum(r.growthMaxPosition)}`],
                    ["م٣", formatRateBps(r.proRateBps), `${fmtNum(r.growthMaxPosition + 1)}+`],
                    ["تجديد", formatRateBps(r.renewalRateBps), `${fmtNum(r.eligibilityMonths)} شهور`],
                  ].map(([k, rate, range]) => (
                    <div key={k} className="flex items-baseline gap-1.5">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd>
                        <span dir="ltr" className="font-semibold">
                          {rate}
                        </span>{" "}
                        <span className="text-muted-foreground">({range})</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="سجل الإجراءات الإدارية والمالية" subtitle="آخر ١٠٠ إجراء على المندوبين والنسب والعمولات والصرف.">
        <AuditRows logs={audit} labels={AUDIT_LABELS} />
      </Card>
    </div>
  );
}
