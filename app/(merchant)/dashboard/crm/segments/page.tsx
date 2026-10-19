import { Metadata } from "next";
import { Layers2, Users, Plus, RefreshCw } from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetSegmentsAction } from "@/actions/crm/customer-segments.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SegmentsClient } from "./_components/SegmentsClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("شرائح العملاء — CRM") };
}

export default async function SegmentsPage() {
  await loadDashboardLocale();
  const segments = await GetSegmentsAction();

  return (
    <div className="space-y-6" dir={tdir()}>
      <DashboardSectionHeader
        icon={Layers2}
        title={tr("شرائح العملاء")}
        description={tr("صنّف عملاءك في مجموعات ذكية لاستهداف أفضل")}
        badge={segments.length}
      />
      <SegmentsClient segments={segments} />
    </div>
  );
}
