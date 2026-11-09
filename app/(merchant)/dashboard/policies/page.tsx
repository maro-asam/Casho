import type { Metadata } from "next";
import { Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, Unavailable } from "@/components/saas-page";
import { storePublicUrl } from "@/helpers/BuildStoreURL";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { prisma } from "@/lib/prisma";
import { POLICY_TYPES, buildPolicyTemplate, policyPath, resolvePolicy } from "@/lib/store-policies";
import { loadStorePolicies } from "@/lib/store-policies/server";
import PoliciesEditor, { type EditablePolicy } from "./_components/PoliciesEditor";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("السياسات القانونية") };
}

export default async function PoliciesRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true },
  });
  const data = store ? await loadStorePolicies(store.id) : null;

  if (!store || !data) {
    return (
      <div dir={tdir()} className="apple-card">
        <Unavailable icon={Store} title={tr("لا يوجد متجر")} description={tr("يجب إنشاء متجر أولًا قبل تعديل الإعدادات.")} />
      </div>
    );
  }

  const policies: EditablePolicy[] = POLICY_TYPES.map((type) => {
    const policy = resolvePolicy(data.stored, type, data.context);
    return {
      type,
      body: policy.body,
      isTemplate: policy.isTemplate,
      hidden: policy.hidden,
      updatedAt: policy.updatedAt,
      template: buildPolicyTemplate(type, data.context),
      url: storePublicUrl(store, policyPath(type)),
    };
  });

  return (
    <div dir={tdir()} className="space-y-8">
      <LargeTitle
        eyebrow={<p className="text-[13px] font-semibold text-muted-foreground">{tr("المتجر")}</p>}
        title={tr("السياسات القانونية")}
        subtitle={tr("صفحات الاسترجاع والشحن والخصوصية والشروط اللي بتظهر في متجرك.")}
      />
      <PoliciesEditor policies={policies} requireTermsAtCheckout={data.requireTermsAtCheckout} />
    </div>
  );
}
