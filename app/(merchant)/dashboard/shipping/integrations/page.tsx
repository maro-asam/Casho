import { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetShippingIntegrationsAction } from "@/actions/shipping-integrations.actions";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import ShippingIntegrationsClient from "./_components/ShippingIntegrationsClient";

export const metadata: Metadata = {
  title: "ربط شركات الشحن",
  description: "ربط حسابات Bosta و Aramex لإنشاء بوالص الشحن تلقائياً",
};

export default async function ShippingIntegrationsPage() {
  await requireUserId();
  const integrations = await GetShippingIntegrationsAction();

  const connected = Object.fromEntries(
    integrations.map((i) => [i.provider, i]),
  ) as Record<
    string,
    { id: string; provider: string; isActive: boolean; hint: string }
  >;

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={PackageSearch}
        title="ربط شركات الشحن"
        badge={integrations.filter((i) => i.isActive).length}
        description="اربط حسابات Bosta أو Aramex لإنشاء بوالص شحن تلقائياً من داخل الطلبات"
      />
      <ShippingIntegrationsClient connected={connected} />
    </div>
  );
}
