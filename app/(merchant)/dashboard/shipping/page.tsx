import { Metadata } from "next";
import { Truck } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import ShippingMethodsClient from "./_components/ShippingMethodsClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("طرق الشحن"),
  description: tr("إدارة طرق الشحن المتاحة لعملاء المتجر"),
};
}

export default async function ShippingPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, settings: { select: { shippingPrice: true } } },
  });

  const methods = store
    ? await prisma.shippingMethod.findMany({
        where: { storeId: store.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { governorateRates: { select: { governorate: true, price: true } } },
      })
    : [];

  return (
    <div className="space-y-6" dir={tdir()}>
      <DashboardSectionHeader
        icon={Truck}
        title={tr("طرق الشحن")}
        badge={methods.length}
        description={tr("أضف طرق شحن مختلفة يختار منها العميل عند الدفع، وحدد سعر مختلف لكل محافظة")}
        actionLabel={tr("ربط شركات الشحن")}
        actionHref="/dashboard/shipping/integrations"
      />
      <ShippingMethodsClient
        initialMethods={methods}
        fallbackPrice={store?.settings?.shippingPrice ?? 0}
      />
    </div>
  );
}
