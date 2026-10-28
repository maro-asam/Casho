import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GetPlanWithFeaturesForAdminAction } from "@/actions/admin/admin-plans.actions";
import { StatusText } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { BackLink, Panel, PanelEmpty } from "../../_components/admin-ui";
import { fmtNum, fmtRelative } from "../../_lib/format";
import { PlanFeatureMatrix } from "./_components/PlanFeatureMatrix";
import { PlanMetadataForm } from "./_components/PlanMetadataForm";

export const metadata: Metadata = { title: "تعديل الباقة" };

const AUDIT_LABELS: Record<string, string> = {
  plan_created: "اتعملت الباقة",
  plan_updated: "تعديل بيانات الباقة",
  plan_feature_updated: "تعديل ميزة",
  admin_plan_assigned: "الأدمن نقل متجر للباقة",
  subscription_upgraded: "متجر رقّى للباقة",
  subscription_downgraded: "متجر نزل للباقة",
  subscription_selected: "متجر اختار الباقة",
};

export default async function AdminPlanEditorPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const data = await GetPlanWithFeaturesForAdminAction(planId).catch(() => null);
  if (!data) notFound();
  const { plan, rows } = data;

  const [storeCount, audit] = await Promise.all([
    prisma.store.count({ where: { planId: plan.id } }),
    prisma.planAuditLog.findMany({
      where: { planId: plan.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, action: true, createdAt: true, actor: { select: { name: true, email: true } }, store: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <BackLink href="/admin/plans">كل الباقات</BackLink>

      <header className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
          <StatusText tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "ظاهرة" : "مخفية"}</StatusText>
          {!plan.pricingConfigured && <StatusText tone="warning">السعر مش مؤكد</StatusText>}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono" dir="ltr">
            {plan.key}
          </span>{" "}
          · {fmtNum(storeCount)} متجر على الباقة دي
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PlanMetadataForm plan={plan} />
          <PlanFeatureMatrix planId={plan.id} rows={rows} />
        </div>
        <Panel title="سجل التغييرات" flush className="h-fit">
          {audit.length === 0 ? (
            <PanelEmpty>مفيش تغييرات مسجلة.</PanelEmpty>
          ) : (
            <ol className="divide-y divide-border text-sm">
              {audit.map((a) => (
                <li key={a.id} className="px-4 py-2.5">
                  <p className="font-medium">{AUDIT_LABELS[a.action] ?? a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.store?.name ?? (a.actor ? (a.actor.name ?? a.actor.email) : "النظام")} · {fmtRelative(a.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
