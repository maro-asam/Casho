import type { Metadata } from "next";
import { ListChecks } from "lucide-react";

import { GetFeaturesForAdminAction } from "@/actions/admin/admin-plans.actions";
import { Unavailable, PageHeader } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { th, theadRow } from "../_components/admin-ui";
import { CreateFeatureDialog } from "./_components/create-feature-dialog";
import { FeatureRow } from "./_components/FeatureRow";

export const metadata: Metadata = { title: "الميزات" };

export default async function AdminFeaturesPage() {
  const [features, usage] = await Promise.all([
    GetFeaturesForAdminAction(),
    prisma.planFeature.groupBy({ by: ["featureId"], where: { enabled: true }, _count: { _all: true } }),
  ]);
  const plansPerFeature = new Map(usage.map((u) => [u.featureId, u._count._all]));
  const nextSortOrder = features.reduce((m, f) => Math.max(m, f.sortOrder), 0) + 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الميزات"
        description="كل ميزة بتتحكم فيها الباقات. الميزة المخفية مش بتظهر في مقارنة الباقات — اظهرها بعد ما تتبني فعلًا في المنتج."
        actions={<CreateFeatureDialog nextSortOrder={nextSortOrder} />}
      />

      <section className="apple-card overflow-hidden">
        {features.length === 0 ? (
          <Unavailable icon={ListChecks} title="مفيش ميزات لسه" description="أضف أول ميزة وبعدين فعّلها في الباقات." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={cn(th, "ps-4")}>المفتاح</th>
                  <th className={th}>الاسم</th>
                  <th className={cn(th, "hidden lg:table-cell")}>الوصف</th>
                  <th className={th}>الوحدة</th>
                  <th className={th}>ظاهرة</th>
                  <th className={th}>الترتيب</th>
                  <th className={cn(th, "pe-4")} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {features.map((feature) => (
                  <FeatureRow key={feature.id} feature={feature} planCount={plansPerFeature.get(feature.id) ?? 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
