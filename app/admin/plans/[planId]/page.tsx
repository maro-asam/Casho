import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GetPlanWithFeaturesForAdminAction } from "@/actions/admin/admin-plans.actions";
import { PlanMetadataForm } from "./_components/PlanMetadataForm";
import { PlanFeatureMatrix } from "./_components/PlanFeatureMatrix";

export const metadata: Metadata = { title: "تعديل الباقة — أدمن" };

export default async function AdminPlanEditorPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const { plan, rows } = await GetPlanWithFeaturesForAdminAction(planId);

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <Link href="/admin/plans" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-3.5" />
          كل الباقات
        </Link>
        <h1 className="text-2xl font-bold">{plan.name}</h1>
      </div>

      <PlanMetadataForm plan={plan} />
      <PlanFeatureMatrix planId={plan.id} rows={rows} />
    </div>
  );
}
