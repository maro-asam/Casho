import { Metadata } from "next";
import { Truck } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import ShippingMethodsClient from "./_components/ShippingMethodsClient";

export const metadata: Metadata = {
  title: "طرق الشحن",
  description: "إدارة طرق الشحن المتاحة لعملاء المتجر",
};

export default async function ShippingPage() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, settings: { select: { shippingPrice: true } } },
  });

  const methods = store
    ? await prisma.shippingMethod.findMany({
        where: { storeId: store.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Truck}
        title="طرق الشحن"
        badge={methods.length}
        description="أضف طرق شحن مختلفة يختار منها العميل عند الدفع"
        actionLabel="ربط شركات الشحن"
        actionHref="/dashboard/shipping/integrations"
      />
      <ShippingMethodsClient
        initialMethods={methods}
        fallbackPrice={store?.settings?.shippingPrice ?? 0}
      />
    </div>
  );
}
