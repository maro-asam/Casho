import { Metadata } from "next";
import Link from "next/link";
import { Plug } from "lucide-react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { LargeTitle, appleButton } from "@/components/saas-page";
import { ShippingTabs } from "./_components/shipping-tabs";
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
      <LargeTitle
        title={tr("طرق الشحن")}
        subtitle={tr("أضف طرق شحن مختلفة يختار منها العميل عند الدفع، وحدد سعر مختلف لكل محافظة")}
        actions={
          <Link href="/shipping/integrations" className={appleButton.gray}>
            <Plug className="size-4" />
            {tr("ربط شركات الشحن")}
          </Link>
        }
      />
      <ShippingTabs active="methods" />
      <ShippingMethodsClient
        initialMethods={methods}
        fallbackPrice={store?.settings?.shippingPrice ?? 0}
      />
    </div>
  );
}
