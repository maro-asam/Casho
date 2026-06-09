import { Metadata } from "next";
import { Layers2, Users, Plus, RefreshCw } from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetSegmentsAction } from "@/actions/crm/customer-segments.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SegmentsClient } from "./_components/SegmentsClient";

export const metadata: Metadata = { title: "شرائح العملاء — CRM" };

export default async function SegmentsPage() {
  const segments = await GetSegmentsAction();

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Layers2}
        title="شرائح العملاء"
        description="صنّف عملاءك في مجموعات ذكية لاستهداف أفضل"
        badge={segments.length}
      />
      <SegmentsClient segments={segments} />
    </div>
  );
}
